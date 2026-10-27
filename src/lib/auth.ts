import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Sesión JWT de 7 días (antes: 30 por defecto).
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user) return null
        if (!user.activo) return null
        if (!user.password) return null

        const match = await bcrypt.compare(credentials.password as string, user.password)
        if (!match) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        }
      },
    }),
    // Vincular automáticamente una cuenta de Google por email permite que
    // cualquiera con ese email tome la cuenta existente: sólo si se habilita.
    Google({ allowDangerousEmailAccountLinking: process.env.AUTH_ALLOW_EMAIL_LINKING === "true" }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (user.email) {
        const existing = await prisma.user.findUnique({ where: { email: user.email }, select: { activo: true } })
        if (existing && !existing.activo) return false
      }
      if (user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        }).catch(() => {})
      }
      return true
    },
    async jwt({ token, user }) {
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { role: true, id: true, activo: true, passwordChangedAt: true },
        })

        // Usuario desactivado o eliminado: se invalida la sesión.
        if (!dbUser?.activo) return null

        const stamp = dbUser.passwordChangedAt?.getTime() ?? 0

        if (user) {
          // Inicio de sesión: se sella la versión de credencial actual.
          token.pwdAt = stamp
        } else if (typeof token.pwdAt !== "number") {
          // Sesiones emitidas antes de este cambio: se adoptan sin expulsar.
          token.pwdAt = stamp
        } else if (token.pwdAt !== stamp) {
          // La contraseña cambió después de emitido el token: forzar re-login.
          return null
        }

        token.role = dbUser.role
        token.id = dbUser.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as string) || ""
        session.user.id = (token.id as string) || ""
      }
      return session
    },
  },
})
