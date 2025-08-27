import { NextRequest, NextResponse } from 'next/server';
import { getProjectSourceDownloadURL } from '@/utils/firestore';

export async function POST(request: NextRequest) {
  try {
    const { storagePath, filename } = await request.json();

    if (!storagePath || !filename) {
      return NextResponse.json(
        { error: 'Missing storagePath or filename' },
        { status: 400 }
      );
    }

    console.log('🔄 [Download API] Fetching file:', { storagePath, filename });

    // Get the Firebase Storage download URL
    const downloadURL = await getProjectSourceDownloadURL(storagePath);
    console.log('📁 [Download API] Got download URL');

    // Fetch the file from Firebase Storage (server-side, no CORS issues)
    const response = await fetch(downloadURL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }

    // Get the file as an ArrayBuffer
    const arrayBuffer = await response.arrayBuffer();
    console.log('📄 [Download API] File downloaded:', { size: arrayBuffer.byteLength });

    // Return the file data with proper headers
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': arrayBuffer.byteLength.toString(),
        'Content-Disposition': `attachment; filename="${filename}"`,
        // Enable CORS for the frontend
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('❌ [Download API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to download file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}