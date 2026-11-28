import { NaturalezaCargo, PrismaClient, TipoCargo } from '@prisma/client';
import { AppError } from '../errors/app-error';
import { ClientesService } from './clientes.service';
import { LogService } from './log.service';
import { ValoresService } from './valores.service';

const vehiculo = { id: 1, patente: 'ABCD12', tipo: 'auto', municipalidadId: 1, marca: 'Toyota', modelo: 'Yaris', anio: 2020 };
function setup(base = 10_000, cargos: any[] = []) {
  const db = {
    tarifaPermiso: { findFirst: jest.fn().mockResolvedValue({ valorBaseCLP: base }) },
    cargoAdicional: { findMany: jest.fn().mockResolvedValue(cargos) },
    vehiculo: { findMany: jest.fn() },
  } as unknown as PrismaClient;
  const clientes = {} as ClientesService;
  return { db, service: new ValoresService(db, new LogService(), clientes) };
}
const fecha = new Date('2026-06-01T12:00:00Z');

describe('calcularValorVehiculo', () => {
  test('sin cargos devuelve el valor base', async () => {
    const { service } = setup();
    await expect(service.calcularValorVehiculo(vehiculo, 2026, fecha)).resolves.toMatchObject({ valorBaseCLP: 10_000, totalCargosCLP: 0, totalDescuentosCLP: 0, totalCLP: 10_000 });
  });
  test('suma un monto fijo', async () => {
    const { service } = setup(10_000, [{ descripcion: 'fijo', naturaleza: NaturalezaCargo.CARGO, tipo: TipoCargo.MONTO_FIJO, valor: 1_500 }]);
    await expect(service.calcularValorVehiculo(vehiculo, 2026, fecha)).resolves.toMatchObject({ totalCargosCLP: 1_500, totalCLP: 11_500 });
  });
  test('calcula porcentaje sobre base y redondea con Math.round', async () => {
    const { service } = setup(12_345, [{ descripcion: 'siete por ciento', naturaleza: NaturalezaCargo.CARGO, tipo: TipoCargo.PORCENTAJE, valor: 7 }]);
    await expect(service.calcularValorVehiculo(vehiculo, 2026, fecha)).resolves.toMatchObject({ cargos: [{ montoCLP: 864 }], totalCLP: 13_209 });
  });
  test('aplica un descuento', async () => {
    const { service } = setup(10_000, [{ descripcion: 'descuento', naturaleza: NaturalezaCargo.DESCUENTO, tipo: TipoCargo.MONTO_FIJO, valor: 2_000 }]);
    await expect(service.calcularValorVehiculo(vehiculo, 2026, fecha)).resolves.toMatchObject({ totalDescuentosCLP: 2_000, totalCLP: 8_000 });
  });
  test('consulta solo cargos activos y vigentes en la fecha y municipalidad', async () => {
    const { db, service } = setup();
    await service.calcularValorVehiculo(vehiculo, 2026, fecha);
    expect(db.cargoAdicional.findMany).toHaveBeenCalledWith({ where: {
      municipalidadId: 1, activo: true, vigenciaDesde: { lte: fecha }, vigenciaHasta: { gte: fecha },
    }, orderBy: { id: 'asc' } });
  });
  test('excluye cargos inactivos desde la consulta a la BD', async () => {
    const { db, service } = setup();
    await service.calcularValorVehiculo(vehiculo, 2026, fecha);
    expect(db.cargoAdicional.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ activo: true }) }));
  });
  test('excluye cargos vencidos comparando la fecha del cálculo con la vigencia', async () => {
    const { db, service } = setup();
    await service.calcularValorVehiculo(vehiculo, 2026, fecha);
    expect(db.cargoAdicional.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({
      vigenciaDesde: { lte: fecha }, vigenciaHasta: { gte: fecha },
    }) }));
  });
  test('tarifa inexistente da 409 con mensaje en español', async () => {
    const { db, service } = setup();
    (db.tarifaPermiso.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(service.calcularValorVehiculo(vehiculo, 2026, fecha)).rejects.toMatchObject({ codigo: 409, message: 'No hay tarifa configurada para auto en el período 2026.' } satisfies Partial<AppError>);
  });
  test('el total queda limitado a cero si los descuentos superan el valor', async () => {
    const { service } = setup(1_000, [{ descripcion: 'descuento alto', naturaleza: NaturalezaCargo.DESCUENTO, tipo: TipoCargo.MONTO_FIJO, valor: 5_000 }]);
    await expect(service.calcularValorVehiculo(vehiculo, 2026, fecha)).resolves.toMatchObject({ totalDescuentosCLP: 5_000, totalCLP: 0 });
  });
});
