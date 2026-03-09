'use client';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: 'system-ui, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#fff',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '28rem', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Something went wrong</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>An unexpected error occurred. Please try again.</p>
          <button
            onClick={reset}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3B82F6',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
