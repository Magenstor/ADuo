-- 001 · households
-- Tarea docs/tareas/004-tabla-households.md · Esquema docs/05-Esquema-BD.md 4.1
--
-- El hogar es la raiz de todo: de el cuelgan miembros, listas y articulos,
-- y despues gastos y bolsas.
--
-- Sin invite_code: no hay flujo de invitacion en el MVP (decision 2026-08-20).
-- Anadirlo despues es un ALTER TABLE ADD COLUMN, no una migracion de datos.

CREATE TABLE households (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL CHECK (length(btrim(name)) > 0),

  -- Auditoria en fila (docs/05-Esquema-BD.md 2).
  -- created_by/updated_by llevan DEFAULT auth.uid() para que el cliente no
  -- tenga que mandarlos. La migracion 005 anade el trigger que los impone,
  -- porque un DEFAULT se puede sobreescribir y entonces se podria mentir.
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid        NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid        NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id)
);
