import * as React from "react"
import { KeyRound, Trash2, UserPlus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { adminApi } from "@/lib/api"
import { useSession } from "@/lib/session"
import type { Role, User } from "@/lib/types"

const input =
  "h-11 rounded-lg border border-border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-signal"

export default function Users() {
  const { username: me } = useSession()
  const [users, setUsers] = React.useState<User[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [name, setName] = React.useState("")
  const [pw, setPw] = React.useState("")
  const [role, setRole] = React.useState<Role>("user")
  const [busy, setBusy] = React.useState(false)
  const [armed, setArmed] = React.useState<string | null>(null) // usuario a punto de borrarse

  const load = React.useCallback(async () => {
    try {
      setUsers(await adminApi.list())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos cargar los usuarios.")
    }
  }, [])
  React.useEffect(() => {
    let alive = true
    adminApi
      .list()
      .then((u) => alive && setUsers(u))
      .catch((e) => alive && setError(e instanceof Error ? e.message : "No pudimos cargar los usuarios."))
    return () => {
      alive = false
    }
  }, [])

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn()
      toast.success(ok)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo completar la acción.")
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await adminApi.create(name.trim(), pw, role)
      toast.success(`Usuario «${name.trim()}» creado`)
      setName("")
      setPw("")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No pudimos crear el usuario.")
    } finally {
      setBusy(false)
    }
  }

  function changePassword(u: User) {
    const next = window.prompt(`Nueva contraseña para «${u.username}» (mínimo 8 caracteres):`)
    if (next == null) return
    if (next.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres.")
      return
    }
    run(() => adminApi.patch(u.id, { password: next }), "Contraseña actualizada")
  }

  return (
    <div className="flex max-w-3xl flex-col gap-10 px-4 py-8 md:px-12 md:py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold md:text-6xl">Usuarios</h1>
        <p className="text-muted-foreground">
          El administrador solo gestiona cuentas: no guarda ni procesa resúmenes.
        </p>
      </div>

      <form onSubmit={create} className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
        <p className="font-medium">Nuevo usuario</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Nombre (letras, números, . _ -)
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoCapitalize="none"
              spellCheck={false}
              autoComplete="off"
              className={input}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Contraseña (mínimo 8)
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoComplete="new-password"
              className={input}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm sm:w-48">
          Rol
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={input}>
            <option value="user">Usuario</option>
            <option value="admin">Administrador</option>
          </select>
        </label>
        <Button type="submit" disabled={busy || name.trim().length < 3 || pw.length < 8} className="w-fit">
          <UserPlus /> {busy ? "Creando…" : "Crear usuario"}
        </Button>
      </form>

      <section className="flex flex-col gap-3" aria-label="Lista de usuarios">
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {!users && !error && <div className="skeleton h-20 rounded-xl" />}
        {users?.map((u) => {
          const self = u.username.toLowerCase() === me?.toLowerCase()
          return (
            <div
              key={u.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col">
                <p className="font-medium">
                  {u.username}
                  {self && <span className="text-muted-foreground"> (tú)</span>}
                </p>
                <p className="text-sm text-muted-foreground">
                  {u.role === "admin" ? "Administrador" : "Usuario"} · {u.active ? "Activo" : "Desactivado"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => changePassword(u)}>
                  <KeyRound /> Cambiar clave
                </Button>
                {!self && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      run(
                        () => adminApi.patch(u.id, { active: !u.active }),
                        u.active ? "Usuario desactivado" : "Usuario activado"
                      )
                    }
                  >
                    {u.active ? "Desactivar" : "Activar"}
                  </Button>
                )}
                {!self &&
                  (armed === u.id ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        setArmed(null)
                        run(() => adminApi.remove(u.id), "Usuario y sus resúmenes eliminados")
                      }}
                      className="h-auto min-h-9 bg-destructive py-2 text-left whitespace-normal text-background hover:bg-destructive hover:brightness-110"
                    >
                      <Trash2 /> Confirmar: borra también sus resúmenes
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => setArmed(u.id)}>
                      <Trash2 /> Eliminar
                    </Button>
                  ))}
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}
