# Pruebas que hay que hacer tras el primer login

**Fecha:** 20 de agosto de 2026
**Documento padre:** `00-Vision-y-Modulos.md`
**Cierra las tareas:** [016](tareas/016-probar-aislamiento.md), [023](tareas/023-capturar-eventos.md),
[024](tareas/024-crear-hogar.md) y [025](tareas/025-alta-miembros.md)

---

## 1. Por qué existe este documento

El backend del módulo 1 está aplicado y verificado. Pero hay una cosa que conviene decir sin
rodeos, porque es fácil quedarse con la impresión equivocada:

> **Todo lo verificado el 20 de agosto de 2026 corrió como administrador, y el administrador se
> salta la seguridad de fila. Las políticas de RLS no se han ejercitado ni una sola vez.**

No es un descuido: no había forma de hacerlo. `auth.users` estaba vacía, así que no existía ningún
usuario con quien probar. Pero significa que la parte del sistema de la que depende **toda** la
privacidad del producto está escrita, aplicada y **sin estrenar**.

### Qué está probado y qué no

| Comprobación | Estado |
|---|---|
| FK compuesta, `CHECK`, cascade | ✅ Probado (transacción abortada) |
| Auditoría de INSERT, UPDATE, DELETE y cascade | ✅ Probado |
| `created_at`/`created_by` inmutables | ✅ Probado |
| Realtime publica en el canal correcto | ✅ Probado |
| **Que un usuario NO lea el hogar ajeno** | ❌ **Sin probar** |
| **Que un usuario NO escriba en el hogar ajeno** | ❌ **Sin probar** |
| **Que `audit_log` sea de solo lectura para el cliente** | ❌ **Sin probar** |
| **Que `actor_id` recoja al usuario real** | ❌ **Sin probar** (siempre salió `NULL`) |
| **Que la suscripción al canal rechace al ajeno** | ❌ **Sin probar** |
| **Forma real del evento en el cliente** | ❌ **Sin probar** |

Las cinco últimas son el motivo de este documento.

## 2. Antes de empezar

Hace falta:

1. La pantalla de login funcionando (tarea [036](tareas/036-login-google.md)).
2. **Dos cuentas de Google distintas.** Una sola no sirve: la mitad de las pruebas consiste en
   comprobar que la segunda **no** ve lo de la primera.
3. El `accessToken` de cada una. Se saca de la respuesta del login, o de las herramientas de
   desarrollo del navegador tras entrar.

Variables que se usan abajo:

```bash
URL=https://rn8y8xbv.eu-central.insforge.app
ADMIN=<la API key de administrador, la de .mcp.json>
TOK_A=<accessToken del usuario A>
TOK_B=<accessToken del usuario B>
```

## 3. Paso A — Crear el hogar (tarea 024)

Con los dos usuarios ya registrados, sacar sus ids:

```bash
curl -s -X POST "$URL/api/database/advance/rawsql/unrestricted" \
  -H "Authorization: Bearer $ADMIN" -H 'Content-Type: application/json' \
  -d '{"query":"SELECT id, email FROM auth.users ORDER BY created_at"}'
```

> Se usa la variante `unrestricted` porque la normal **bloquea el acceso a `auth.users`**.

Crear el hogar y su lista inicial. **`created_by` va explícito**: `auth.uid()` devuelve `NULL` en
consulta de administrador y el `NOT NULL` rechazaría el `INSERT`.

```sql
INSERT INTO households (name, created_by, updated_by)
VALUES ('Casa', '<ID_A>', '<ID_A>') RETURNING id;

INSERT INTO shopping_lists (household_id, name, created_by, updated_by)
VALUES ('<ID_HOGAR>', 'La compra', '<ID_A>', '<ID_A>');
```

**Hecho cuando:** existe un hogar con una lista llamada "La compra".

## 4. Paso B — Dar de alta a los dos miembros (tarea 025)

```sql
INSERT INTO household_members (household_id, user_id, display_name, created_by, updated_by) VALUES
  ('<ID_HOGAR>', '<ID_A>', 'Carlos', '<ID_A>', '<ID_A>'),
  ('<ID_HOGAR>', '<ID_B>', 'Ella',   '<ID_A>', '<ID_A>');
```

**Hecho cuando:** los dos usuarios ven el mismo hogar al entrar.

## 5. Paso C — Que la auditoría recoja al usuario real

Hasta ahora `actor_id` siempre salió `NULL`, porque solo escribía el administrador. Esta es la
primera vez que se comprueba que un usuario de verdad queda registrado.

```bash
# Añadir un artículo COMO USUARIO A, no como administrador
curl -s -X POST "$URL/api/database/records/shopping_items" \
  -H "Authorization: Bearer $TOK_A" -H 'Content-Type: application/json' \
  -H 'Prefer: return=representation' \
  -d '[{"list_id":"<ID_LISTA>","household_id":"<ID_HOGAR>","content":"leche"}]'
```

Y comprobar el apunte:

```sql
SELECT action, actor_id, new_data->>'content', new_data->>'created_by'
FROM audit_log WHERE table_name = 'shopping_items' ORDER BY occurred_at DESC LIMIT 1;
```

| Debe cumplirse | Si falla, significa |
|---|---|
| `actor_id` = ID_A, no `NULL` | `auth.uid()` no llega al trigger desde una petición REST |
| `created_by` = ID_A | El `DEFAULT`/trigger de auditoría no se está aplicando |

**Prueba extra — que no se pueda mentir.** Mandar un `created_by` falso y comprobar que el trigger
lo ignora:

```bash
curl -s -X POST "$URL/api/database/records/shopping_items" \
  -H "Authorization: Bearer $TOK_A" -H 'Content-Type: application/json' \
  -H 'Prefer: return=representation' \
  -d '[{"list_id":"<ID_LISTA>","household_id":"<ID_HOGAR>","content":"pan","created_by":"<ID_B>"}]'
```

El artículo tiene que quedar con `created_by = ID_A`. Si queda con ID_B, **la auditoría se puede
falsificar** y el trigger no está imponiendo nada.

## 6. Paso D — Aislamiento entre hogares (tarea 016)

**Esta es la prueba importante.** Es el criterio de aceptación 12 y la única garantía de privacidad
del producto.

Primero, un segundo hogar para el usuario B, con B como único miembro:

```sql
INSERT INTO households (name, created_by, updated_by)
VALUES ('Casa B', '<ID_B>', '<ID_B>') RETURNING id;

INSERT INTO household_members (household_id, user_id, display_name, created_by, updated_by)
VALUES ('<ID_HOGAR_B>', '<ID_B>', 'Ella', '<ID_B>', '<ID_B>');
```

> Para esta prueba B **no** puede estar también en el hogar A. Si hace falta, se quita su fila de
> `household_members` del hogar A y se vuelve a poner al terminar.

Ahora, **todo lo de abajo con `$TOK_B`**, contra los datos del hogar A:

```bash
# 1 · LEER — debe devolver [] vacío, NO las filas
curl -s "$URL/api/database/records/shopping_items?household_id=eq.<ID_HOGAR>" \
  -H "Authorization: Bearer $TOK_B"

# 2 · ESCRIBIR — debe fallar
curl -s -X POST "$URL/api/database/records/shopping_items" \
  -H "Authorization: Bearer $TOK_B" -H 'Content-Type: application/json' \
  -d '[{"list_id":"<ID_LISTA>","household_id":"<ID_HOGAR>","content":"intruso"}]'

# 3 · MODIFICAR — debe afectar a 0 filas
curl -s -X PATCH "$URL/api/database/records/shopping_items?id=eq.<ID_ARTICULO>" \
  -H "Authorization: Bearer $TOK_B" -H 'Content-Type: application/json' \
  -H 'Prefer: return=representation' -d '{"content":"secuestrado"}'

# 4 · BORRAR — debe afectar a 0 filas
curl -s -X DELETE "$URL/api/database/records/shopping_items?id=eq.<ID_ARTICULO>" \
  -H "Authorization: Bearer $TOK_B" -H 'Prefer: return=representation'

# 5 · AUDITORÍA AJENA — debe devolver [] vacío
curl -s "$URL/api/database/records/audit_log?household_id=eq.<ID_HOGAR>" \
  -H "Authorization: Bearer $TOK_B"

# 6 · ESCRIBIR EN LA AUDITORÍA — debe fallar SIEMPRE, hasta la propia
curl -s -X POST "$URL/api/database/records/audit_log" \
  -H "Authorization: Bearer $TOK_B" -H 'Content-Type: application/json' \
  -d '[{"table_name":"shopping_items","row_id":"00000000-0000-0000-0000-000000000000","household_id":"<ID_HOGAR_B>","action":"INSERT"}]'
```

**Los seis tienen que fallar o devolver vacío.** Repetir la 1 con `$TOK_A` para confirmar que el
dueño **sí** ve sus datos: si las seis fallan y la de A también, no has probado el aislamiento, has
roto la aplicación.

> ⚠️ **Ojo con el 3 y el 4.** Con RLS, un `UPDATE` o `DELETE` que no encuentra filas visibles
> devuelve **éxito con cero filas afectadas**, no un error. Un `200 []` es el resultado correcto.
> Lo que sería un fallo grave es que devuelva la fila modificada o borrada.

**Cierra el criterio de aceptación 12.**

## 7. Paso E — Realtime desde un cliente (tarea 023)

Del lado del servidor ya está verificado: publica `list.insert`, `list.update`, `list.delete`,
`item.insert`, `item.update` e `item.delete` en `household:<uuid>`, con la fila entera de payload.
Falta lo que solo se ve desde el cliente.

```javascript
const insforge = createClient({ baseUrl, anonKey });
await insforge.auth.signInWithOAuth('google', { redirectTo });

insforge.realtime.on('error', e => console.error('ERROR', e));
await insforge.realtime.connect();

const r = await insforge.realtime.subscribe(`household:${idHogar}`);
console.log('suscripcion:', r);

for (const ev of ['list.insert','list.update','list.delete',
                  'item.insert','item.update','item.delete']) {
  insforge.realtime.on(ev, p => console.log(ev, JSON.stringify(p, null, 2)));
}
```

Qué hay que anotar:

1. **La forma exacta del payload**, incluido **qué trae `meta`**. De eso depende cómo se escribe el
   traductor a direct writes de la tarea [045](tareas/045-realtime-direct-writes.md).
2. **Que la suscripción ajena se rechace.** Con el token de B, `subscribe('household:<ID_HOGAR_A>')`
   tiene que devolver `ok: false`. Si devuelve `ok: true`, **la política del apartado 5 no está
   filtrando** y cualquiera escucha cualquier hogar.
3. **El orden en un borrado de lista.** Ya se sabe que el servidor emite `list.delete` **antes** que
   `item.delete`; hay que confirmar que llega igual al cliente.

## 8. Qué hacer si algo falla

| Falla | Qué mirar |
|---|---|
| B lee datos de A | La política del apartado 4 de `007_seguridad_de_fila.sql`, y que RLS esté activo |
| B escribe en el hogar de A | Falta el `WITH CHECK`, o la política de `INSERT` es demasiado laxa |
| `actor_id` sale `NULL` con usuario real | `auth.uid()` no llega al trigger desde REST. Bloquea la auditoría entera |
| `created_by` acepta un valor falso | El trigger no impone. Revisar `005_auditoria_en_fila.sql` |
| B se suscribe al canal de A | `realtime.channel_name()` no devuelve lo esperado en la política |
| Recursión infinita al leer `household_members` | Alguna política dejó de usar `hogares_del_usuario()` |

**Ninguna de estas se arregla en el frontend.** Todas son de base de datos, y todas hay que
resolverlas antes de dar el MVP por bueno.
