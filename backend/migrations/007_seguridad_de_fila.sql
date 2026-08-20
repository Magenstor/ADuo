-- 007 · Seguridad de fila
-- Tareas docs/tareas/013, 014 y 015 · Esquema docs/05-Esquema-BD.md 5 y 6
--
-- LA FUNCION DE ABAJO NO ES UN ATAJO, ES OBLIGATORIA.
--
-- La regla natural seria escribir en cada politica:
--   household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
--
-- Pero en household_members esa politica consulta household_members, y
-- household_members tiene RLS, cuya politica vuelve a consultar
-- household_members: RECURSION INFINITA. Postgres corta con un error y la
-- tabla queda inaccesible.
--
-- SECURITY DEFINER corre con los permisos del dueno y NO aplica RLS, asi que
-- rompe el ciclo. STABLE ademas permite a Postgres evaluarla una vez por
-- sentencia en lugar de una vez por fila.

CREATE OR REPLACE FUNCTION hogares_del_usuario()
RETURNS setof uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT household_id FROM household_members WHERE user_id = auth.uid()
$$;

ALTER TABLE households        ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists    ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log         ENABLE ROW LEVEL SECURITY;

-- households -----------------------------------------------------------
-- El INSERT es permisivo a proposito: al crear un hogar todavia no existe
-- la fila de pertenencia, asi que no hay membresia contra la que validar.
CREATE POLICY households_leer   ON households FOR SELECT TO authenticated USING (id IN (SELECT hogares_del_usuario()));
CREATE POLICY households_crear  ON households FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY households_editar ON households FOR UPDATE TO authenticated USING (id IN (SELECT hogares_del_usuario())) WITH CHECK (id IN (SELECT hogares_del_usuario()));
CREATE POLICY households_borrar ON households FOR DELETE TO authenticated USING (id IN (SELECT hogares_del_usuario()));

-- household_members ----------------------------------------------------
-- Sin INSERT ni DELETE para el cliente: en el MVP las altas se hacen a mano
-- en la consola (tarea 025). Cada uno si puede editar SU nombre visible.
CREATE POLICY members_leer      ON household_members FOR SELECT TO authenticated USING (household_id IN (SELECT hogares_del_usuario()));
CREATE POLICY members_editarme  ON household_members FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- shopping_lists y shopping_items --------------------------------------
-- La misma regla en los cuatro verbos. Cubrir solo SELECT dejaria ESCRIBIR
-- en el hogar ajeno aunque no se pudiera leer.
CREATE POLICY listas_leer   ON shopping_lists FOR SELECT TO authenticated USING (household_id IN (SELECT hogares_del_usuario()));
CREATE POLICY listas_crear  ON shopping_lists FOR INSERT TO authenticated WITH CHECK (household_id IN (SELECT hogares_del_usuario()));
CREATE POLICY listas_editar ON shopping_lists FOR UPDATE TO authenticated USING (household_id IN (SELECT hogares_del_usuario())) WITH CHECK (household_id IN (SELECT hogares_del_usuario()));
CREATE POLICY listas_borrar ON shopping_lists FOR DELETE TO authenticated USING (household_id IN (SELECT hogares_del_usuario()));

CREATE POLICY articulos_leer   ON shopping_items FOR SELECT TO authenticated USING (household_id IN (SELECT hogares_del_usuario()));
CREATE POLICY articulos_crear  ON shopping_items FOR INSERT TO authenticated WITH CHECK (household_id IN (SELECT hogares_del_usuario()));
CREATE POLICY articulos_editar ON shopping_items FOR UPDATE TO authenticated USING (household_id IN (SELECT hogares_del_usuario())) WITH CHECK (household_id IN (SELECT hogares_del_usuario()));
CREATE POLICY articulos_borrar ON shopping_items FOR DELETE TO authenticated USING (household_id IN (SELECT hogares_del_usuario()));

-- audit_log ------------------------------------------------------------
-- SOLO lectura, y para nadie mas. Sin politica de INSERT/UPDATE/DELETE:
-- en Postgres, lo que ninguna politica permite queda prohibido. Escribe
-- unicamente registrar_auditoria(), que es SECURITY DEFINER.
-- Un registro de auditoria que se puede editar no sirve para nada.
CREATE POLICY audit_log_leer ON audit_log FOR SELECT TO authenticated USING (household_id IN (SELECT hogares_del_usuario()));
