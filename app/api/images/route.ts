import { NextRequest, NextResponse } from 'next/server';
import { access, readFile } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageName = searchParams.get('name');

    if (!imageName) {
      return new NextResponse('Image name is required', { status: 400 });
    }

    // Validate image name to prevent path traversal attacks
    if (imageName.includes('..') || imageName.includes('/') || imageName.includes('\\')) {
      return new NextResponse('Invalid image name', { status: 400 });
    }

    // Multiple possible paths for different deployment scenarios
    const possiblePaths = [
      // For Vercel deployment - images copied to public folder
      path.join(process.cwd(), 'public', 'diagnostic-images', imageName),
      // For local development (current working structure)
      path.join(
        process.cwd(),
        '..',
        'backendtest4',
        'output',
        'markdowns',
        'TSB_Honda-full-with-serials_artifacts',
        imageName
      ),
      // For Vercel deployment where both are in the same repo
      path.join(
        process.cwd(),
        'backendtest4',
        'output',
        'markdowns',
        'TSB_Honda-full-with-serials_artifacts',
        imageName
      ),
      // For Vercel deployment with different structure
      path.join(
        '/tmp',
        'backendtest4',
        'output',
        'markdowns',
        'TSB_Honda-full-with-serials_artifacts',
        imageName
      ),
      // Environment variable override
      process.env.BACKEND_IMAGE_PATH ? path.join(process.env.BACKEND_IMAGE_PATH, imageName) : '',
    ].filter(Boolean);

    let imageBuffer: Buffer;
    let foundPath = '';

    // Try each path until we find the image
    for (const imagePath of possiblePaths) {
      try {
        await access(imagePath);
        imageBuffer = await readFile(imagePath);
        foundPath = imagePath;
        break;
      } catch (error) {
        console.log(`Image not found at: ${imagePath}`);
        continue;
      }
    }

    if (!imageBuffer!) {
      console.error(`Image ${imageName} not found in any of the following paths:`, possiblePaths);
      return new NextResponse('Image not found', { status: 404 });
    }

    console.log(`Successfully serving image from: ${foundPath}`);

    // Determine content type based on file extension
    const ext = path.extname(imageName).toLowerCase();
    let contentType = 'image/png'; // default
    if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (ext === '.gif') {
      contentType = 'image/gif';
    } else if (ext === '.webp') {
      contentType = 'image/webp';
    }

    // Return the image with appropriate headers
    return new NextResponse(imageBuffer as BodyInit, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'Access-Control-Allow-Origin': '*', // Allow cross-origin requests if needed
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(`Server error: ${errorMessage}`, { status: 500 });
  }
}
