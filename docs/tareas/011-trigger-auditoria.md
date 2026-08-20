# 011 — `registrar_auditoria()` y sus triggers

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Backend · InsForge |
| **Depende de** | [010](010-tabla-audit-log.md) |
| **Bloquea a** | 012 |

## Objetivo

Que cada INSERT, UPDATE y DELETE quede registrado con su autor y su contenido.

## Pasos

- [ ] Crear la función `registrar_auditoria()` marcada **`SECURITY DEFINER`**.
- [ ] Crear el trigger `AFTER INSERT OR UPDATE OR DELETE FOR EACH ROW` en las cuatro tablas.

## Hecho cuando

- Cualquier escritura en las cuatro tablas deja un apunte en `audit_log`.

## Ojo con esto

**`SECURITY DEFINER` es imprescindible**, y por una razón que conviene entender: ningún usuario
tiene permiso de escritura sobre `audit_log`. Ese es el punto. Nadie puede escribir el registro a
mano, ni modificarlo, ni borrarlo. Solo el trigger, que corre con los permisos de su dueño.
