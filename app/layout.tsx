import type { Metadata } from 'next';
import './globals.css';
import { ShortcutsModal } from '@/components/ShortcutsModal';

export const metadata: Metadata = {
  title: {
    default: 'Vector - Research Papers',
    template: '%s - Vector',
  },
  description: 'Explore collections of research, frameworks, and references.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://vector.jdok.dev'),
  openGraph: {
    siteName: 'Vector',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
  manifest: '/manifest.json',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var stored = localStorage.getItem('theme');
                var dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (dark) document.documentElement.classList.add('dark');
              })();
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    reg.addEventListener('updatefound', function() {
                      var newWorker = reg.installing;
                      if (!newWorker) return;
                      newWorker.addEventListener('statechange', function() {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                          var banner = document.createElement('div');
                          banner.setAttribute('role', 'alert');
                          banner.style.cssText = 'position:fixed;bottom:1rem;left:50%;transform:translateX(-50%);z-index:9999;background:#2563eb;color:#fff;padding:0.75rem 1.5rem;border-radius:0.5rem;font-size:0.875rem;display:flex;align-items:center;gap:0.75rem;box-shadow:0 4px 12px rgba(0,0,0,0.15)';
                          banner.innerHTML = 'Updated content available. <button onclick="location.reload()" style="text-decoration:underline;background:none;border:none;color:inherit;cursor:pointer;font:inherit">Refresh</button>';
                          document.body.appendChild(banner);
                        }
                      });
                    });
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-white dark:bg-gray-950">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded"
        >
          Skip to content
        </a>
        {children}
        <ShortcutsModal />
      </body>
    </html>
  );
}
