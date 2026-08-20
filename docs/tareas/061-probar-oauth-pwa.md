# 061 — Probar el redirect de OAuth en la PWA instalada

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Frontend · PWA y despliegue |
| **Depende de** | [025](025-alta-miembros.md), [060](060-cerrar-redirect-urls.md) |
| **Bloquea a** | 062 |

## Objetivo

El riesgo número 1 del MVP.

## Pasos

- [ ] Instalar la PWA en un móvil Android y entrar con Google.
- [ ] Instalar la PWA en un iPhone y entrar con Google.
- [ ] Comprobar que la sesión queda **dentro de la aplicación instalada**, no en el navegador.

## Hecho cuando

- Se entra y se sigue dentro de la app instalada en los dos sistemas.

## Ojo con esto

**Probarlo en el navegador de escritorio no demuestra nada:** ahí siempre funciona.

Una PWA en `display: standalone` puede abrir el redirect en el navegador del sistema y dejar la
sesión allí, fuera de la aplicación. Cruza los dos requisitos que definen el producto: entrar y ser
una app instalada.

Si falla, la salida probable son los **enlaces profundos** de la tarea 060.
