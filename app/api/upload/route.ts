import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, resolve, extname } from 'path';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

const CONTENT_DIR = resolve(process.env.CONTENT_DIR || '/app/content');
const ASSETS_DIR = join(CONTENT_DIR, '_assets');
const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']);
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const ext = extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: `File type ${ext} not allowed` }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
    const filename = `${timestamp}-${safeName}`;

    await mkdir(ASSETS_DIR, { recursive: true });
    const filePath = join(ASSETS_DIR, filename);

    // Ensure path is within assets dir
    if (!filePath.startsWith(ASSETS_DIR + '/')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const markdownPath = `/_assets/${filename}`;
    return NextResponse.json({ path: markdownPath, filename });
  } catch (error) {
    logger.error({ err: error }, 'Upload failed');
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
