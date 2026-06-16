import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pino', 'pino-pretty', 'undici'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // These are server-only packages pulled in by VercelBlobClientUploadHandler
      // via @payloadcms/plugin-cloud-storage → payload internals.
      // Stub them out so the client bundle doesn't try to bundle Node.js builtins.
      config.resolve.alias = {
        ...config.resolve.alias,
        'pino-pretty': false,
        'pino-abstract-transport': false,
        'undici': false,
      }
      config.resolve.fallback = {
        ...config.resolve.fallback,
        worker_threads: false,
      }
    }
    return config
  },
}

export default withPayload(nextConfig)
