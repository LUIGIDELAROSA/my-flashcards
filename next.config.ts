import type { NextConfig } from "next";

module.exports = {
  allowedDevOrigins: ['192.168.1.15'],
}

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;
