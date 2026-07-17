import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileSidebar } from "@/components/layout/mobile-sidebar"
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

  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full">
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider />
            <div className="flex min-h-screen">
              <div className="hidden lg:block">
                <Sidebar role={role} userName={userName} />
              </div>
              <MobileSidebar role={role} userName={userName} />
              <main className="flex-1 overflow-x-hidden">
                {children}
              </main>
            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
