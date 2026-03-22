/** @type {import('next').NextConfig} */
const nextConfig = {
  // /* config options here */
  // async headers() {
  //   return [
  //     {
  //       source: "/:path*",
  //       headers: [
  //         {
  //           key: "X-Frame-Options",
  //           value: "DENY",
  //         },
  //         {
  //           key: "Content-Security-Policy",
  //           value: `
  //             default-src 'self';
  //             connect-src 'self' https://attend.pythonanywhere.com http://localhost:8000/api/;
  //             img-src 'self' data: blob:;
  //             script-src 'self' 'unsafe-inline' 'unsafe-eval';
  //             style-src 'self' 'unsafe-inline';
  //             font-src 'self' data:;
  //           `.replace(/\s{2,}/g, " ").trim(),
  //         },
  //         {
  //           key: "X-Content-Type-Options",
  //           value: "nosniff",
  //         },
  //         {
  //           key: "Strict-Transport-Security",
  //           value: "max-age=31536000; includeSubDomains",
  //         },
  //       ],
  //     },
  //   ];
  // },
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
};

export default nextConfig;
