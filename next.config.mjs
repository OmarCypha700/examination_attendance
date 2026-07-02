/** @type {import('next').NextConfig} */
const nextConfig = {
  // /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.qrserver.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "attend.pythonanywhere.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/**",
      },
    ],
  },
  allowedDevOrigins: ["http://localhost:3000", "http://10.0.11.160:3000"],
};

export default nextConfig;
