/** @type {import('next').NextConfig} */
const nextConfig = {
  //output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
 // Ignore bufferutil et utf-8-validate
 webpack: (config) => {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    bufferutil: false,
    'utf-8-validate': false,
  };
  return config;
},
};

module.exports = nextConfig;
