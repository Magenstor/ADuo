# 013 — Habilitar RLS en las cinco tablas

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Backend · InsForge |
| **Depende de** | [008](008-verificar-esquema.md), [012](012-probar-auditoria.md) |
| **Bloquea a** | 014, 015 |

## Objetivo

Sin esto, todo lo que venga después es decorativo.

## Pasos

- [ ] `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` en las cinco tablas.

## Hecho cuando

- Las cinco tablas tienen RLS habilitado.

## Ojo con esto

Una política escrita sobre una tabla sin RLS habilitado **no se aplica y no avisa**. Es el fallo
silencioso clásico: parece que está protegido y no lo está.
