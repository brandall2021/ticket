const path = require("path")

function buildUploadArtifact(file, buffer) {
  const name = file.name || "archivo"
  const type = file.type || "application/octet-stream"

  if (type.startsWith("image/")) {
    return {
      nombre: name,
      url: `data:${type};base64,${buffer.toString("base64")}`,
      persistToDisk: false,
    }
  }

  let ext = path.extname(name)
  if (!ext) {
    const mimeExt = type.split("/").pop()
    ext = mimeExt ? `.${mimeExt}` : ""
  }

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext || ""}`

  return {
    nombre: name || `archivo${ext}`,
    url: `/uploads/${filename}`,
    filename,
    persistToDisk: true,
  }
}

module.exports = { buildUploadArtifact }
