/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    globalNotFound: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Permissions-Policy",
            value: "unload=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;