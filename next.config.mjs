/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production";

// CSP — Report-Only in prod for first rollout; tighten after baseline.
// NextAuth + Google OAuth need: self for scripts, inline for Next dev/prod bootstrapping.
const csp = [
  "default-src 'self'",
  "img-src 'self' data: blob: https://lh3.googleusercontent.com https://*.supabase.co https://*.googleusercontent.com",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://accounts.google.com",
  "frame-src https://accounts.google.com",
  "form-action 'self' https://accounts.google.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    // Report-Only first — watch for violations before enforcing.
    key: isProd ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy",
    value: csp,
  },
];

const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
