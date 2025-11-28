/** @type {import("next").NextConfig} */
const nextConfig = {
  turbopack: {},

  images: {
    unoptimized: true,
  },

  serverExternalPackages: ["bufferutil", "utf-8-validate"],
};

export default nextConfig;