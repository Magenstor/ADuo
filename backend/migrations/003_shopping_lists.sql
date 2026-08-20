-- 003 · shopping_lists
-- Tarea docs/tareas/006-tabla-shopping-lists.md · Esquema docs/05-Esquema-BD.md 4.3

CREATE TABLE shopping_lists (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  uuid        NOT NULL REFERENCES households (id) ON DELETE CASCADE,
  name          text        NOT NULL CHECK (length(btrim(name)) > 0),

  created_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid        NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  updated_by    uuid        NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),

  -- Parece redundante porque id ya es unico, y NO lo es: es lo unico que
  -- permite que shopping_items apunte con una clave ajena COMPUESTA
  -- (list_id, household_id). Sin esta linea, la migracion 004 no se puede
  -- aplicar: Postgres exige una restriccion unica sobre las columnas
  -- referenciadas.
  CONSTRAINT shopping_lists_id_household UNIQUE (id, household_id)
);

CREATE INDEX shopping_lists_por_hogar ON shopping_lists (household_id);
