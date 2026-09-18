import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer ships its own bundled runtime and must not be
  // re-bundled by webpack/turbopack when rendering PDFs on the server.
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
