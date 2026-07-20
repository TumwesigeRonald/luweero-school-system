import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow any origin for dev/preview. Next.js otherwise blocks requests
  // coming from hosts it doesn't recognise (e.g. sandbox preview URLs, phones
  // on the same LAN, tunnels like ngrok, etc.) and shows "Invalid Host".
  allowedDevOrigins: ["*"],

  // Same for Server Actions / cross-origin fetches in production preview.
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
    },
  },
};

export default nextConfig;
