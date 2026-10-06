import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import vm from "node:vm"
import ts from "typescript"
import * as access from "../src/lib/ticket-access"
import * as crypto from "node:crypto"

function loadRoute(relative: string, dependencies: Record<string, unknown>) {
  const source = fs.readFileSync(new URL(relative, import.meta.url), "utf8")
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const exports: Record<string, (...args: unknown[]) => Promise<unknown>> = {}
  vm.runInNewContext(compiled, {
    exports,
    require(name: string) {
      if (name === "next/server") return { NextResponse: { json: (body: unknown, options?: { status: number }) => ({ body, status: options?.status || 200 }) } }
      if (name === "@/lib/ticket-access") return access
      if (name in dependencies) return dependencies[name]
      return {}
    },
    process,
    Buffer,
    console,
  })
  return exports
}

test("PATCH rejects a client before reading or changing the database", async () => {
  let checkedRoles: string[] = []
  const route = loadRoute("../src/app/api/tickets/[id]/route.ts", {
    "@/lib/api-auth": { requireRole: async (roles: string[]) => { checkedRoles = roles; return { error: { status: 403 } } } },
    "@/lib/prisma": { prisma: new Proxy({}, { get() { assert.fail("Database must not be accessed") } }) },
  })
  assert.deepEqual(await route.PATCH({}, { params: Promise.resolve({ id: "other-ticket" }) }), { status: 403 })
  assert.deepEqual(Array.from(checkedRoles), ["ADMIN", "AGENT"])
})

test("GET ticket filters internal notes and denies access to another client", async () => {
  let clientId = "alice"
  const route = loadRoute("../src/app/api/tickets/[id]/route.ts", {
    "@/lib/api-auth": { requireAuth: async () => ({ session: { user: { id: "alice", role: "CLIENT" } }, error: null }) },
    "@/lib/prisma": { prisma: { ticket: { findUnique: async (query: { include: { comments: { where: { internal?: boolean } } } }) => {
      assert.equal(query.include.comments.where.internal, false)
      return { clienteId: clientId, comments: [] }
    } } } },
  })
  assert.equal((await route.GET({}, { params: Promise.resolve({ id: "ticket" }) }) as { status: number }).status, 200)
  clientId = "bob"
  assert.equal((await route.GET({}, { params: Promise.resolve({ id: "ticket" }) }) as { status: number }).status, 403)
})

test("clients cannot impersonate another creator through x-cliente-id", async () => {
  const route = loadRoute("../src/app/api/tickets/route.ts", {
    "@/lib/api-auth": { requireAuth: async () => ({ session: { user: { id: "alice", role: "CLIENT" } }, error: null }) },
    "@/lib/schemas": { crearTicketSchema: { safeParse: () => ({ success: true, data: {} }) } },
    "@/lib/prisma": { prisma: new Proxy({}, { get() { assert.fail("Database must not be accessed") } }) },
  })
  const response = await route.POST({ json: async () => ({}), headers: { get: () => "bob" } }) as { status: number }
  assert.equal(response.status, 403)
})

test("password reset tokens cannot be reused after a successful reset", async () => {
  let password = "old-hash"
  let updates = 0
  const version = crypto.createHash("sha256").update(password).digest("hex")
  const route = loadRoute("../src/app/api/auth/restablecer/route.ts", {
    "node:crypto": crypto,
    "jsonwebtoken": { default: { verify: () => ({ email: "alice@example.com", version, purpose: "password-reset" }) } },
    "bcryptjs": { default: { hash: async () => "new-hash" } },
    "@/lib/prisma": { prisma: { user: {
      findUnique: async () => ({ id: "alice", password, activo: true }),
      updateMany: async ({ where, data }: { where: { password: string }; data: { password: string } }) => {
        if (where.password !== password) return { count: 0 }
        password = data.password
        updates++
        return { count: 1 }
      },
    } } },
  })
  const request = { json: async () => ({ token: "token", password: "new-password" }) }
  assert.equal((await route.POST(request) as { status: number }).status, 200)
  assert.equal((await route.POST(request) as { status: number }).status, 400)
  assert.equal(updates, 1)
})
