const nextConfig = {
  output: "standalone",
  // `ssh2` trae módulos nativos opcionales; se deja fuera del bundle del servidor.
  serverExternalPackages: ["ssh2"],
  // No anunciar la versión del framework.
  poweredByHeader: false,
  images: {
    // La optimización de imágenes de Next procesa entradas no confiables
    // (SVG/AVIF) y concentró varios avisos críticos: se sirven tal cual.
    unoptimized: true,
  },
}

export default nextConfig
