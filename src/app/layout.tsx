import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/layout/header"
import { ThemeProvider } from "@/components/theme/theme-provider"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Helpdesk",
  description: "Sistema de tickets de soporte",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-neutral-200 bg-white py-4 text-center text-sm text-neutral-500 dark:border-navy-700 dark:bg-navy-800 dark:text-neutral-400">
            &copy; 2026 softgroup.com.ar
          </footer>
        </ThemeProvider>
      </body>
    </html>
  )
}
