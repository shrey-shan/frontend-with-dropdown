import { NextRequest, NextResponse } from 'next/server';
import { constants } from 'fs';
import { access, readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const imagePath = resolvedParams.path.join('/');
    const decodedPath = decodeURIComponent(imagePath);

    // Extract the full path from the URL search params or request headers
    const url = new URL(request.url);
    const fullImagePath = url.searchParams.get('fullPath') || decodedPath;

    let resolvedPath: string;

    // If a full path is provided, use it directly
    if (fullImagePath.includes('/') || fullImagePath.includes('\\')) {
      resolvedPath = path.resolve(fullImagePath);
    } else {
      // Fallback: try to construct from common patterns
      const possibleBasePaths = [
        process.env.IMAGES_BASE_PATH,
        './output/markdowns/',
        '../output/markdowns/',
        './backendtest_temp/output/markdowns/',
        process.cwd() + '/output/markdowns/',
      ].filter(Boolean);

      let foundPath: string | null = null;
      for (const basePath of possibleBasePaths) {
        const testPath = path.resolve(path.join(basePath as string, decodedPath));
        try {
          await access(testPath, constants.F_OK);
          foundPath = testPath;
          break;
        } catch {
          // Continue to next path
        }
      }

      if (!foundPath) {
        return new NextResponse('Image not found', { status: 404 });
      }

      resolvedPath = foundPath;
    }

    // Security check: basic validation
    if (!resolvedPath || resolvedPath.length < 3) {
      return new NextResponse('Invalid path', { status: 400 });
    }

    // Check if file exists
    try {
      await access(resolvedPath, constants.F_OK);
    } catch {
      return new NextResponse('Image not found', { status: 404 });
    }

    // Read the file
    const imageBuffer = await readFile(resolvedPath);

    // Determine content type
    const ext = path.extname(resolvedPath).toLowerCase();
    const contentType = getContentType(ext);

    return new NextResponse(new Uint8Array(imageBuffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

function getContentType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp',
    '.ico': 'image/x-icon',
  };

  return mimeTypes[ext] || 'image/png';
}
