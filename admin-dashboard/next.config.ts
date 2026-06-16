import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Monorepo: admin-dashboard imports ../backend/convex (Vercel root = admin-dashboard)
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;
