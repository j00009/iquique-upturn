import 'dotenv/config';
import { crearApp } from './app';
import { prisma } from './db/prisma';

const port = Number(process.env.PORT ?? 3000);
const app = crearApp();
const server = app.listen(port, () => {
  console.info(JSON.stringify({ nivel: 'info', operacion: 'api.iniciada', fecha_hora: new Date().toISOString(), puerto: port }));
});

function cerrar(): void {
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0));
  });
}

process.on('SIGINT', cerrar);
process.on('SIGTERM', cerrar);
