import { EstadoCompra, EstadoCuota, ModalidadPago } from '@prisma/client';
import { AppError } from '../errors/app-error';
import { ClientesService } from './clientes.service';
import { LogService } from './log.service';
import { PagosService } from './pagos.service';

const user = { id: 7, correo: 'cliente@muni.cl', rol: 'CLIENTE' as const, clienteId: 1, municipalidadId: 1 };

function setup(options: { modalidad?: ModalidadPago; amounts?: number[]; cuotaPagada?: boolean } = {}) {
  const cuotaEstado = new Map<number, EstadoCuota>([[1, options.cuotaPagada ? EstadoCuota.PAGADA : EstadoCuota.PENDIENTE], [2, EstadoCuota.PENDIENTE]]);
  const amounts = options.amounts ?? [100];
  const pagos: any[] = [];
  const state = { pagado: options.cuotaPagada ? amounts[0] ?? 0 : 0, compra: options.cuotaPagada ? EstadoCompra.PAGADO : EstadoCompra.PENDIENTE_DE_PAGO };
  const tx: any = {};
  const findPayment = (key: string) => {
    const pago = pagos.find((item) => item.idempotencyKey === key);
    return pago ? { ...pago, compra: { ...pago.compra, estado: state.compra, montoPagadoCLP: state.pagado } } : null;
  };
  tx.pago = {
    findUnique: jest.fn(({ where }: any) => Promise.resolve(findPayment(where.idempotencyKey))),
    create: jest.fn(async ({ data }: any) => {
      const pago = { id: pagos.length + 1, ...data, compra: { id: data.compraId, clienteId: 1, municipalidadId: 1, totalCLP: amounts.reduce((sum, n) => sum + n, 0), estado: state.compra, montoPagadoCLP: state.pagado }, cuota: { id: data.cuotaId } };
      pagos.push(pago);
      return pago;
    }),
  };
  tx.$queryRaw = jest.fn(async (query: any) => {
    if (String(query.sql).includes('nextval')) return [{ numero: 1n }];
    const numero = Number(query.values?.[1] ?? 1);
    const montoCLP = amounts[numero - 1];
    if (montoCLP === undefined) return [];
    return [{
      id: numero,
      compraId: 20,
      numero,
      montoCLP,
      estado: cuotaEstado.get(numero) ?? EstadoCuota.PENDIENTE,
      modalidad: options.modalidad ?? ModalidadPago.TOTAL,
      clienteId: 1,
      municipalidadId: 1,
      totalCLP: amounts.reduce((sum, n) => sum + n, 0),
      montoPagadoCLP: state.pagado,
      estadoCompra: state.compra,
    }];
  });
  tx.cuota = {
    findUnique: jest.fn(async () => ({ estado: cuotaEstado.get(1) })),
    update: jest.fn(async ({ where, data }: any) => { cuotaEstado.set(where.id, data.estado); return { id: where.id, ...data }; }),
  };
  tx.compra = {
    update: jest.fn(async ({ data }: any) => { state.pagado = data.montoPagadoCLP; state.compra = data.estado; return { id: 20, ...data }; }),
  };
  let tail = Promise.resolve();
  const db: any = {
    pago: { findUnique: jest.fn(({ where }: any) => Promise.resolve(findPayment(where.idempotencyKey))) },
    compra: { findUnique: jest.fn(async () => ({ id: 20, clienteId: 1, municipalidadId: 1, estado: state.compra, totalCLP: amounts.reduce((sum, n) => sum + n, 0), montoPagadoCLP: state.pagado, cuotas: amounts.map((montoCLP, index) => ({ id: index + 1, numero: index + 1, montoCLP, estado: cuotaEstado.get(index + 1) })) })) },
    cliente: { findFirst: jest.fn(async () => ({ vehiculos: [{ id: 1, patente: 'ABCD12', tipo: 'auto', marca: 'Marca', modelo: 'Modelo', anio: 2020, municipalidad: { id: 1, nombre: 'Municipalidad' }, detallesCompra: [{ compra: { estado: state.compra } }] }] })) },
    $transaction: jest.fn(async (fn: (transaction: any) => Promise<unknown>) => {
      let release!: () => void;
      const previous = tail;
      tail = new Promise<void>((resolve) => { release = resolve; });
      await previous;
      try { return await fn(tx); } finally { release(); }
    }),
  };
  const logs = new LogService();
  return {
    db,
    tx,
    pagos,
    state,
    service: new PagosService(db, logs),
    clientes: new ClientesService(db, logs),
  };
}

describe('PagosService', () => {
  test('registra el pago total y emite un folio secuencial con formato municipal', async () => {
    const { service, tx } = setup();
    const pago = await service.pagarCuota(20, 1, 100, 'pago-total-0001', user);
    expect(pago).toMatchObject({ compraId: 20, cuotaId: 1, montoCLP: 100, estadoCompra: EstadoCompra.PAGADO, montoPagadoCLP: 100, saldoCLP: 0 });
    expect(pago.folio).toMatch(/^MUN-\d{4}-\d{6}$/);
    expect(tx.$queryRaw).toHaveBeenCalledTimes(2); // bloqueo de cuota y nextval de PostgreSQL
  });

  test('paga cuota 1 y luego cuota 2, y actualiza estadoPermiso entre ambos pagos', async () => {
    const { service, clientes, state } = setup({ modalidad: ModalidadPago.DOS_CUOTAS, amounts: [50, 51] });
    await service.pagarCuota(20, 1, 50, 'pago-cuota-uno', user);
    expect(state.compra).toBe(EstadoCompra.PARCIALMENTE_PAGADO);
    await expect(clientes.listarVehiculos(1, 2026, user)).resolves.toMatchObject([{ estadoPermiso: 'parcialmente_pagado' }]);
    await service.pagarCuota(20, 2, 51, 'pago-cuota-dos', user);
    expect(state.compra).toBe(EstadoCompra.PAGADO);
    await expect(clientes.listarVehiculos(1, 2026, user)).resolves.toMatchObject([{ estadoPermiso: 'pagado' }]);
  });

  test('no permite pagar la segunda cuota antes de que la primera esté pagada', async () => {
    const { service, tx } = setup({ modalidad: ModalidadPago.DOS_CUOTAS, amounts: [50, 51] });
    await expect(service.pagarCuota(20, 2, 51, 'pago-cuota-dos-antes', user)).rejects.toMatchObject({ codigo: 409 });
    expect(tx.pago.create).not.toHaveBeenCalled();
  });

  test('devuelve 409 al intentar pagar una cuota ya pagada con otra clave', async () => {
    const { service } = setup({ cuotaPagada: true });
    await expect(service.pagarCuota(20, 1, 100, 'otra-clave-duplicado', user)).rejects.toMatchObject({ codigo: 409, message: 'La cuota ya fue pagada' } satisfies Partial<AppError>);
  });

  test('devuelve 422 si el monto no coincide exactamente con la cuota', async () => {
    const { service, tx } = setup();
    await expect(service.pagarCuota(20, 1, 99, 'monto-incorrecto', user)).rejects.toMatchObject({ codigo: 422 });
    expect(tx.pago.create).not.toHaveBeenCalled();
  });

  test('dos solicitudes simultáneas con la misma clave generan y devuelven un solo pago', async () => {
    const { service, tx, pagos } = setup();
    const [primero, segundo] = await Promise.all([
      service.pagarCuota(20, 1, 100, 'pago-concurrente', user),
      service.pagarCuota(20, 1, 100, 'pago-concurrente', user),
    ]);
    expect(tx.pago.create).toHaveBeenCalledTimes(1);
    expect(pagos).toHaveLength(1);
    expect(segundo.id).toBe(primero.id);
    expect(segundo.folio).toBe(primero.folio);
  });
});
