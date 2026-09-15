import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/shared/ui/button'
import { useArticulos } from '../../application/useArticulos'
import { useListas } from '../../application/useListas'
import type { Articulo } from '../../domain/articulo'
import { coincideConBusqueda } from '../../domain/busqueda'

export function ListaDetallePage({ listaId }: { listaId: string }) {
  const { listas, loading: listasLoading, error: listasError } = useListas()
  const {
    articulos,
    loading: articulosLoading,
    error: articulosError,
    agregar,
    editar,
    marcar,
    desmarcar,
    eliminar,
    limpiarComprados,
  } = useArticulos(listaId)
  const [nuevoArticulo, setNuevoArticulo] = useState('')
  const [consulta, setConsulta] = useState('')
  const [articuloEditando, setArticuloEditando] = useState<string>()
  const [borradorEdicion, setBorradorEdicion] = useState('')

  const lista = listas.find((item) => item.id === listaId)
  const articulosFiltrados = useMemo(
    () =>
      consulta.trim() === ''
        ? articulos
        : articulos.filter((articulo) =>
            coincideConBusqueda(articulo.contenido, consulta),
          ),
    [articulos, consulta],
  )
  const pendientes = articulosFiltrados.filter((articulo) => !articulo.comprado)
  const comprados = articulosFiltrados.filter((articulo) => articulo.comprado)

  async function alAgregar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const contenido = nuevoArticulo.trim()
    if (contenido === '') return
    const resultado = await agregar(contenido)
    if (resultado.ok) setNuevoArticulo('')
  }

  function empezarEdicion(articulo: Articulo) {
    setArticuloEditando(articulo.id)
    setBorradorEdicion(articulo.contenido)
  }

  async function guardarEdicion(
    event: FormEvent<HTMLFormElement>,
    articulo: Articulo,
  ) {
    event.preventDefault()
    const contenido = borradorEdicion.trim()
    if (contenido === '') return
    const resultado = await editar(articulo.id, contenido)
    if (resultado.ok) setArticuloEditando(undefined)
  }

  if (listasLoading || articulosLoading) {
    return <p className="text-sm text-muted-foreground">Cargando lista…</p>
  }

  if (listasError || articulosError) {
    return (
      <p className="text-sm text-destructive">No se pudo cargar la lista.</p>
    )
  }

  if (!lista) {
    return (
      <p className="text-sm text-muted-foreground">
        Esta lista no está disponible.
      </p>
    )
  }

  return (
    <section className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-4 py-4 sm:py-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">Lista compartida</p>
        <h2 className="text-2xl font-semibold tracking-tight">
          {lista.nombre}
        </h2>
      </header>

      <form
        className="sticky top-0 z-10 flex gap-2 bg-background py-2"
        onSubmit={alAgregar}
      >
        <label className="sr-only" htmlFor="nuevo-articulo">
          Añadir artículo
        </label>
        <input
          id="nuevo-articulo"
          className="min-h-11 flex-1 rounded-md border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          value={nuevoArticulo}
          onChange={(event) => setNuevoArticulo(event.target.value)}
          placeholder="Añadir artículo"
        />
        <Button
          className="min-h-11"
          type="submit"
          disabled={nuevoArticulo.trim() === ''}
        >
          Añadir artículo
        </Button>
      </form>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="buscar-articulos">
          Buscar artículos
        </label>
        <input
          id="buscar-articulos"
          type="search"
          className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          value={consulta}
          onChange={(event) => setConsulta(event.target.value)}
          placeholder="Buscar en esta lista"
        />
      </div>

      {articulos.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Añade el primer artículo para empezar la compra.
        </p>
      ) : null}

      {articulos.length > 0 && articulosFiltrados.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          No hay artículos que coincidan con la búsqueda.
        </p>
      ) : null}

      <GrupoArticulos
        titulo="Pendientes"
        articulos={pendientes}
        articuloEditando={articuloEditando}
        borradorEdicion={borradorEdicion}
        onBorradorEdicion={setBorradorEdicion}
        onEditar={empezarEdicion}
        onGuardar={guardarEdicion}
        onEliminar={eliminar}
        onToggle={marcar}
      />

      <section aria-label="Comprados" className="space-y-3 pb-24">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Comprados
          </h3>
          <Button
            className="min-h-11"
            type="button"
            variant="outline"
            disabled={comprados.length === 0}
            onClick={() => {
              if (comprados.length > 0) void limpiarComprados()
            }}
          >
            Limpiar comprados
          </Button>
        </div>
        <ListaArticulos
          articulos={comprados}
          articuloEditando={articuloEditando}
          borradorEdicion={borradorEdicion}
          onBorradorEdicion={setBorradorEdicion}
          onEditar={empezarEdicion}
          onGuardar={guardarEdicion}
          onEliminar={eliminar}
          onToggle={desmarcar}
        />
      </section>
    </section>
  )
}

function GrupoArticulos({
  titulo,
  articulos,
  ...props
}: ListaArticulosProps & { titulo: string }) {
  return (
    <section aria-label={titulo} className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {titulo}
      </h3>
      <ListaArticulos articulos={articulos} {...props} />
    </section>
  )
}

type ListaArticulosProps = {
  articulos: Articulo[]
  articuloEditando: string | undefined
  borradorEdicion: string
  onBorradorEdicion: (valor: string) => void
  onEditar: (articulo: Articulo) => void
  onGuardar: (
    event: FormEvent<HTMLFormElement>,
    articulo: Articulo,
  ) => Promise<void>
  onEliminar: (id: string) => Promise<unknown>
  onToggle: (id: string) => Promise<unknown>
}

function ListaArticulos({ articulos, ...props }: ListaArticulosProps) {
  return (
    <ul className="space-y-2">
      {articulos.map((articulo) => (
        <li key={articulo.id}>
          <ArticuloFila articulo={articulo} {...props} />
        </li>
      ))}
    </ul>
  )
}

function ArticuloFila({
  articulo,
  articuloEditando,
  borradorEdicion,
  onBorradorEdicion,
  onEditar,
  onGuardar,
  onEliminar,
  onToggle,
}: Omit<ListaArticulosProps, 'articulos'> & { articulo: Articulo }) {
  const estaEditando = articuloEditando === articulo.id
  const accionToggle = articulo.comprado ? 'Desmarcar' : 'Marcar'

  return (
    <article className="flex items-center gap-3 rounded-lg border bg-card p-2 shadow-xs">
      <Button
        aria-label={`${accionToggle} ${articulo.contenido} como comprado`}
        className="min-h-11 min-w-11 rounded-full"
        type="button"
        variant={articulo.comprado ? 'secondary' : 'outline'}
        onClick={() => void onToggle(articulo.id)}
      >
        {articulo.comprado ? '✓' : '○'}
      </Button>

      {estaEditando ? (
        <form
          className="flex min-w-0 flex-1 gap-2"
          onSubmit={(event) => void onGuardar(event, articulo)}
        >
          <label className="sr-only" htmlFor={`editar-${articulo.id}`}>
            Editar {articulo.contenido}
          </label>
          <input
            id={`editar-${articulo.id}`}
            className="min-h-11 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            value={borradorEdicion}
            onChange={(event) => onBorradorEdicion(event.target.value)}
          />
          <Button className="min-h-11" type="submit">
            Guardar {articulo.contenido}
          </Button>
        </form>
      ) : (
        <p
          className={
            articulo.comprado
              ? 'min-w-0 flex-1 text-muted-foreground line-through'
              : 'min-w-0 flex-1'
          }
        >
          {articulo.contenido}
        </p>
      )}

      {!estaEditando ? (
        <Button
          aria-label={`Editar ${articulo.contenido}`}
          className="min-h-11 min-w-11"
          type="button"
          variant="ghost"
          onClick={() => onEditar(articulo)}
        >
          Editar
        </Button>
      ) : null}
      <Button
        aria-label={`Eliminar ${articulo.contenido}`}
        className="min-h-11 min-w-11"
        type="button"
        variant="ghost"
        onClick={() => void onEliminar(articulo.id)}
      >
        Eliminar
      </Button>
    </article>
  )
}
