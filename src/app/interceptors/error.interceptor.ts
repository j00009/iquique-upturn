import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AlertService } from '../services/alert';
import { AuthService } from '../services/auth';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const alerts = inject(AlertService);
  const auth = inject(AuthService);
  return next(req).pipe(catchError((error: unknown) => {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        auth.cerrarSesion(!req.url.endsWith('/auth/login'));
        alerts.error(error.error?.mensaje || 'La sesión terminó. Vuelve a iniciar sesión.');
      } else if (error.status === 403) {
        alerts.warning(error.error?.mensaje || 'No tienes permiso para realizar esta acción.');
      } else if (error.status === 0) {
        alerts.error('No se pudo conectar con el servidor');
      } else {
        alerts.error(error.error?.mensaje || 'Ocurrió un error al procesar la solicitud.');
      }
    } else {
      alerts.error('Ocurrió un error al procesar la solicitud.');
    }
    return throwError(() => error);
  }));
};
