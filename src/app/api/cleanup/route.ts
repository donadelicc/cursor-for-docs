import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { blobUrls } = body;

    if (!blobUrls || !Array.isArray(blobUrls)) {
      return NextResponse.json(
        { error: 'Invalid request: blobUrls array required' },
        { status: 400 }
      );
    }

    const results = [];
    
    for (const url of blobUrls) {
      try {
        await del(url);
        results.push({ url, status: 'deleted' });
        console.log(`Successfully deleted blob: ${url}`);
      } catch (error) {
        console.error(`Failed to delete blob ${url}:`, error);
        results.push({ 
          url, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      results: results,
      deletedCount: results.filter(r => r.status === 'deleted').length,
      errorCount: results.filter(r => r.status === 'error').length,
    });
  } catch (error) {
    console.error('Cleanup API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to cleanup blob files',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}