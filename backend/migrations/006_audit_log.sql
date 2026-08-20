-- 006 · audit_log y su trigger
-- Tareas docs/tareas/010-tabla-audit-log.md y 011-trigger-auditoria.md
-- Esquema docs/05-Esquema-BD.md 3
--
-- Aqui se resuelve la tension entre borrado fisico y auditoria de borrado:
-- una fila borrada NO puede guardar quien la borro, porque se va con sus
-- columnas puestas. Asi que el dato sale de la fila y se guarda fuera.
-- El old_data de un DELETE ES el respaldo de lo borrado.

CREATE TABLE audit_log (
  id            bigserial   PRIMARY KEY,
  table_name    text        NOT NULL,
  row_id        uuid        NOT NULL,
  household_id  uuid        NOT NULL,
  action        text        NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),

  -- NULLABLE a proposito, y es un cambio sobre el diseno original.
  -- auth.uid() devuelve NULL en consulta de administrador, asi que un
  -- NOT NULL aqui haria FALLAR toda operacion de consola: crear el hogar
  -- inicial, dar de alta miembros, cualquier arreglo manual.
  -- NULL significa "no lo hizo un usuario": consola, migracion o sistema.
  -- Un registro que se niega a anotar una accion es peor que uno que anota
  -- "no se quien fue".
  actor_id      uuid,

  occurred_at   timestamptz NOT NULL DEFAULT now(),
  old_data      jsonb,
  new_data      jsonb
);

CREATE INDEX audit_log_por_fila  ON audit_log (table_name, row_id);
CREATE INDEX audit_log_por_hogar ON audit_log (household_id, occurred_at DESC);

-- SECURITY DEFINER es IMPRESCINDIBLE: ningun usuario tiene permiso de
-- escritura sobre audit_log, y ese es justamente el punto. Nadie puede
-- escribir el registro a mano, ni modificarlo, ni borrarlo. Solo esta
-- funcion, que corre con los permisos de su dueno.
CREATE OR REPLACE FUNCTION registrar_auditoria()
RETURNS trigger AS $$
DECLARE
  fila     jsonb;
  hogar_id uuid;
BEGIN
  -- No se usa COALESCE(NEW, OLD): son de tipo record y el comportamiento
  -- no es de fiar. Un IF sobre TG_OP no deja lugar a dudas.
  IF TG_OP = 'DELETE' THEN
    fila := to_jsonb(OLD);
  ELSE
    fila := to_jsonb(NEW);
  END IF;

  -- households se identifica por su propio id; el resto lleva household_id
  hogar_id := COALESCE((fila->>'household_id')::uuid, (fila->>'id')::uuid);

  INSERT INTO audit_log (
    table_name, row_id, household_id, action, actor_id, old_data, new_data
  ) VALUES (
    TG_TABLE_NAME,
    (fila->>'id')::uuid,
    hogar_id,
    TG_OP,
    auth.uid(),
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END
  );

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- De fila, no de sentencia: asi un borrado en cascada queda registrado
-- articulo por articulo, con el contenido de cada uno.
CREATE TRIGGER households_audit_log        AFTER INSERT OR UPDATE OR DELETE ON households        FOR EACH ROW EXECUTE FUNCTION registrar_auditoria();
CREATE TRIGGER household_members_audit_log AFTER INSERT OR UPDATE OR DELETE ON household_members FOR EACH ROW EXECUTE FUNCTION registrar_auditoria();
CREATE TRIGGER shopping_lists_audit_log    AFTER INSERT OR UPDATE OR DELETE ON shopping_lists    FOR EACH ROW EXECUTE FUNCTION registrar_auditoria();
CREATE TRIGGER shopping_items_audit_log    AFTER INSERT OR UPDATE OR DELETE ON shopping_items    FOR EACH ROW EXECUTE FUNCTION registrar_auditoria();
