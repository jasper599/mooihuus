/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // Nodig zodat instrumentation.ts draait (in-app scheduler voor back-up + verlenging).
  experimental: { instrumentationHook: true },
};
export default nextConfig;
