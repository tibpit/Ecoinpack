import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the PDF parser (pdfjs-based) out of the bundler — it resolves its
  // worker at runtime.
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
