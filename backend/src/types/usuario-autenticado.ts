export type Rol = 'CLIENTE' | 'FUNCIONARIO' | 'ADMIN';

export interface UsuarioAutenticado {
  id: number;
  correo: string;
  rol: Rol;
  clienteId: number | null;
  municipalidadId: number | null;
}
