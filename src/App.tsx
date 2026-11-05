import * as React from "react"
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router"
import { Toaster } from "sonner"

import { AppShell } from "@/components/app-shell"
import { LibraryProvider } from "@/lib/library"
import { SessionProvider, useSession } from "@/lib/session"
import AppHome from "@/pages/app-home"
import Landing from "@/pages/landing"
import Library from "@/pages/library"
import Login from "@/pages/login"
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
  return role === "admin" ? <Navigate to="/app/usuarios" replace /> : <Outlet />
}

function AdminOnly() {
  const { role } = useSession()
  return role === "admin" ? <Outlet /> : <Navigate to="/app" replace />
}

export function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
      <LibraryProvider>
        <ScrollTop />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/app" element={<AppShell />}>
            <Route element={<MemberOnly />}>
              <Route index element={<AppHome />} />
              <Route path="biblioteca" element={<Library />} />
              <Route path="resumen/:id" element={<SummaryPage />} />
            </Route>
            <Route element={<AdminOnly />}>
              <Route path="usuarios" element={<Users />} />
            </Route>
            <Route path="entrar" element={<Login />} />
            <Route path="ajustes" element={<Settings />} />
          </Route>
          <Route path="*" element={<Landing />} />
        </Routes>
        <Toaster position="bottom-center" theme="system" mobileOffset={{ bottom: "6.5rem" }} offset={24} />
      </LibraryProvider>
      </SessionProvider>
    </BrowserRouter>
  )
}

export default App
