-- 008 · Realtime
-- Tareas docs/tareas/017 a 022 · Stack docs/02-Decisiones-tecnicas-stack.md 4.1
--
-- InsForge NO hace streaming automatico de cambios de tabla. No existe
-- "suscribete a shopping_items". Es pub/sub sobre canales con nombre, y los
-- eventos de base de datos los publicamos nosotros desde un trigger.
--
-- Un canal por hogar: el filtrado por hogar NO se programa, es la direccion
-- del canal. Los patrones usan LIKE con ':' de separador y '%' de comodin.

INSERT INTO realtime.channels (pattern, description, enabled)
VALUES ('household:%', 'Cambios de listas y articulos de un hogar', true)
ON CONFLICT DO NOTHING;

-- SECURITY DEFINER para poder escribir en realtime.messages, que abajo se
-- cierra al cliente. El payload lleva la FILA ENTERA en jsonb porque es lo
-- que necesita un direct write de TanStack DB para insertar o actualizar
-- sin ir a buscar nada mas.
CREATE OR REPLACE FUNCTION publicar_cambio()
RETURNS trigger AS $$
DECLARE
  fila   jsonb;
  evento text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    fila := to_jsonb(OLD);
  ELSE
    fila := to_jsonb(NEW);
  END IF;

  -- TG_ARGV[0] es 'list' o 'item'; TG_OP se pasa a minusculas.
  evento := TG_ARGV[0] || '.' || lower(TG_OP);

  PERFORM realtime.publish(
    'household:' || (fila->>'household_id'),
    evento,
    fila
  );

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER shopping_lists_realtime
  AFTER INSERT OR UPDATE OR DELETE ON shopping_lists
  FOR EACH ROW EXECUTE FUNCTION publicar_cambio('list');

CREATE TRIGGER shopping_items_realtime
  AFTER INSERT OR UPDATE OR DELETE ON shopping_items
  FOR EACH ROW EXECUTE FUNCTION publicar_cambio('item');

-- El realtime esta ABIERTO POR DEFECTO: anon y authenticated pueden
-- suscribirse a cualquier canal habilitado. Sin estas dos lineas, cualquiera
-- con la anon key escucha la lista de la compra de cualquier hogar.
ALTER TABLE realtime.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Suscripcion: se usa realtime.channel_name() y NO pattern, porque la tabla
-- guarda el patron ('household:%') mientras que el cliente pide un canal
-- resuelto ('household:<uuid>').
CREATE POLICY hogar_suscribirse ON realtime.channels
  FOR SELECT TO authenticated
  USING (
    pattern = 'household:%'
    AND NULLIF(split_part(realtime.channel_name(), ':', 2), '')::uuid
        IN (SELECT hogares_del_usuario())
  );

-- Publicacion: SIN politica de INSERT, para nadie. Si el cliente pudiera
-- publicar, podria inyectar en la pantalla del otro un cambio que nunca paso
-- por la base de datos ni por RLS. Las escrituras van por PostgREST a la
-- tabla, el trigger publica, el evento vuelve. En ese orden, siempre.

-- PENDIENTE (tarea 022): la retencion NO se puede fijar desde aqui.
--   UPDATE realtime.config SET retention_days = 7;
-- devuelve "permission denied for table config" incluso como administrador.
-- Hay que hacerlo desde el Dashboard (Realtime > Settings) o con
-- PATCH /api/realtime/config y un token de admin.
--
-- Importa: los payloads se PERSISTEN en realtime.messages, o sea que el texto
-- de los articulos acaba duplicado ahi. Es una segunda copia de datos privados.
-- retention_days = NULL significa guardarlos PARA SIEMPRE, y ahora esta en NULL.
