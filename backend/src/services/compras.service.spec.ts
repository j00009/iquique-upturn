import { EstadoCompra, ModalidadPago } from '@prisma/client';
import { AppError } from '../errors/app-error';
import { LogService } from './log.service';
import { ComprasService } from './compras.service';

const user = { id: 7, correo: 'maria@example.cl', rol: 'CLIENTE' as const, clienteId: 1, municipalidadId: 1 };
const expiraEn = new Date(Date.now() + 60_000);

function row(vehiculoId: number, totalCLP: number) {
  return {
    id: vehiculoId,
    cotizacionId: 55,
    vehiculoId,
    patente: `ABCD${vehiculoId}`,
    tipo: 'auto',
    marca: 'Marca',
    modelo: 'Modelo',
    anio: 2022,
    valorBaseCLP: totalCLP,
    totalCargosCLP: 0,
    totalDescuentosCLP: 0,
    totalCLP,
    cargos: [] as any[],
    descuentos: [] as any[],
  };
}

function quote(vehiculos = [row(1, 100)]) {
  return { id: 55, clienteId: 1, municipalidadId: 1, periodo: 2026, creadaPorId: 7, creadaEn: new Date(), expiraEn, usada: false, vehiculos };
}

function setup(options: { quote?: ReturnType<typeof quote>; validator?: jest.Mock } = {}) {
  const quoteRow = options.quote ?? quote();
  const clientes = { validarVehiculosDelCliente: options.validator ?? jest.fn().mockResolvedValue(undefined) };
  const valores = { calcularValorVehiculo: jest.fn() };
  const compraCreada = {
    id: 90, clienteId: 1, municipalidadId: 1, periodo: 2026, modalidad: ModalidadPago.TOTAL,
    estado: EstadoCompra.PENDIENTE_DE_PAGO, totalCLP: quoteRow.vehiculos.reduce((s, v) => s + v.totalCLP, 0),
    montoPagadoCLP: 0, creadaEn: new Date(), detalles: [], cuotas: [],
  };
  const tx = {
    compra: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue(compraCreada) },
    cotizacion: { findUnique: jest.fn().mockResolvedValue(quoteRow), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    cliente: { findUnique: jest.fn().mockResolvedValue({ id: 1, municipalidadId: 1 }) },
  };
  const db = {
    ...tx,
    cliente: { findUnique: jest.fn().mockResolvedValue({ id: 1, municipalidadId: 1 }) },
    vehiculo: { findMany: jest.fn() },
    cotizacion: { create: jest.fn() },
    $transaction: jest.fn((fn: (transaction: any) => unknown) => fn(tx)),
  } as any;
  return { db, tx, clientes, valores, service: new ComprasService(db, new LogService(), clientes as any, valores as any) };
}

describe('ComprasService', () => {
  test('cotiza dos vehículos y conserva la suma exacta', async () => {
    const { db, service, valores } = setup();
    db.vehiculo.findMany.mockResolvedValue([
      { id: 1, patente: 'ABCD12', tipo: 'auto', marca: 'A', modelo: 'Uno', anio: 2020, municipalidadId: 1 },
      { id: 2, patente: 'EFGH34', tipo: 'moto', marca: 'B', modelo: 'Dos', anio: 2021, municipalidadId: 1 },
    ]);
    valores.calcularValorVehiculo
      .mockResolvedValueOnce({ vehiculoId: 1, patente: 'ABCD12', tipo: 'auto', marca: 'A', modelo: 'Uno', anio: 2020, valorBaseCLP: 80, cargos: [], descuentos: [], totalCargosCLP: 0, totalDescuentosCLP: 0, totalCLP: 80 })
      .mockResolvedValueOnce({ vehiculoId: 2, patente: 'EFGH34', tipo: 'moto', marca: 'B', modelo: 'Dos', anio: 2021, valorBaseCLP: 120, cargos: [], descuentos: [], totalCargosCLP: 0, totalDescuentosCLP: 0, totalCLP: 120 });
    db.cotizacion.create.mockImplementation(async ({ data }: any) => ({ ...data, id: 55, creadaEn: new Date(), usada: false, vehiculos: data.vehiculos.create }));
    const result = await service.crearCotizacion({ clienteId: 1, vehiculoIds: [1, 2], periodo: 2026 }, user);
    expect(result.totalCLP).toBe(200);
    expect(db.cotizacion.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ vehiculos: { create: expect.arrayContaining([expect.objectContaining({ totalCLP: 80 }), expect.objectContaining({ totalCLP: 120 })]) } }) }));
  });

  test('divide un total impar en dos cuotas y asigna el resto a la segunda', async () => {
    const { service, tx } = setup({ quote: quote([row(1, 50), row(2, 51)]) });
    await service.crearCompra(55, ModalidadPago.DOS_CUOTAS, 'test-key-0001', user);
    expect(tx.compra.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      totalCLP: 101,
      cuotas: { create: [{ numero: 1, montoCLP: 50 }, { numero: 2, montoCLP: 51 }] },
    }) }));
  });

  test('rechaza una cotización expirada', async () => {
    const expired = { ...quote(), expiraEn: new Date(Date.now() - 1) };
    const { service, tx } = setup({ quote: expired });
    await expect(service.crearCompra(55, ModalidadPago.TOTAL, 'test-key-0002', user)).rejects.toMatchObject({ codigo: 409, message: 'La cotización expiró. Solicite una nueva.' } satisfies Partial<AppError>);
    expect(tx.compra.create).not.toHaveBeenCalled();
  });

  test('rechaza si el vehículo quedó pagado después de cotizar', async () => {
    const validator = jest.fn().mockRejectedValue(new AppError(409, 'Uno o más vehículos no están disponibles para la compra.'));
    const { service, tx } = setup({ validator });
    await expect(service.crearCompra(55, ModalidadPago.TOTAL, 'test-key-0003', user)).rejects.toMatchObject({ codigo: 409 });
    expect(tx.compra.create).not.toHaveBeenCalled();
  });

  test('mantiene los montos históricos de la cotización aunque cambien las tarifas', async () => {
    const snapshot = quote([row(1, 83_900), row(2, 46_100)]);
    snapshot.vehiculos[0] = {
      ...snapshot.vehiculos[0]!,
      valorBaseCLP: 80_000,
      totalCargosCLP: 5_000,
      totalDescuentosCLP: 1_100,
      cargos: [{ descripcion: 'Cargo histórico', naturaleza: 'CARGO', tipo: 'MONTO_FIJO', valor: 5_000, montoCLP: 5_000 }],
      descuentos: [{ descripcion: 'Descuento histórico', naturaleza: 'DESCUENTO', tipo: 'MONTO_FIJO', valor: 1_100, montoCLP: 1_100 }],
    };
    const { service, tx, valores } = setup({ quote: snapshot });
    await service.crearCompra(55, ModalidadPago.TOTAL, 'test-key-0004', user);
    const data = tx.compra.create.mock.calls[0]?.[0].data;
    expect(data.totalCLP).toBe(130_000);
    expect(data.detalles.create.map((d: any) => d.totalCLP)).toEqual([83_900, 46_100]);
    expect(data.detalles.create[0].cargosAplicados.create).toEqual([
      { descripcion: 'Cargo histórico', naturaleza: 'CARGO', tipo: 'MONTO_FIJO', valor: 5_000, montoCLP: 5_000 },
      { descripcion: 'Descuento histórico', naturaleza: 'DESCUENTO', tipo: 'MONTO_FIJO', valor: 1_100, montoCLP: 1_100 },
    ]);
    expect(valores.calcularValorVehiculo).not.toHaveBeenCalled();
  });
});
