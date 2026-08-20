-- 004 · shopping_items
-- Tarea docs/tareas/007-tabla-shopping-items.md · Esquema docs/05-Esquema-BD.md 4.4

CREATE TABLE shopping_items (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id       uuid        NOT NULL,

  -- Desnormalizado A PROPOSITO. El articulo ya pertenece a un hogar a traves
  -- de su lista, asi que el dato es redundante. Se duplica para que la regla
  -- de seguridad sea IDENTICA en las cuatro tablas, sin joins.
  household_id  uuid        NOT NULL,

  content       text        NOT NULL CHECK (length(btrim(content)) > 0),
  is_bought     boolean     NOT NULL DEFAULT false,
  bought_by     uuid        REFERENCES auth.users (id),
  bought_at     timestamptz,

  created_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid        NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  updated_by    uuid        NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),

  -- Cierra el agujero que abre la desnormalizacion de arriba: un articulo NO
  -- puede colgar de una lista de otro hogar. Lo garantiza la base de datos,
  -- de forma declarativa, sin trigger y sin codigo de aplicacion.
  -- Y el ON DELETE CASCADE hace que borrar una lista arrastre sus articulos.
  FOREIGN KEY (list_id, household_id)
    REFERENCES shopping_lists (id, household_id) ON DELETE CASCADE,

  -- is_bought es la unica fuente de verdad. Desmarcar obliga a limpiar las
  -- dos columnas: sin esto, un articulo desmarcado conserva quien lo compro
  -- y la auditoria empieza a mentir.
  CONSTRAINT comprado_coherente CHECK (
    (is_bought = false AND bought_at IS NULL     AND bought_by IS NULL) OR
    (is_bought = true  AND bought_at IS NOT NULL AND bought_by IS NOT NULL)
  )
);

CREATE INDEX shopping_items_por_lista ON shopping_items (list_id);
CREATE INDEX shopping_items_por_hogar ON shopping_items (household_id);
