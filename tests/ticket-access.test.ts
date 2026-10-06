import test from "node:test"
import assert from "node:assert/strict"
import { canManageTickets, canReadTicket, ticketCommentFilter, withoutPassword } from "../src/lib/ticket-access"

test("only support staff can manage tickets", () => {
  for (const role of ["CLIENT", "EDITOR", "", "unknown"]) assert.equal(canManageTickets(role), false)
  for (const role of ["ADMIN", "AGENT"]) assert.equal(canManageTickets(role), true)
})

test("clients and editors cannot read another person's ticket", () => {
  for (const role of ["CLIENT", "EDITOR"]) {
    assert.equal(canReadTicket({ id: "alice", role }, { clienteId: "bob" }), false)
    assert.equal(canReadTicket({ id: "alice", role }, { clienteId: "alice" }), true)
    assert.deepEqual(ticketCommentFilter(role), { internal: false })
  }
})

test("support staff can read tickets and internal comments", () => {
  for (const role of ["ADMIN", "AGENT"]) {
    assert.equal(canReadTicket({ id: "alice", role }, { clienteId: "bob" }), true)
    assert.deepEqual(ticketCommentFilter(role), {})
  }
})

test("router responses omit secrets without mutating the source", () => {
  const router = { id: "router", password: "secret", nombre: "Office" }
  assert.deepEqual(withoutPassword(router), { id: "router", nombre: "Office" })
  assert.equal(router.password, "secret")
})
