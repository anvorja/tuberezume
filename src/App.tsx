import * as React from "react"
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router"
import { Toaster } from "sonner"

import { AppShell } from "@/components/app-shell"
import { hasSession } from "@/lib/api"
import { LibraryProvider } from "@/lib/library"
import { SessionProvider, useSession } from "@/lib/session"
import AppHome from "@/pages/app-home"
import Landing from "@/pages/landing"
import Library from "@/pages/library"
import Login from "@/pages/login"
import NotFound from "@/pages/not-found"
import Settings from "@/pages/settings"
import SummaryPage from "@/pages/summary-page"
import Users from "@/pages/users"

function ScrollTop() {
  const { pathname } = useLocation()
  React.useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

/** El administrador solo gestiona usuarios: se le lleva a su pantalla. */
function MemberOnly() {
  const { role } = useSession()
  return role === "admin" ? <Navigate to="/admin/usuarios" replace /> : <Outlet />
}

function AdminOnly() {
  const { role } = useSession()
  return role === "admin" ? <Outlet /> : <Navigate to="/" replace />
}

/** "/" es la landing sin sesión y la aplicación con sesión; el resto de rutas siempre usa el shell. */
function Root() {
  const { pathname } = useLocation()
  return pathname === "/" && !hasSession() ? <Landing /> : <AppShell />
}

/** Enlaces antiguos (/app/...): se llevan a la ruta nueva sin romper favoritos. */
function LegacyApp() {
  const { pathname, search } = useLocation()
  const rest = pathname.replace(/^\/app\/?/, "")
  const to = rest.startsWith("usuarios") ? `/admin/${rest}` : `/${rest}`
  return <Navigate to={to + search} replace />
}

export function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
      <LibraryProvider>
        <ScrollTop />
        <Routes>
          <Route path="/" element={<Root />}>
            <Route element={<MemberOnly />}>
              <Route index element={<AppHome />} />
              <Route path="biblioteca" element={<Library />} />
              <Route path="resumen/:id" element={<SummaryPage />} />
            </Route>
            <Route path="admin" element={<AdminOnly />}>
              <Route path="usuarios" element={<Users />} />
            </Route>
            <Route path="entrar" element={<Login />} />
            <Route path="ajustes" element={<Settings />} />
          </Route>
          <Route path="app/*" element={<LegacyApp />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster position="bottom-center" theme="system" mobileOffset={{ bottom: "6.5rem" }} offset={24} />
      </LibraryProvider>
      </SessionProvider>
    </BrowserRouter>
  )
}

export default App
