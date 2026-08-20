-- 002 · household_members
-- Tarea docs/tareas/005-tabla-household-members.md · Esquema docs/05-Esquema-BD.md 4.2
--
-- La tabla de pertenencia. Sostiene la unica regla de seguridad del producto.
--
-- Clave primaria propia y NO (household_id, user_id) compuesta: audit_log.row_id
-- es un uuid unico por fila, y una tabla con clave compuesta no tiene tal cosa.
-- La clave subrogada cuesta una columna y mantiene la auditoria uniforme.
--
-- Un usuario pertenece a un solo hogar: es regla de APLICACION, no del modelo.
-- Esta tabla ya soporta N a N.

CREATE TABLE household_members (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  uuid        NOT NULL REFERENCES households (id) ON DELETE CASCADE,
  user_id       uuid        NOT NULL REFERENCES auth.users (id),
  display_name  text        NOT NULL CHECK (length(btrim(display_name)) > 0),

  created_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid        NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  updated_by    uuid        NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),

  UNIQUE (household_id, user_id)
);

-- La regla de seguridad de cada tabla resuelve
--   household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
-- en cada consulta, asi que este indice lo lee todo el producto.
CREATE INDEX household_members_por_usuario ON household_members (user_id);
