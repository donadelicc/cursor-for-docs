import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type (PDF only)
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    // Validate file size (500MB limit for Blob Storage, but let's be more conservative)
    const maxSize = 100 * 1024 * 1024; // 100MB limit
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds 100MB limit. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 413 }
      );
    }

    // Generate unique filename to avoid conflicts
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const filename = `${timestamp}-${randomId}-${file.name}`;

    // Upload to Vercel Blob Storage
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false, // We're already adding our own suffix
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      filename: filename,
      originalName: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Blob upload error:', error);
    
    // Check if it's an authentication error
    const isAuthError = error instanceof Error && 
      (error.message.includes('token') || error.message.includes('auth') || error.message.includes('401'));
    
    return NextResponse.json(
      { 
        error: 'Failed to upload file to storage',
        details: error instanceof Error ? error.message : 'Unknown error',
        hint: isAuthError ? 'Check if BLOB_READ_WRITE_TOKEN environment variable is set' : undefined
      },
      { status: 500 }
    );
  }
}