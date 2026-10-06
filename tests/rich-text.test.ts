import test from "node:test"
import assert from "node:assert/strict"

import { richTextToPlainText } from "../src/lib/rich-text"

test("removes executable markup while preserving its text", () => {
  const result = richTextToPlainText('<p>Hola <strong>equipo</strong></p><script>alert("xss")</script>')

  assert.equal(result, 'Hola equipo\nalert("xss")')
  assert.equal(result.includes("<script"), false)
})

test("preserves useful line breaks and decodes common entities", () => {
  const result = richTextToPlainText("Primera<br>Segunda &amp; tercera<div>Final</div>")

  assert.equal(result, "Primera\nSegunda & tercera\nFinal")
})

test("does not throw for invalid numeric entities", () => {
  assert.equal(richTextToPlainText("Valor: &#999999999;"), "Valor: &#999999999;")
})

test("handles empty values", () => {
  assert.equal(richTextToPlainText(null), "")
  assert.equal(richTextToPlainText(undefined), "")
})
