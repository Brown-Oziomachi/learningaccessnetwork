/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    globalNotFound: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
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
          // 1. PREVENTS CLICKJACKING
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // 2. ENFORCES HTTPS (HSTS)
          // Forces the browser to strictly communicate over safe, encrypted HTTPS channels for the next year.
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          // 3. PREVENTS MIME-TYPE SNIFFING
          // Stops browsers from guessing the file type and executing a text file or upload as JavaScript.
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // 4. PROTECTS USER PRIVACY (Referrer Policy)
          // Controls how much information the browser sends along when a user clicks a link taking them off your site.
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          }
        ],
      },
    ];
  },
};

export default nextConfig;