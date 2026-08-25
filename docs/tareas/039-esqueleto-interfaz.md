# 039 — Esqueleto de la interfaz y navegación

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Frontend · Esqueleto de interfaz |
| **Depende de** | [034](034-router.md), [038](038-sesion-y-rutas.md) |
| **Bloquea a** | 049 |

## Objetivo

El marco donde viven las pantallas. Ninguna pantalla concreta todavía.

## Pasos

- [ ] Layout raíz: contenedor de la aplicación, cabecera y área de contenido.
- [ ] En la cabecera, la identidad del usuario y el cierre de sesión.
- [ ] Navegación entre las pantallas del módulo 1, con la URL como única fuente de verdad.
- [ ] Estados compartidos de carga y de vacío, reutilizables por las pantallas.
- [ ] Instalar los componentes de shadcn que haga falta.

## Hecho cuando

- Se navega entre pantallas y el botón atrás del navegador hace lo esperado.
- Recargar en cualquier ruta deja la aplicación en esa misma ruta.
- Las pantallas de la 049 en adelante solo aportan su contenido, sin repetir marco.

## Ojo con esto

**La URL manda.** No hay un estado de navegación paralelo al router: si la pantalla activa
se guarda en un `useState`, el botón atrás y el recargado dejan de funcionar y aparecen dos
verdades sobre dónde está el usuario.

Esta tarea **no** incluye los guardas de ruta ni el estado de carga de la sesión: eso es la
[038](038-sesion-y-rutas.md). Aquí se asume que la sesión ya está resuelta.

Tampoco incluye ninguna pantalla concreta. El listado de listas es la
[049](049-ui-listas.md).
