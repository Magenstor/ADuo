# Esquema de base de datos

**Versión:** 3.0
**Fecha:** 20 de agosto de 2026
**Documento padre:** `00-Vision-y-Modulos.md`
**Alcance:** módulo 1. Los módulos 2 y 3 se añaden aquí cuando se definan.

---

## 1. Las dos decisiones que gobiernan el esquema

**1. El borrado es físico.** Se borra la fila. No hay `deleted_at`, no hay filtros de vivo/muerto,
no hay filas fantasma.

**2. Toda tabla que no sea de autenticación lleva auditoría completa, temporal y de usuario.**

Estas dos decisiones parecen incompatibles: una fila borrada se lleva consigo cualquier columna que
dijera quién la borró. **Y por eso la auditoría de borrado no vive en la fila, vive aparte**, en una
tabla de auditoría de solo-añadir escrita por triggers.

El resultado es mejor que meter `deleted_at` en cada tabla:

| | Borrado lógico | Borrado físico + registro de auditoría |
|---|---|---|
| Consultas | Toda lectura filtra `deleted_at IS NULL`; olvidarlo una vez resucita filas | Consultas normales, nada que olvidar |
| `ON DELETE CASCADE` | No se dispara: hay que replicarlo a mano | Funciona |
| Índices únicos | Parciales, o una fila muerta bloquea el valor para siempre | Normales |
| Tiempo real | Un borrado llega como UPDATE y hay que traducirlo | Un borrado llega como DELETE |
| Qué se guarda | Quién borró y cuándo | Quién borró, cuándo **y el contenido completo de la fila** |
| Deshacer un borrado | Gratis: se limpia la columna | Manual: leer el registro y reinsertar |

Lo único que se pierde es el "deshacer" gratuito, y no es requisito de ningún RF. En una lista de la
compra, recuperar un artículo borrado es volver a escribir "leche".

## 2. Auditoría en la propia fila

Toda tabla del hogar lleva:

```sql
created_at  timestamptz NOT NULL DEFAULT now(),
created_by  uuid        NOT NULL REFERENCES auth.users(id),
updated_at  timestamptz NOT NULL DEFAULT now(),
updated_by  uuid        NOT NULL REFERENCES auth.users(id)
```

`created_at` absorbe lo que antes eran campos propios como `joined_at`. No se duplica.

**`updated_at` y `updated_by` los mantiene un trigger, nunca el cliente.** Un cliente que manda su
propio `updated_by` puede mentir, y entonces la auditoría deja de servir para lo único que sirve.

```sql
CREATE OR REPLACE FUNCTION set_auditoria()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 3. La tabla de auditoría

```sql
CREATE TABLE audit_log (
  id            bigserial   PRIMARY KEY,
  table_name    text        NOT NULL,
  row_id        uuid        NOT NULL,
  household_id  uuid        NOT NULL,
  action        text        NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  actor_id      uuid        NOT NULL,
  occurred_at   timestamptz NOT NULL DEFAULT now(),
  old_data      jsonb,
  new_data      jsonb
);

CREATE INDEX audit_log_por_fila ON audit_log (table_name, row_id);
CREATE INDEX audit_log_por_hogar ON audit_log (household_id, occurred_at DESC);
```

- `old_data` y `new_data` guardan la fila entera como JSON. En un DELETE, `old_data` **es** el
  respaldo del artículo borrado: contenido, quién lo creó, si estaba comprado y por quién.
- `household_id` está aquí para que la seguridad de fila funcione igual que en el resto. Para las
  filas de `households` es su propio `id`.
- **Es de solo añadir.** No se actualiza ni se borra. Ver apartado 6.

### 3.1 El trigger

Uno genérico para todas las tablas, `AFTER INSERT OR UPDATE OR DELETE FOR EACH ROW`:

```sql
CREATE OR REPLACE FUNCTION registrar_auditoria()
RETURNS trigger AS $$
DECLARE
  fila     jsonb;
  hogar_id uuid;
BEGIN
  fila := to_jsonb(COALESCE(NEW, OLD));

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
```

**`SECURITY DEFINER` es imprescindible.** Sin él el trigger falla, porque ningún usuario tiene
permiso de escritura sobre `audit_log` — y ese es justamente el punto: nadie puede escribir el
registro a mano, solo el trigger.

**Los borrados en cascada también quedan registrados.** Un trigger de fila se dispara una vez por
cada fila que el cascade elimina, así que borrar una lista con veinte artículos produce veintiún
apuntes, cada uno con su contenido.

> ✅ **Confirmado el 20 de agosto de 2026:** InsForge permite crear triggers y funciones
> `SECURITY DEFINER`. La auditoría de este documento se implementa tal y como está diseñada.
>
> ✅ **`auth.uid()` existe en InsForge** (confirmado el 20 de agosto de 2026 en sus ejemplos de RLS).
>
> ⚠️ **Sigue pendiente de la tarea [002](tareas/002-confirmar-auth-users.md):** el nombre exacto de la tabla de usuarios a la que apuntan
> las FK. El esquema asume `auth.users`. Es un ajuste de nombres al aplicar el DDL, no un riesgo de
> diseño. El acceso por OAuth **no cambia nada aquí**: la identidad sigue siendo la del usuario de auth.

## 4. Tablas del módulo 1

### 4.1 `households`

```sql
CREATE TABLE households (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name  text NOT NULL,
  -- auditoría (apartado 2)
);
```

**Sin límite de miembros** (decisión del 17 de agosto de 2026). La palabra "hogar" significa *grupo
de personas que comparten gastos*, no *exactamente dos*.

**Sin código de invitación** (decisión del 20 de agosto de 2026). No hay columna `invite_code` ni
flujo de invitación en el MVP. Los miembros se dan de alta **insertando la fila de
`household_members` a mano** desde la consola de InsForge. Para un hogar de dos personas es una
operación que se hace una vez en la vida; construir un flujo de invitación para eso es trabajo que
no compra nada todavía.

> **Esto no deja ninguna costura pendiente.** Añadir después una columna `invite_code` es un
> `ALTER TABLE ADD COLUMN` sobre un puñado de filas, no una migración de datos reales. Es justo lo
> contrario del caso de la referencia a bolsa del apartado 7.2 de `00-Vision-y-Modulos.md`, que sí
> hay que dejar preparada desde el principio porque retrofitarla obligaría a recalcular meses de
> gastos ya registrados. Diferir esto es gratis; diferir aquello no lo sería.

### 4.2 `household_members`

```sql
CREATE TABLE household_members (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id),
  display_name  text NOT NULL CHECK (length(btrim(display_name)) > 0),
  -- auditoría (apartado 2)

  UNIQUE (household_id, user_id)
);
```

**Clave primaria propia y no `(household_id, user_id)` compuesta**, aunque con borrado físico la
compuesta sería viable. El motivo es el registro de auditoría: su columna `row_id` es un uuid único
por fila, y una tabla con clave compuesta no tiene tal cosa. La clave subrogada cuesta una columna y
mantiene la auditoría uniforme en todas las tablas.

**Un usuario pertenece a un solo hogar en el MVP.** Es regla de aplicación, no del modelo: esta tabla
ya soporta N a N. Levantarla más adelante cuesta una pantalla de cambio de grupo, no una migración.

### 4.3 `shopping_lists`

```sql
CREATE TABLE shopping_lists (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name          text NOT NULL CHECK (length(btrim(name)) > 0),
  -- auditoría (apartado 2)

  CONSTRAINT shopping_lists_id_household UNIQUE (id, household_id)
);
```

El `UNIQUE (id, household_id)` parece redundante —`id` ya es único— y no lo es: existe para que
`shopping_items` pueda apuntar con una clave ajena compuesta. Ver 4.4.

### 4.4 `shopping_items`

```sql
CREATE TABLE shopping_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id       uuid NOT NULL,
  household_id  uuid NOT NULL,
  content       text NOT NULL CHECK (length(btrim(content)) > 0),
  is_bought     boolean NOT NULL DEFAULT false,
  bought_by     uuid REFERENCES auth.users(id),
  bought_at     timestamptz,
  -- auditoría (apartado 2)

  -- El artículo y su lista pertenecen forzosamente al mismo hogar,
  -- y borrar la lista arrastra sus artículos.
  FOREIGN KEY (list_id, household_id)
    REFERENCES shopping_lists (id, household_id) ON DELETE CASCADE,

  CONSTRAINT comprado_coherente CHECK (
    (is_bought = false AND bought_at IS NULL     AND bought_by IS NULL) OR
    (is_bought = true  AND bought_at IS NOT NULL AND bought_by IS NOT NULL)
  )
);

CREATE INDEX shopping_items_por_lista ON shopping_items (list_id);
```

**`household_id` está desnormalizado a propósito.** El artículo ya pertenece a un hogar a través de
su lista, así que el dato es redundante. Se duplica porque la regla de seguridad es *"solo filas de
mi hogar"*, y tenerla escrita igual en todas las tablas —sin un join para averiguar el hogar en cada
comprobación— la hace uniforme, más barata y mucho más difícil de equivocar.

**La clave ajena compuesta cierra el agujero de esa desnormalización.** Apuntando a
`(id, household_id)` de la lista, la base de datos garantiza por sí sola que no puede existir un
artículo cuyo hogar discrepe del de su lista. Sin ella haría falta un trigger, que es más código y
más fácil de saltarse.

**Y con borrado físico, el `ON DELETE CASCADE` resuelve RF-1.3 solo.** Borrar la lista borra sus
artículos, sin operación explícita ni transacción a mano. Cada artículo queda registrado
individualmente en `audit_log` con su contenido.

**`comprado_coherente`** hace cumplir en la base de datos lo que pide RF-1.5: `is_bought` es la
fuente de verdad, y al desmarcar se limpian `bought_at` y `bought_by`. Interpretar un `bought_at`
viejo como estado actual sería un error silencioso, y esta restricción lo hace imposible.

## 5. Seguridad de fila

Regla única para todas las tablas del hogar:

```sql
-- Patrón, a adaptar a la sintaxis exacta de InsForge (spike 1.3)
CREATE POLICY solo_mi_hogar ON shopping_items
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );
```

Se aplica igual a `households`, `household_members`, `shopping_lists` y `shopping_items`. **Funciona
con N miembros sin cambios:** nunca dependió del límite de dos.

## 6. Seguridad de la tabla de auditoría

Un registro de auditoría que se puede modificar no es un registro de auditoría.

- **Lectura:** solo los miembros del hogar, con la misma regla del apartado 5.
- **Escritura directa:** prohibida para todos. Sin política de INSERT. Solo entra por el trigger,
  que puede porque es `SECURITY DEFINER`.
- **UPDATE y DELETE:** sin política, para nadie. Es de solo añadir.
- Ni el cliente ni la aplicación tocan nunca esta tabla salvo para leerla.

## 7. Lo que esta decisión provoca en el módulo 2

**Sin límite de miembros, `split_a` pasa de inadvisable a imposible.** Un porcentaje único que
describe "la parte de la persona A" no puede repartir entre tres personas, y no hay forma de
parchearlo. El reparto vive obligatoriamente en una tabla de partes por usuario:

```
expense_shares
  id          uuid pk
  expense_id  fk → expenses  ON DELETE CASCADE
  user_id     fk → usuario
  share_bps   int            -- puntos base, 0–10000, suman 10000
  + auditoría
```

Puntos base y no porcentajes enteros: un reparto a tres partes iguales no se puede expresar con
enteros de 0 a 100, y con 0 a 10000 el error de redondeo se vuelve despreciable frente al céntimo.

Se anota aquí porque es consecuencia directa del esquema de hoy, no una decisión del módulo 2. Ver
el apartado 7.3 de `00-Vision-y-Modulos.md`.

## 8. Sin definir todavía

- **Cómo se invita a un miembro.** Diferido al terminar el MVP: por ahora la fila de
  `household_members` se inserta a mano. Ver apartado 4.1.
- **Nombre real de la función de usuario autenticado** en InsForge y su esquema de usuarios. Se
  resuelve al aplicar el DDL (tarea [008](tareas/008-verificar-esquema.md)). Ya no bloquea nada:
  los triggers y `SECURITY DEFINER`
  están confirmados.
- **Retención de `audit_log`.** Crece para siempre. A esta escala es irrelevante —500 MB para texto
  de dos o tres personas—, pero conviene decidir si algún día se poda.
