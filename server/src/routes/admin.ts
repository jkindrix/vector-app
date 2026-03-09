import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { Database } from '../database';

function validatePassword(password: string): string | null {
  if (password.length < 12) {
    return 'Password must be at least 12 characters long';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one digit';
  }
  return null;
}

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

export function adminRouter(db: Database) {
  const router = Router();

  // All admin routes require authentication
  router.use(authenticateToken);

  // Create new admin user
  router.post('/users', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required' });
        return;
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        res.status(400).json({ error: passwordError });
        return;
      }

      const newAdmin = await db.createAdminUser(username, password);
      res.status(201).json({
        message: 'Admin user created successfully',
        user: newAdmin
      });
    } catch (error) {
      console.error('Error creating admin user:', error);
      if (error instanceof Error && error.message === 'Username already exists') {
        res.status(409).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Failed to create admin user' });
    }
  });

  // Get all admin users
  router.get('/users', async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      const adminUsers = await db.getAllAdminUsers();
      res.json(adminUsers);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      res.status(500).json({ error: 'Failed to fetch admin users' });
    }
  });

  // Update admin password
  router.put('/users/:username/password', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { username } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
        res.status(400).json({ error: 'New password is required' });
        return;
      }

      const passwordError = validatePassword(newPassword);
      if (passwordError) {
        res.status(400).json({ error: passwordError });
        return;
      }

      const updatedAdmin = await db.updateAdminPassword(username, newPassword);
      res.json({
        message: 'Password updated successfully',
        user: updatedAdmin
      });
    } catch (error) {
      console.error('Error updating password:', error);
      if (error instanceof Error && error.message === 'Admin user not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Failed to update password' });
    }
  });

  // Delete admin user
  router.delete('/users/:username', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { username } = req.params;

      // Prevent self-deletion
      if (req.user && req.user.username === username) {
        res.status(400).json({ error: 'Cannot delete your own account' });
        return;
      }

      const result = await db.deleteAdminUser(username);
      res.json({
        message: 'Admin user deleted successfully',
        username: result.username
      });
    } catch (error) {
      console.error('Error deleting admin user:', error);
      if (error instanceof Error && error.message === 'Admin user not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Failed to delete admin user' });
    }
  });

  return router;
}