/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  webpack: (config) => {
    // Required for wagmi/viem and some Web3 packages
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Required for @react-three/fiber
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: ["raw-loader", "glslify-loader"],
      exclude: /node_modules/,
    });

    return config;
  },

  // Allow images from external sources (e.g., token logos)
  images: {
    domains: ["raw.githubusercontent.com", "assets.coingecko.com"],
  },

  // Transpile Three.js packages for Next.js
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
};

module.exports = nextConfig;
