import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // Only register the SW in production so dev HMR is unaffected
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ignored: ["**/supabase/functions/**", "**/supabase/migrations/**"],
    };
    return config;
  },
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
};

export default withSerwist(nextConfig);
