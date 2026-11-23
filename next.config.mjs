/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  reactStrictMode: true,

  // Image configuration
  images: {
    // Keep unoptimized true for API-served local uploads (./uploads/*)
    // Google profile images are served via remotePatterns below
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },

  // Disable source maps in production for security
  productionBrowserSourceMaps: false,
};

export default nextConfig;
