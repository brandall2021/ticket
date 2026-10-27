const nextConfig = {
  output: "standalone",
  // `ssh2` trae módulos nativos opcionales; se deja fuera del bundle del servidor.
  serverExternalPackages: ["ssh2"],
}

export default nextConfig
