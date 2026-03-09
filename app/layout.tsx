import type { Metadata } from 'next';
import './globals.css';
import 'highlight.js/styles/github.css';
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
