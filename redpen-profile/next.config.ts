import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Makes Cloudflare bindings (KV) available in `next dev` via miniflare.
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {};

export default nextConfig;
