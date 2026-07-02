"use client"

import { Suspense, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("Credenciales inválidas")
      setLoading(false)
    } else {
      router.push("/")
      router.refresh()
    }
  }

  return (
    <Card className="w-full max-w-sm p-6 space-y-6">
      <div className="flex flex-col items-center gap-2">
        <Building2 className="h-10 w-10 text-brand-600" />
        <h1 className="text-2xl font-bold">Iniciar sesión</h1>
      </div>

      {searchParams.get("registered") && (
        <p className="text-sm text-green-600 text-center">
          Cuenta creada correctamente. Inicia sesión.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500 dark:bg-navy-900 dark:text-neutral-400">O continúa con</span>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => signIn("google", { callbackUrl: "/" })}
      >
        Google
      </Button>

      <div className="text-center text-sm">
        <a href="/recuperar" className="text-brand-600 hover:underline">
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      <div className="text-center text-sm text-gray-500">
        ¿No tienes cuenta?{" "}
        <a href="/register" className="text-brand-600 hover:underline">
          Registrarse
        </a>
      </div>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-[80vh] items-center justify-center px-4 before:absolute before:inset-0 before:bg-[url('/bg-code.jpg')] before:bg-cover before:bg-center before:opacity-20">
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900/60 via-navy-900/40 to-navy-900/60" />
      <div className="relative z-10 w-full max-w-sm">
        <Suspense fallback={<div className="text-gray-500">Cargando...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
