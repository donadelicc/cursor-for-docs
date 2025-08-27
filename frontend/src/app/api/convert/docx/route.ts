import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { html, filename = 'document.docx' } = await request.json();

    if (!html) {
      return NextResponse.json({ error: 'HTML content is required' }, { status: 400 });
    }

    // Create temporary files
    const tempDir = os.tmpdir();
    const htmlFile = path.join(tempDir, `temp-${Date.now()}.html`);
    const docxFile = path.join(tempDir, `temp-${Date.now()}.docx`);

    try {
      // Write HTML to temporary file
      await fs.writeFile(htmlFile, html, 'utf-8');

      // Use Pandoc to convert HTML to DOCX
      const pandocCommand = `pandoc "${htmlFile}" -o "${docxFile}" --from html --to docx`;

      await execAsync(pandocCommand);

      // Read the generated DOCX file
      const docxBuffer = await fs.readFile(docxFile);

      // Clean up temporary files
      await fs.unlink(htmlFile);
      await fs.unlink(docxFile);

      // Return the DOCX file as a response
      return new NextResponse(docxBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } catch (conversionError) {
      // Clean up files on error
      try {
        await fs.unlink(htmlFile);
        await fs.unlink(docxFile);
      } catch {
        // Ignore cleanup errors
      }

      console.error('Pandoc conversion error:', conversionError);
      return NextResponse.json(
        { error: 'Failed to convert document. Make sure Pandoc is installed.' },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
