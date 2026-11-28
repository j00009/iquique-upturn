export type ModalidadPago = 'TOTAL' | 'DOS_CUOTAS';

export interface CargoCotizacion {
  descripcion: string;
  naturaleza: 'CARGO' | 'DESCUENTO';
  tipo: 'MONTO_FIJO' | 'PORCENTAJE';
  valor: number;
  montoCLP: number;
}

export interface VehiculoCotizacion {
  vehiculoId: number;
  patente: string;
  tipo: string;
  marca: string | null;
  modelo: string | null;
  anio: number;
  valorBaseCLP: number;
  totalCargosCLP: number;
  totalDescuentosCLP: number;
  totalCLP: number;
  cargos: CargoCotizacion[];
  descuentos: CargoCotizacion[];
}

export interface CotizacionApi {
  id: number;
  clienteId: number;
  periodo: number;
  creadaEn: string;
  expiraEn: string;
  usada: boolean;
  vehiculos: VehiculoCotizacion[];
  totalCLP: number;
}

export interface CargoCompraAplicado {
  id: number;
  descripcion: string;
  naturaleza: 'CARGO' | 'DESCUENTO';
  tipo: 'MONTO_FIJO' | 'PORCENTAJE';
  valor: number;
  montoCLP: number;
}

export interface VehiculoCompra {
  vehiculoId: number;
  patente: string;
  tipo: string;
  marca: string | null;
  modelo: string | null;
  anio: number;
  periodo: number;
  valorBaseCLP: number;
  totalCargosCLP: number;
  totalDescuentosCLP: number;
  totalCLP: number;
  cargosAplicados: CargoCompraAplicado[];
}

export interface CuotaCompra {
  id: number;
  compraId: number;
  numero: number;
  montoCLP: number;
  estado: 'PENDIENTE' | 'PAGADA';
  fechaPago: string | null;
  fechaVencimiento: string | null;
}

export interface CompraApi {
  id: number;
  clienteId: number;
  municipalidadId: number;
  periodo: number;
  modalidad: ModalidadPago;
  estado: 'PENDIENTE_DE_PAGO' | 'PARCIALMENTE_PAGADO' | 'PAGADO' | 'ANULADO';
  totalCLP: number;
  montoPagadoCLP: number;
  saldoCLP: number;
  creadaEn: string;
  vehiculos: VehiculoCompra[];
  cuotas: CuotaCompra[];
}
