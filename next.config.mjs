import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pino', 'pino-pretty', 'undici'],
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // VercelBlobClientUploadHandler (client component) transitively imports
      // payload/dist/exports/internal.js which uses node: protocol imports.
      // Strip the node: prefix so webpack can resolve them, then stub all
      // Node.js built-ins to empty objects in the browser bundle.
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, '')
        })
      )
      config.resolve.fallback = {
        ...config.resolve.fallback,
        worker_threads: false,
        assert: false,
        async_hooks: false,
        buffer: false,
        console: false,
        crypto: false,
        events: false,
        fs: false,
        http: false,
        https: false,
        module: false,
        net: false,
        os: false,
        path: false,
        perf_hooks: false,
        querystring: false,
        stream: false,
        string_decoder: false,
        tls: false,
        url: false,
        util: false,
        zlib: false,
      }
      config.resolve.alias = {
        ...config.resolve.alias,
        'pino-pretty': false,
        'pino-abstract-transport': false,
        'undici': false,
      }
    }
    return config
  },
}

export default withPayload(nextConfig)
