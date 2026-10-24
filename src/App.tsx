import * as React from "react"
import { BrowserRouter, Route, Routes, useLocation } from "react-router"
import { Toaster } from "sonner"

import { AppShell } from "@/components/app-shell"
import { LibraryProvider } from "@/lib/library"
import AppHome from "@/pages/app-home"
import Landing from "@/pages/landing"
import Library from "@/pages/library"
import Settings from "@/pages/settings"
import SummaryPage from "@/pages/summary-page"

function ScrollTop() {
  const { pathname } = useLocation()
  React.useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export function App() {
  return (
    <BrowserRouter>
      <LibraryProvider>
        <ScrollTop />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/app" element={<AppShell />}>
            <Route index element={<AppHome />} />
            <Route path="biblioteca" element={<Library />} />
            <Route path="resumen/:id" element={<SummaryPage />} />
            <Route path="ajustes" element={<Settings />} />
          </Route>
          <Route path="*" element={<Landing />} />
        </Routes>
        <Toaster position="bottom-center" theme="system" />
      </LibraryProvider>
    </BrowserRouter>
  )
}

export default App
