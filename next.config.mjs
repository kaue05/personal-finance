/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Permite logos de bancos hospedadas externamente (ex: storage/CDN).
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
