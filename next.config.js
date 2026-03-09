const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const isDev = process.env.NODE_ENV !== 'production';

/** Inject font-display:swap into @font-face rules missing it */
class FontDisplaySwapPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('FontDisplaySwapPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'FontDisplaySwapPlugin',
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
        },
        (assets) => {
          for (const [name, asset] of Object.entries(assets)) {
            if (!name.endsWith('.css')) continue;
            const source = asset.source();
            if (!source.includes('KaTeX')) continue;
            const updated = source.replace(
              /@font-face\{(?!.*?font-display)/g,
              '@font-face{font-display:swap;',
            );
            if (updated !== source) {
              compilation.updateAsset(
                name,
                new compiler.webpack.sources.RawSource(updated),
              );
            }
          }
        },
      );
    });
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pg', 'bcryptjs', 'jsonwebtoken', 'pino'],
  webpack(config) {
    config.plugins.push(new FontDisplaySwapPlugin());
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data:",
              "font-src 'self'",
              `connect-src 'self'${isDev ? ' ws:' : ''}`,
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
