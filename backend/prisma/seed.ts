import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { EstadoCompra, EstadoCuota, ModalidadPago, PrismaClient, RolUsuario } from '@prisma/client';
import { normalizarPatente, validarPatente } from '../src/utils/patente';
import { normalizarRut, validarRut } from '../src/utils/rut';

const prisma = new PrismaClient();
const periodo = new Date().getFullYear();

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('El seed de demostración no se puede ejecutar en producción.');
  }

  const [iquique, altoHospicio] = await Promise.all([
    prisma.municipalidad.upsert({ where: { nombre: 'Municipalidad de Iquique' }, update: {}, create: { nombre: 'Municipalidad de Iquique' } }),
    prisma.municipalidad.upsert({ where: { nombre: 'Municipalidad de Alto Hospicio' }, update: {}, create: { nombre: 'Municipalidad de Alto Hospicio' } }),
  ]);

  const clientesSeed = [
    { rut: '12.345.678-5', nombre: 'María González Rojas', correo: 'maria.gonzalez@example.cl', telefono: '+56 9 1234 5678', municipalidadId: iquique.id },
    { rut: '15.432.109-8', nombre: 'Jorge Araya Díaz', correo: 'jorge.araya@example.cl', telefono: '+56 9 2345 6789', municipalidadId: iquique.id },
    { rut: '8.765.432-K', nombre: 'Ana Flores Vega', correo: 'ana.flores@example.cl', telefono: '+56 9 3456 7890', municipalidadId: altoHospicio.id },
  ].map((cliente) => ({ ...cliente, rut: normalizarRut(cliente.rut) }));

  for (const cliente of clientesSeed) {
    if (!validarRut(cliente.rut)) throw new Error(`RUT de seed inválido: ${cliente.rut}`);
  }

  const clientes = await Promise.all(clientesSeed.map((cliente) => prisma.cliente.upsert({
    where: { rut: cliente.rut },
    update: { nombre: cliente.nombre, correo: cliente.correo, telefono: cliente.telefono, municipalidadId: cliente.municipalidadId },
    create: cliente,
  })));

  const passwordHash = await bcrypt.hash('Demo-2026-Cambiar', 12);
  const admin = await prisma.usuario.upsert({
    where: { correo: 'admin@muni.cl' },
    update: { rol: RolUsuario.ADMIN, municipalidadId: iquique.id, hashContrasena: passwordHash },
    create: { correo: 'admin@muni.cl', hashContrasena: passwordHash, rol: RolUsuario.ADMIN, municipalidadId: iquique.id },
  });
  const funcionario = await prisma.usuario.upsert({
    where: { correo: 'funcionario@muni.cl' },
    update: { rol: RolUsuario.FUNCIONARIO, municipalidadId: iquique.id, hashContrasena: passwordHash },
    create: { correo: 'funcionario@muni.cl', hashContrasena: passwordHash, rol: RolUsuario.FUNCIONARIO, municipalidadId: iquique.id },
  });

  const clientePrincipal = clientes[0];
  const segundoCliente = clientes[1];
  if (!clientePrincipal || !segundoCliente) throw new Error('Faltan clientes de seed para crear las cuentas.');
  await prisma.usuario.upsert({
    where: { correo: 'cliente@muni.cl' },
    update: { rol: RolUsuario.CLIENTE, clienteId: clientePrincipal.id, municipalidadId: clientePrincipal.municipalidadId, hashContrasena: passwordHash },
    create: { correo: 'cliente@muni.cl', hashContrasena: passwordHash, rol: RolUsuario.CLIENTE, clienteId: clientePrincipal.id, municipalidadId: clientePrincipal.municipalidadId },
  });
  await prisma.usuario.upsert({
    where: { correo: 'cliente2@muni.cl' },
    update: { rol: RolUsuario.CLIENTE, clienteId: segundoCliente.id, municipalidadId: segundoCliente.municipalidadId, hashContrasena: passwordHash },
    create: { correo: 'cliente2@muni.cl', hashContrasena: passwordHash, rol: RolUsuario.CLIENTE, clienteId: segundoCliente.id, municipalidadId: segundoCliente.municipalidadId },
  });

  const vehiculosSeed = [
    { patente: 'KJBH45', tipo: 'auto', marca: 'Suzuki', modelo: 'Swift', anio: 2020, cliente: clientes[0] },
    { patente: 'BQ1234', tipo: 'moto', marca: 'Honda', modelo: 'CB190R', anio: 2022, cliente: clientes[0] },
    { patente: 'WXYZ21', tipo: 'camioneta', marca: 'Nissan', modelo: 'Navara', anio: 2021, cliente: clientes[0] },
    { patente: 'HGFD90', tipo: 'camioneta', marca: 'Toyota', modelo: 'Hilux', anio: 2023, cliente: clientes[1] },
    { patente: 'PLMN78', tipo: 'auto', marca: 'Chevrolet', modelo: 'Sail', anio: 2019, cliente: clientes[1] },
    { patente: 'CD1234', tipo: 'auto', marca: 'Kia', modelo: 'Morning', anio: 2021, cliente: clientes[2] },
  ];
  const vehiculos = [];
  for (const datos of vehiculosSeed) {
    if (!datos.cliente) throw new Error('Falta un cliente de seed.');
    const patente = normalizarPatente(datos.patente);
    if (!validarPatente(patente)) throw new Error(`Patente de seed inválida: ${patente}`);
    vehiculos.push(await prisma.vehiculo.upsert({
      where: { patente },
      update: {
        tipo: datos.tipo, marca: datos.marca, modelo: datos.modelo, anio: datos.anio,
        clienteId: datos.cliente.id, municipalidadId: datos.cliente.municipalidadId,
      },
      create: {
        patente, tipo: datos.tipo, marca: datos.marca, modelo: datos.modelo, anio: datos.anio,
        clienteId: datos.cliente.id, municipalidadId: datos.cliente.municipalidadId,
      },
    }));
  }

  const tarifasSeed = [
    { municipalidadId: iquique.id, categoria: 'auto', valorBaseCLP: 78_000 },
    { municipalidadId: iquique.id, categoria: 'moto', valorBaseCLP: 42_000 },
    { municipalidadId: altoHospicio.id, categoria: 'auto', valorBaseCLP: 72_000 },
    { municipalidadId: altoHospicio.id, categoria: 'moto', valorBaseCLP: 33_000 },
  ];
  for (const tarifa of tarifasSeed) {
    await prisma.tarifaPermiso.upsert({
      where: { municipalidadId_periodo_categoria: { municipalidadId: tarifa.municipalidadId, periodo: 2026, categoria: tarifa.categoria } },
      update: { valorBaseCLP: tarifa.valorBaseCLP, activo: true },
      create: { ...tarifa, periodo: 2026, activo: true },
    });
  }
  const cargosSeed = [
    { municipalidadId: iquique.id, descripcion: 'Cargo fijo de administración', naturaleza: 'CARGO' as const, tipo: 'MONTO_FIJO' as const, valor: 5_000, vigenciaDesde: new Date('2026-01-01T00:00:00Z'), vigenciaHasta: new Date('2026-12-31T00:00:00Z'), activo: true },
    { municipalidadId: iquique.id, descripcion: 'Recargo porcentual', naturaleza: 'CARGO' as const, tipo: 'PORCENTAJE' as const, valor: 5, vigenciaDesde: new Date('2026-01-01T00:00:00Z'), vigenciaHasta: new Date('2026-12-31T00:00:00Z'), activo: true },
    { municipalidadId: iquique.id, descripcion: 'Descuento municipal', naturaleza: 'DESCUENTO' as const, tipo: 'MONTO_FIJO' as const, valor: 3_000, vigenciaDesde: new Date('2026-01-01T00:00:00Z'), vigenciaHasta: new Date('2026-12-31T00:00:00Z'), activo: true },
    { municipalidadId: iquique.id, descripcion: 'Cargo inactivo de prueba', naturaleza: 'CARGO' as const, tipo: 'MONTO_FIJO' as const, valor: 9_000, vigenciaDesde: new Date('2026-01-01T00:00:00Z'), vigenciaHasta: new Date('2026-12-31T00:00:00Z'), activo: false },
    { municipalidadId: iquique.id, descripcion: 'Cargo vencido de prueba', naturaleza: 'CARGO' as const, tipo: 'MONTO_FIJO' as const, valor: 8_000, vigenciaDesde: new Date('2025-01-01T00:00:00Z'), vigenciaHasta: new Date('2025-12-31T00:00:00Z'), activo: true },
    { municipalidadId: altoHospicio.id, descripcion: 'Cargo comunal Alto Hospicio', naturaleza: 'CARGO' as const, tipo: 'MONTO_FIJO' as const, valor: 2_500, vigenciaDesde: new Date('2026-01-01T00:00:00Z'), vigenciaHasta: new Date('2026-12-31T00:00:00Z'), activo: true },
  ];
  for (const cargo of cargosSeed) {
    const current = await prisma.cargoAdicional.findFirst({ where: { municipalidadId: cargo.municipalidadId, descripcion: cargo.descripcion } });
    if (current) await prisma.cargoAdicional.update({ where: { id: current.id }, data: cargo });
    else await prisma.cargoAdicional.create({ data: cargo });
  }

  // El seed se limita a los clientes de demostración y al período actual.
  // Ejecutarlo en una BD de desarrollo elimina sus compras de ese período y las reconstruye.
  await prisma.compra.deleteMany({ where: { periodo, clienteId: { in: clientes.map((cliente) => cliente.id) } } });

  const [vehiculoPagado, vehiculoParcial] = [vehiculos[3], vehiculos[4]];
  const clientePagado = clientes[1];
  const clienteParcial = clientes[1];
  if (!vehiculoPagado || !vehiculoParcial || !clientePagado || !clienteParcial) throw new Error('No se pudieron crear los registros de seed.');

  await prisma.compra.create({
    data: {
      clienteId: clientePagado.id,
      municipalidadId: clientePagado.municipalidadId,
      periodo,
      modalidad: ModalidadPago.DOS_CUOTAS,
      estado: EstadoCompra.PAGADO,
      totalCLP: 120_000,
      montoPagadoCLP: 120_000,
      creadaPorId: admin.id,
      detalles: { create: { vehiculoId: vehiculoPagado.id, periodo, valorBaseCLP: 120_000, totalCargosCLP: 0, totalDescuentosCLP: 0, totalCLP: 120_000 } },
      cuotas: {
        create: [
          { numero: 1, montoCLP: 60_000, estado: EstadoCuota.PAGADA, fechaPago: new Date() },
          { numero: 2, montoCLP: 60_000, estado: EstadoCuota.PAGADA, fechaPago: new Date() },
        ],
      },
    },
  });

  await prisma.compra.create({
    data: {
      clienteId: clienteParcial.id,
      municipalidadId: clienteParcial.municipalidadId,
      periodo,
      modalidad: ModalidadPago.DOS_CUOTAS,
      estado: EstadoCompra.PARCIALMENTE_PAGADO,
      totalCLP: 100_001,
      montoPagadoCLP: 50_000,
      creadaPorId: funcionario.id,
      detalles: { create: { vehiculoId: vehiculoParcial.id, periodo, valorBaseCLP: 100_001, totalCargosCLP: 0, totalDescuentosCLP: 0, totalCLP: 100_001 } },
      cuotas: {
        create: [
          { numero: 1, montoCLP: 50_000, estado: EstadoCuota.PAGADA, fechaPago: new Date() },
          { numero: 2, montoCLP: 50_001, estado: EstadoCuota.PENDIENTE },
        ],
      },
    },
  });

  console.info(`Seed listo: ${clientes.length} clientes, ${vehiculos.length} vehículos, período ${periodo}.`);
  console.info('Cuentas de prueba creadas: admin@muni.cl, funcionario@muni.cl, cliente@muni.cl y cliente2@muni.cl.');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
