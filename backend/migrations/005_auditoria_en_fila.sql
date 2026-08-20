-- 005 · Auditoria en la propia fila
-- Tarea docs/tareas/009-auditoria-en-fila.md · Esquema docs/05-Esquema-BD.md 2
--
-- created_by/updated_by tienen DEFAULT auth.uid(), pero un DEFAULT se puede
-- sobreescribir mandando un valor: un cliente podria firmar como otro.
-- Este trigger los IMPONE, y una auditoria en la que se puede mentir no es
-- una auditoria.
--
-- Solo impone cuando hay usuario. Con auth.uid() NULL (consulta de
-- administrador) respeta lo que venga, porque si no las migraciones y el
-- alta manual de miembros chocarian contra el NOT NULL.

CREATE OR REPLACE FUNCTION set_auditoria()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := now();
    IF auth.uid() IS NOT NULL THEN
      NEW.created_by := auth.uid();
    END IF;
  ELSE
    -- created_at/created_by son inmutables: un UPDATE no los reescribe.
    NEW.created_at := OLD.created_at;
    NEW.created_by := OLD.created_by;
  END IF;

  NEW.updated_at := now();
  IF auth.uid() IS NOT NULL THEN
    NEW.updated_by := auth.uid();
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_by := COALESCE(NEW.updated_by, OLD.updated_by);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER households_auditoria        BEFORE INSERT OR UPDATE ON households        FOR EACH ROW EXECUTE FUNCTION set_auditoria();
CREATE TRIGGER household_members_auditoria BEFORE INSERT OR UPDATE ON household_members FOR EACH ROW EXECUTE FUNCTION set_auditoria();
CREATE TRIGGER shopping_lists_auditoria    BEFORE INSERT OR UPDATE ON shopping_lists    FOR EACH ROW EXECUTE FUNCTION set_auditoria();
CREATE TRIGGER shopping_items_auditoria    BEFORE INSERT OR UPDATE ON shopping_items    FOR EACH ROW EXECUTE FUNCTION set_auditoria();
