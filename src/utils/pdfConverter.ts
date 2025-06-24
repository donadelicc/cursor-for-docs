/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Converts HTML from TipTap editor to PDF using PDFMake with DOCX-style parsing for reliable formatting
 * This reuses the proven parsing approach from our DOCX converter
 * @param html - The HTML content from TipTap editor  
 * @param filename - The filename for the downloaded PDF file
 */
export async function downloadAsPdf(
  html: string,
  filename: string = "document.pdf",
): Promise<void> {
  try {
    // Dynamically import PDFMake to avoid SSR issues
    const pdfMake = await import('pdfmake/build/pdfmake');
    const pdfFonts = await import('pdfmake/build/vfs_fonts');

    // Set up fonts with proper error handling
    try {
      // Try different possible VFS structures
      if (pdfFonts && (pdfFonts as any).default && (pdfFonts as any).default.pdfMake && (pdfFonts as any).default.pdfMake.vfs) {
        pdfMake.default.vfs = (pdfFonts as any).default.pdfMake.vfs;
      } else if (pdfFonts && (pdfFonts as any).default && (pdfFonts as any).default.vfs) {
        pdfMake.default.vfs = (pdfFonts as any).default.vfs;
      } else if (pdfFonts && (pdfFonts as any).pdfMake && (pdfFonts as any).pdfMake.vfs) {
        pdfMake.default.vfs = (pdfFonts as any).pdfMake.vfs;
      } else if (pdfFonts && (pdfFonts as any).vfs) {
        pdfMake.default.vfs = (pdfFonts as any).vfs;
      } else {
        console.warn('Could not load custom fonts, using default fonts');
        // Continue without custom fonts - PDFMake will use defaults
      }
    } catch (fontError) {
      console.warn('Font loading failed, using default fonts:', fontError);
      // Continue without custom fonts
    }

    // Parse HTML using DOCX-style parsing and convert to PDFMake format
    const content = parseHtmlToPdfMake(html);

    // Create PDFMake document definition with fallback font handling
    const docDefinition = {
      content: content.length > 0 ? content : [{ text: 'No content available.', style: 'normal' }],
      styles: {
        header1: {
          fontSize: 20,
          bold: true,
          color: '#2c3e50',
          margin: [0, 20, 0, 12] as [number, number, number, number]
        },
        header2: {
          fontSize: 16,
          bold: true,
          color: '#34495e',
          margin: [0, 16, 0, 10] as [number, number, number, number]
        },
        header3: {
          fontSize: 14,
          bold: true,
          color: '#34495e',
          margin: [0, 14, 0, 8] as [number, number, number, number]
        },
        header4: {
          fontSize: 12,
          bold: true,
          color: '#34495e',
          margin: [0, 12, 0, 6] as [number, number, number, number]
        },
        paragraph: {
          fontSize: 11,
          lineHeight: 1.4,
          margin: [0, 0, 0, 8] as [number, number, number, number]
        },
        normal: {
          fontSize: 11,
          lineHeight: 1.4
        },
        quote: {
          fontSize: 11,
          italics: true,
          color: '#7f8c8d',
          margin: [20, 10, 0, 10] as [number, number, number, number]
        },
        code: {
          fontSize: 10,
          margin: [5, 5, 5, 5] as [number, number, number, number]
        }
      },
      defaultStyle: {
        fontSize: 11,
        // Remove font specification to use PDFMake defaults if custom fonts fail
      },
      pageMargins: [40, 60, 40, 60] as [number, number, number, number], // left, top, right, bottom
    };

    // Create and download PDF
    pdfMake.default.createPdf(docDefinition).download(filename);

  } catch (error) {
    console.error("Error converting to PDF:", error);
    
    // Provide more detailed error information
    if (error instanceof Error) {
      if (error.message.includes('vfs')) {
        throw new Error("PDF font loading failed. This might be due to a PDFMake version issue. The document structure will be preserved but fonts may appear different.");
      } else {
        throw new Error(`Failed to convert document to PDF format: ${error.message}`);
      }
    } else {
      throw new Error("Failed to convert document to PDF format: Unknown error occurred");
    }
  }
}

/**
 * Parses HTML using DOCX-style logic and converts directly to PDFMake format
 * This reuses the proven parsing approach from our DOCX converter
 */
function parseHtmlToPdfMake(html: string): any[] {
  if (!html) return [{ text: '', style: 'normal' }];

  // Create a temporary DOM element to parse the HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  const content: any[] = [];

  // If there are no children, but there's text content, treat it as one paragraph
  if (tempDiv.children.length === 0 && tempDiv.textContent?.trim()) {
    content.push({
      text: tempDiv.textContent.trim(),
      style: 'normal'
    });
  } else {
    // Process each child element using DOCX-style processing
    for (const child of Array.from(tempDiv.children)) {
      const elements = processElementForPdfMake(child);
      content.push(...elements);
    }
  }

  // If no content was created, add a default paragraph
  if (content.length === 0) {
    content.push({ text: '', style: 'normal' });
  }

  return content;
}

/**
 * Processes a single HTML element using DOCX-style logic adapted for PDFMake
 * This mirrors the processElement function from docxConverter.ts
 */
function processElementForPdfMake(element: Element): any[] {
  const tagName = element.tagName.toLowerCase();
  const elements: any[] = [];

  switch (tagName) {
    case "h1":
      elements.push({
        text: element.textContent || "",
        style: 'header1'
      });
      break;

    case "h2":
      elements.push({
        text: element.textContent || "",
        style: 'header2'
      });
      break;

    case "h3":
      elements.push({
        text: element.textContent || "",
        style: 'header3'
      });
      break;

    case "h4":
    case "h5":
    case "h6":
      elements.push({
        text: element.textContent || "",
        style: 'header4'
      });
      break;

    case "p":
      const pRuns = processInlineElementsForPdfMake(element);
      if (pRuns.length === 0) {
        // Empty paragraph - still add it to preserve spacing
        elements.push({
          text: "",
          style: 'paragraph'
        });
      } else {
        elements.push({
          text: pRuns,
          style: 'paragraph'
        });
      }
      break;

    case "ul":
      const ulItems: any[] = [];
      const ulListItems = element.querySelectorAll("li");
      for (const listItem of ulListItems) {
        const runs = processInlineElementsForPdfMake(listItem);
        ulItems.push(runs.length > 0 ? runs : { text: listItem.textContent || "" });
      }
      if (ulItems.length > 0) {
        elements.push({
          ul: ulItems,
          margin: [0, 5, 0, 5]
        });
      }
      break;

    case "ol":
      const olItems: any[] = [];
      const olListItems = element.querySelectorAll("li");
      for (const listItem of olListItems) {
        const runs = processInlineElementsForPdfMake(listItem);
        olItems.push(runs.length > 0 ? runs : { text: listItem.textContent || "" });
      }
      if (olItems.length > 0) {
        elements.push({
          ol: olItems,
          margin: [0, 5, 0, 5]
        });
      }
      break;

    case "blockquote":
      const quoteRuns = processInlineElementsForPdfMake(element);
      elements.push({
        text: quoteRuns.length > 0 ? quoteRuns : element.textContent || "",
        style: 'quote'
      });
      break;

    case "pre":
    case "code":
      elements.push({
        text: element.textContent || "",
        style: 'code'
      });
      break;

    case "hr":
      // Handle page breaks
      if (element.getAttribute("data-type") === "pagebreak") {
        elements.push({
          text: "",
          pageBreak: 'before'
        });
      } else {
        // Regular horizontal rule
        elements.push({
          canvas: [
            {
              type: 'line',
              x1: 0, y1: 0,
              x2: 515, y2: 0,
              lineWidth: 1,
              lineColor: '#CCCCCC'
            }
          ],
          margin: [0, 10, 0, 10]
        });
      }
      break;

    case "br":
      elements.push({ text: '\n' });
      break;

    default:
      // For other elements, recursively process their children
      for (const child of Array.from(element.children)) {
        const childElements = processElementForPdfMake(child);
        elements.push(...childElements);
      }
      break;
  }

  return elements;
}

/**
 * Processes inline elements using DOCX-style logic adapted for PDFMake
 * This mirrors the processInlineElements function from docxConverter.ts
 */
function processInlineElementsForPdfMake(element: Element): any[] {
  const runs: any[] = [];

  function processNode(node: Node, inheritedFormatting: any = {}): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (text) {
        runs.push({
          text: text,
          ...inheritedFormatting
        });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const htmlElement = node as HTMLElement;
      const tagName = htmlElement.tagName.toLowerCase();
      
      const newFormatting = { ...inheritedFormatting };

      // Apply formatting based on tag
      switch (tagName) {
        case 'strong':
        case 'b':
          newFormatting.bold = true;
          break;
        case 'em':
        case 'i':
          newFormatting.italics = true;
          break;
        case 'u':
          newFormatting.decoration = 'underline';
          break;
        case 's':
        case 'strike':
          newFormatting.decoration = 'lineThrough';
          break;
        case 'mark':
          newFormatting.background = '#ffff00';
          break;
        case 'code':
          newFormatting.background = '#f5f5f5';
          break;
      }

      // Process child nodes with the new formatting
      for (const child of Array.from(htmlElement.childNodes)) {
        processNode(child, newFormatting);
      }
    }
  }

  // Process all child nodes
  for (const child of Array.from(element.childNodes)) {
    processNode(child);
  }

  return runs;
}
