import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileSidebar } from "@/components/layout/mobile-sidebar"
import { Topbar } from "@/components/layout/topbar"
import { ToastProvider } from "@/components/toast-provider"
import { auth } from "@/lib/auth"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Helpdesk",
  description: "Sistema de tickets de soporte",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const role = session?.user?.role ?? ""
  const userName = session?.user?.name ?? ""
  const authenticated = Boolean(session?.user)

  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full">
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider />
            <div className="flex min-h-screen">
              {authenticated && (
                <div className="hidden lg:block">
                  <Sidebar role={role} />
                </div>
              )}
              {authenticated && <MobileSidebar role={role} />}
              <main className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
                {authenticated && <Topbar userName={userName} />}
                <div className="flex-1">{children}</div>
              </main>
            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
