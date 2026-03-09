import { Router, Request, Response } from 'express';
import { Database } from '../database';
import { ContentService } from '../services/content';
import { authenticateToken } from '../middleware/auth';

export function contentRouter(db: Database, contentService: ContentService) {
  const router = Router();

  // Get content tree
  router.get('/tree', async (_req: Request, res: Response): Promise<void> => {
    try {
      const tree = await contentService.getTree();
      res.set('Cache-Control', 'public, max-age=60');
      res.json(tree);
    } catch (error) {
      console.error('Error fetching tree:', error);
      res.status(500).json({ error: 'Failed to fetch content tree' });
    }
  });

  // List collections
  router.get('/collections', async (_req: Request, res: Response): Promise<void> => {
    try {
      const collections = await contentService.listCollections();
      res.set('Cache-Control', 'public, max-age=60');
      res.json(collections);
    } catch (error) {
      console.error('Error listing collections:', error);
      res.status(500).json({ error: 'Failed to list collections' });
    }
  });

  // Search content
  router.get('/search', async (req: Request, res: Response): Promise<void> => {
    try {
      const query = (req.query.q as string || '').slice(0, 200);
      if (!query) {
        res.status(400).json({ error: 'Query parameter q is required' });
        return;
      }
      const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100);
      const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

      const results = await db.searchContent(query, limit, offset);
      res.json(results);
    } catch (error) {
      console.error('Error searching content:', error);
      res.status(500).json({ error: 'Failed to search content' });
    }
  });

  // Reindex all content
  router.post('/reindex', authenticateToken, async (_req: Request, res: Response): Promise<void> => {
    try {
      await db.clearIndex();
      const files = await contentService.getAllFiles();
      let count = 0;

      for (const filePath of files) {
        const doc = await contentService.getContent(filePath);
        if (doc) {
          const segments = filePath.split('/');
          const collection = segments.length > 1 ? segments[0] : null;
          await db.indexFile(filePath, doc.title, doc.markdown, collection);
          count++;
        }
      }

      res.json({ indexed: count });
    } catch (error) {
      console.error('Error reindexing content:', error);
      res.status(500).json({ error: 'Failed to reindex content' });
    }
  });

  // Get content by path (wildcard)
  router.get('/content/*', async (req: Request, res: Response): Promise<void> => {
    try {
      const path = req.params[0];
      const doc = await contentService.getContent(path);
      if (!doc) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }
      res.set('Cache-Control', 'public, max-age=60');
      res.json(doc);
    } catch (error) {
      console.error('Error fetching content:', error);
      res.status(500).json({ error: 'Failed to fetch content' });
    }
  });

  // Update content by path (wildcard)
  router.put('/content/*', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
      const path = req.params[0];
      const { markdown } = req.body;

      await contentService.writeContent(path, markdown);

      // Re-index this file
      const doc = await contentService.getContent(path);
      if (doc) {
        const segments = path.split('/');
        const collection = segments.length > 1 ? segments[0] : null;
        await db.indexFile(path, doc.title, doc.markdown, collection);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error updating content:', error);
      res.status(500).json({ error: 'Failed to update content' });
    }
  });

  return router;
}
