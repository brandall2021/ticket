import test from "node:test"
import assert from "node:assert/strict"

import {
  decryptMikrotikPassword,
  encryptMikrotikPassword,
  isEncryptedMikrotikPassword,
  summarizePingRows,
  wasMikrotikRouterUp,
  getMikrotikAlertCooldownMinutes,
} from "../src/lib/mikrotik"

test("encrypts and decrypts MikroTik passwords", () => {
  const previous = process.env.MIKROTIK_ENCRYPTION_KEY
  process.env.MIKROTIK_ENCRYPTION_KEY = "test-key-with-at-least-thirty-two-characters"
  try {
    const encrypted = encryptMikrotikPassword("router-secret")
    assert.equal(isEncryptedMikrotikPassword(encrypted), true)
    assert.notEqual(encrypted, "router-secret")
    assert.equal(decryptMikrotikPassword(encrypted), "router-secret")
  } finally {
    if (previous === undefined) delete process.env.MIKROTIK_ENCRYPTION_KEY
    else process.env.MIKROTIK_ENCRYPTION_KEY = previous
  }
})

test("rejects an encrypted password when the key changes", () => {
  const previous = process.env.MIKROTIK_ENCRYPTION_KEY
  try {
    process.env.MIKROTIK_ENCRYPTION_KEY = "first-test-key-with-at-least-thirty-two-characters"
    const encrypted = encryptMikrotikPassword("router-secret")
    process.env.MIKROTIK_ENCRYPTION_KEY = "second-test-key-with-at-least-thirty-two-characters"
    assert.throws(() => decryptMikrotikPassword(encrypted), /descifrar/)
  } finally {
    if (previous === undefined) delete process.env.MIKROTIK_ENCRYPTION_KEY
    else process.env.MIKROTIK_ENCRYPTION_KEY = previous
  }
})

test("counts successful and timed-out ping rows", () => {
  const summary = summarizePingRows([
    { seq: "0", host: "8.8.8.8", time: "12", ttl: "117" },
    { seq: "1", host: "8.8.8.8", status: "timeout" },
    { seq: "2", host: "8.8.8.8", time: "15", ttl: "117" },
  ], "8.8.8.8", 3)

  assert.equal(summary.sent, 3)
  assert.equal(summary.received, 2)
  assert.equal(summary.lost, 1)
  assert.equal(summary.results[1].status, "timeout")
})

test("treats a recovered router as previously online", () => {
  assert.equal(wasMikrotikRouterUp("RECUPERADO"), true)
  assert.equal(wasMikrotikRouterUp("OK"), true)
  assert.equal(wasMikrotikRouterUp("ERROR"), false)
})

test("normalizes the persistent alert cooldown", () => {
  assert.equal(getMikrotikAlertCooldownMinutes(undefined), 60)
  assert.equal(getMikrotikAlertCooldownMinutes("0"), 1)
  assert.equal(getMikrotikAlertCooldownMinutes("9999"), 1440)
  assert.equal(getMikrotikAlertCooldownMinutes("invalid"), 60)
})
