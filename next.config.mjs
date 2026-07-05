/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }],
  },
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ignored: ['**/supabase/functions/**', '**/supabase/migrations/**'],
    };
    return config;
  },
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
};

export default nextConfig;
