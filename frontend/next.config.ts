import type { NextConfig } from "next";
/** @type {import('next').NextConfig} */

const nextConfig: NextConfig = {
  
  output: 'export',
  webpack: (config, { dev }) => {
    if ( dev ) {
      config.cache = false;
    }
    return config;
  }
};

export default nextConfig;