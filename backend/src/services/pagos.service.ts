import { EstadoCompra, EstadoCuota, ModalidadPago, Prisma, PrismaClient } from '@prisma/client';
import { AppError } from '../errors/app-error';
import { LogService } from './log.service';
import type { UsuarioAutenticado } from '../types/usuario-autenticado';

type CuotaBloqueada = {
  id: number;
  compraId: number;
  numero: number;
  montoCLP: number;
  estado: EstadoCuota;
  modalidad: ModalidadPago;
  clienteId: number;
  municipalidadId: number;
  totalCLP: number;
  montoPagadoCLP: number;
  estadoCompra: EstadoCompra;
};

const pagoInclude = { compra: true, cuota: true } satisfies Prisma.PagoInclude;

export class PagosService {
  constructor(private readonly db: PrismaClient, private readonly logs: LogService) {}

  async pagarCuota(compraId: number, numero: number, montoCLP: number, idempotencyKey: string, user: UsuarioAutenticado) {
    try {
      const resultado = await this.db.$transaction(async (tx) => {
        const previo = await tx.pago.findUnique({ where: { idempotencyKey }, include: pagoInclude });
        if (previo) {
          this.validarAcceso(previo.compra, user);
          return this.serializarPago(previo, previo.compra.estado, previo.compra.montoPagadoCLP);
        }

        // Lock both rows: the quota prevents duplicate payment, and the purchase prevents lost updates
        // when two different quotas are paid concurrently.
        const filas = await tx.$queryRaw<CuotaBloqueada[]>(Prisma.sql`
          SELECT q."id", q."compraId", q."numero", q."montoCLP", q."estado",
                 c."modalidad", c."clienteId", c."municipalidadId", c."totalCLP",
                 c."montoPagadoCLP", c."estado" AS "estadoCompra"
          FROM "Cuota" q
          INNER JOIN "Compra" c ON c."id" = q."compraId"
          WHERE c."id" = ${compraId} AND q."numero" = ${numero}
          FOR UPDATE OF q, c
        `);
        const cuota = filas[0];
        if (!cuota) throw new AppError(404, 'No se encontró la cuota solicitada.');
        this.validarAcceso(cuota, user);

        // A concurrent request with the same key may have completed while this transaction waited on the row lock.
        const repetido = await tx.pago.findUnique({ where: { idempotencyKey }, include: pagoInclude });
        if (repetido) {
          this.validarAcceso(repetido.compra, user);
          return this.serializarPago(repetido, repetido.compra.estado, repetido.compra.montoPagadoCLP);
        }

        if (cuota.estadoCompra === EstadoCompra.ANULADO) throw new AppError(409, 'No se puede pagar una compra anulada.');
        if (cuota.estado === EstadoCuota.PAGADA) throw new AppError(409, 'La cuota ya fue pagada');
        if (montoCLP !== cuota.montoCLP) throw new AppError(422, 'El monto debe ser exactamente igual al de la cuota.');
        if (numero === 2 && cuota.modalidad === ModalidadPago.DOS_CUOTAS) {
          const primera = await tx.cuota.findUnique({ where: { compraId_numero: { compraId, numero: 1 } }, select: { estado: true } });
          if (primera?.estado !== EstadoCuota.PAGADA) throw new AppError(409, 'Debe pagar la primera cuota antes de la segunda.');
        }

        const fechaPago = new Date();
        const secuencia = await tx.$queryRaw<Array<{ numero: bigint }>>(Prisma.sql`SELECT nextval('"pago_folio_seq"') AS numero`);
        const correlativo = secuencia[0]?.numero;
        if (correlativo === undefined) throw new Error('No se pudo obtener el correlativo del folio.');
        const folio = `MUN-${fechaPago.getFullYear()}-${String(correlativo).padStart(6, '0')}`;
        const pago = await tx.pago.create({
          data: { compraId, cuotaId: cuota.id, montoCLP, fechaPago, folio, idempotencyKey, registradoPorId: user.id },
          include: pagoInclude,
        });
        await tx.cuota.update({ where: { id: cuota.id }, data: { estado: EstadoCuota.PAGADA, fechaPago } });
        const montoPagadoCLP = cuota.montoPagadoCLP + montoCLP;
        const estado = montoPagadoCLP >= cuota.totalCLP ? EstadoCompra.PAGADO : EstadoCompra.PARCIALMENTE_PAGADO;
        await tx.compra.update({ where: { id: compraId }, data: { montoPagadoCLP, estado } });
        return this.serializarPago(pago, estado, montoPagadoCLP);
      });
      this.logs.info('pagos.registrar', user.id);
      return resultado;
    } catch (error) {
      if (this.esP2002(error)) {
        const existente = await this.db.pago.findUnique({ where: { idempotencyKey }, include: pagoInclude });
        if (existente) {
          this.validarAcceso(existente.compra, user);
          this.logs.info('pagos.idempotente', user.id);
          return this.serializarPago(existente, existente.compra.estado, existente.compra.montoPagadoCLP);
        }
        throw new AppError(409, 'La cuota ya fue pagada.');
      }
      throw error;
    }
  }

  async obtenerEstado(compraId: number, user: UsuarioAutenticado) {
    const compra = await this.db.compra.findUnique({
      where: { id: compraId },
      select: { id: true, clienteId: true, municipalidadId: true, estado: true, totalCLP: true, montoPagadoCLP: true, cuotas: { orderBy: { numero: 'asc' } } },
    });
    if (!compra) throw new AppError(404, 'No se encontró la compra.');
    this.validarAcceso(compra, user);
    this.logs.info('compras.obtener_estado', user.id);
    return {
      estado: compra.estado,
      total: compra.totalCLP,
      pagado: compra.montoPagadoCLP,
      saldo: compra.totalCLP - compra.montoPagadoCLP,
      cuotas: compra.cuotas,
    };
  }

  private validarAcceso(compra: { clienteId: number; municipalidadId: number }, user: UsuarioAutenticado): void {
    if (user.rol === 'CLIENTE' && user.clienteId !== compra.clienteId) throw new AppError(403, 'No tiene permiso para acceder a esta compra.');
    if (user.rol === 'FUNCIONARIO' && user.municipalidadId !== compra.municipalidadId) throw new AppError(403, 'Solo puede acceder a compras de su municipalidad.');
  }

  private serializarPago(pago: Prisma.PagoGetPayload<{ include: typeof pagoInclude }>, estado: EstadoCompra, montoPagadoCLP: number) {
    return {
      id: pago.id,
      compraId: pago.compraId,
      cuotaId: pago.cuotaId,
      montoCLP: pago.montoCLP,
      fechaPago: pago.fechaPago,
      folio: pago.folio,
      estadoCompra: estado,
      montoPagadoCLP,
      saldoCLP: pago.compra.totalCLP - montoPagadoCLP,
    };
  }

  private esP2002(error: unknown): error is Prisma.PrismaClientKnownRequestError {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }
}
