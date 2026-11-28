export interface UsuarioSesion {
  id: number;
  correo: string;
  rol: 'CLIENTE' | 'FUNCIONARIO' | 'ADMIN';
  clienteId: number | null;
  municipalidadId: number | null;
}

export interface ClienteApi {
  id: number;
  nombre: string;
  rut: string;
  correo: string | null;
  telefono: string | null;
  municipalidad: { id: number; nombre: string };
  cantidadVehiculos: number;
}

export interface VehiculoApi {
  id: number;
  patente: string;
  tipo: string;
  marca: string | null;
  modelo: string | null;
  anio: number;
  municipalidad: { id: number; nombre: string };
  estadoPermiso: 'sin_permiso' | 'pendiente_de_pago' | 'parcialmente_pagado' | 'pagado';
}

export interface PaginaClientesApi {
  data: ClienteApi[];
  total: number;
  page: number;
  limit: number;
}
