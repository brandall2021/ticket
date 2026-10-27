const test = require('node:test')
const assert = require('node:assert/strict')

const { buildUploadArtifact } = require('../src/lib/upload-utils.js')

test('buildUploadArtifact returns a data URL for image files', () => {
  const file = { name: 'imagen.png', type: 'image/png' }
  const buffer = Buffer.from('hola')

  const result = buildUploadArtifact(file, buffer)

  assert.equal(result.persistToDisk, false)
  assert.equal(result.nombre, 'imagen.png')
  assert.equal(result.url, 'data:image/png;base64,aG9sYQ==')
})

test('buildUploadArtifact returns an authenticated path for non-image files', () => {
  const file = { name: 'reporte.pdf', type: 'application/pdf' }
  const buffer = Buffer.from('hola')

  const result = buildUploadArtifact(file, buffer)

  assert.equal(result.persistToDisk, true)
  assert.equal(result.nombre, 'reporte.pdf')
  assert.equal(result.url.startsWith('/api/uploads/'), true)
  assert.equal(typeof result.filename, 'string')
  // El nombre generado no puede contener separadores de ruta.
  assert.equal(/[\\/]/.test(result.filename), false)
})
