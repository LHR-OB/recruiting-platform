/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
import createMDX from "@next/mdx";

/** @type {import("next").NextConfig} */
const config = {
  images: {
    remotePatterns: [new URL("https://static.wixstatic.com/**")],
  },
  experimental: {
    useCache: true,
  },
  // bad but okay for now
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

const withMDX = createMDX();

export default withMDX(config);
