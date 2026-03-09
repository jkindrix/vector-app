import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Database } from './database';
import { ContentService } from './services/content';
import { contentRouter } from './routes/content';
import { authRouter } from './routes/auth';
import { adminRouter } from './routes/admin';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Strict rate limiting on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 minutes
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);

// Cookie parsing
app.use(cookieParser());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize database and content service
const db = new Database();
const contentService = new ContentService(process.env.CONTENT_DIR || '/app/content');

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    await db.searchContent('health', 1, 0);

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
    });
  }
});

// Sitemap
app.get('/api/sitemap.xml', async (_req, res) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'https://vector.jdok.dev';
    const files = await contentService.getAllFiles();

    const urls = [
      `  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
      `  <url>
    <loc>${baseUrl}/search</loc>
    <changefreq>daily</changefreq>
    <priority>0.5</priority>
  </url>`,
      ...files.map((filePath: string) => {
        const urlPath = filePath.replace(/\.md$/i, '');
        return `  <url>
    <loc>${baseUrl}/${urlPath}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
      }),
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// Routes
app.use('/api', contentRouter(db, contentService));
app.use('/api/auth', authRouter(db));
app.use('/api/admin', adminRouter(db));

// Error handling
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({
    error: {
      message: status < 500 ? err.message : 'Internal server error',
      status,
    },
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await db.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await db.close();
  process.exit(0);
});

// Initialize database and start server
async function startServer() {
  // Refuse to start without JWT_SECRET
  if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
    process.exit(1);
  }

  try {
    await db.initialize();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Database: PostgreSQL connected`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();