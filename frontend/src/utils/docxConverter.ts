import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";

/**
 * Converts HTML from TipTap editor to DOCX and downloads it
 * @param html - The HTML content from TipTap editor
 * @param filename - The filename for the downloaded DOCX file
 */
export async function downloadAsDocx(
  html: string,
  filename: string = "document.docx",
): Promise<void> {
  try {
    // Parse HTML and convert to docx elements
    const docElements = parseHtmlToDocx(html);

    // Create the document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: docElements,
        },
      ],
    });

    // Generate the document buffer
    const buffer = await Packer.toBuffer(doc);

    // Create blob and download
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    saveAs(blob, filename);
  } catch (error) {
    console.error("Error converting to DOCX:", error);
    throw new Error("Failed to convert document to DOCX format");
  }
}

/**
 * Parses HTML content and converts it to docx elements
 * @param html - Raw HTML from TipTap editor
 * @returns Array of docx elements
 */
function parseHtmlToDocx(html: string): Paragraph[] {
  if (!html) return [new Paragraph({})];

  // Create a temporary DOM element to parse the HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  const paragraphs: Paragraph[] = [];

  // If there are no children, but there's text content, treat it as one paragraph
  if (tempDiv.children.length === 0 && tempDiv.textContent?.trim()) {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: tempDiv.textContent.trim() })],
      }),
    );
  } else {
    // Process each child element
    for (const child of Array.from(tempDiv.children)) {
      const childParagraphs = processElement(child);
      paragraphs.push(...childParagraphs);
    }
  }

  // If no paragraphs were created, add an empty one
  if (paragraphs.length === 0) {
    paragraphs.push(new Paragraph({}));
  }

  return paragraphs;
}

/**
 * Processes a single HTML element and converts it to docx elements
 */
function processElement(element: Element): Paragraph[] {
  const tagName = element.tagName.toLowerCase();
  const paragraphs: Paragraph[] = [];

  switch (tagName) {
    case "h1":
      paragraphs.push(
        new Paragraph({
          text: element.textContent || "",
          heading: HeadingLevel.HEADING_1,
        }),
      );
      break;

    case "h2":
      paragraphs.push(
        new Paragraph({
          text: element.textContent || "",
          heading: HeadingLevel.HEADING_2,
        }),
      );
      break;

    case "h3":
      paragraphs.push(
        new Paragraph({
          text: element.textContent || "",
          heading: HeadingLevel.HEADING_3,
        }),
      );
      break;

    case "h4":
      paragraphs.push(
        new Paragraph({
          text: element.textContent || "",
          heading: HeadingLevel.HEADING_4,
        }),
      );
      break;

    case "h5":
      paragraphs.push(
        new Paragraph({
          text: element.textContent || "",
          heading: HeadingLevel.HEADING_5,
        }),
      );
      break;

    case "h6":
      paragraphs.push(
        new Paragraph({
          text: element.textContent || "",
          heading: HeadingLevel.HEADING_6,
        }),
      );
      break;

    case "p":
      const runs = processInlineElements(element);
      if (runs.length === 0) {
        // Empty paragraph - still add it to preserve spacing
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: "" })],
          }),
        );
      } else {
        paragraphs.push(
          new Paragraph({
            children: runs,
          }),
        );
      }
      break;

    case "ul":
    case "ol":
      const listItems = element.querySelectorAll("li");
      for (let i = 0; i < listItems.length; i++) {
        const listItem = listItems[i];
        const runs = processInlineElements(listItem);
        paragraphs.push(
          new Paragraph({
            children: runs,
            bullet: { level: 0 },
          }),
        );
      }
      break;

    case "blockquote":
      const quoteRuns = processInlineElements(element);
      paragraphs.push(
        new Paragraph({
          children: quoteRuns,
          indent: { left: 720 }, // 0.5 inch indent
        }),
      );
      break;

    case "hr":
      // Handle page breaks
      if (element.getAttribute("data-type") === "pagebreak") {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "",
                break: 1,
              }),
            ],
            pageBreakBefore: true,
          }),
        );
      } else {
        // Regular horizontal rule
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "_______________________________________________",
              }),
            ],
          }),
        );
      }
      break;

    case "pre":
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: element.textContent || "",
              font: "Courier New",
            }),
          ],
        }),
      );
      break;

    default:
      // For other elements, process their children
      for (const child of Array.from(element.children)) {
        const childParagraphs = processElement(child);
        paragraphs.push(...childParagraphs);
      }

      // If element has no children but has text content, create a paragraph
      if (element.children.length === 0 && element.textContent?.trim()) {
        const runs = processInlineElements(element);
        paragraphs.push(
          new Paragraph({
            children: runs,
          }),
        );
      }
      break;
  }

  return paragraphs;
}

/**
 * Processes inline elements within a paragraph
 */
function processInlineElements(element: Element): TextRun[] {
  const runs: TextRun[] = [];

  function processNode(
    node: Node,
    inheritedFormatting: Record<string, unknown> = {},
  ): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      if (text) {
        runs.push(
          new TextRun({
            text: text,
            ...inheritedFormatting,
          }),
        );
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const elem = node as Element;
      const tagName = elem.tagName.toLowerCase();

      const formatting = { ...inheritedFormatting };

      // Apply formatting based on tag
      switch (tagName) {
        case "strong":
        case "b":
          formatting.bold = true;
          break;
        case "em":
        case "i":
          formatting.italics = true;
          break;
        case "u":
          formatting.underline = {};
          break;
        case "s":
        case "strike":
          formatting.strike = true;
          break;
        case "mark":
          formatting.highlight = "yellow";
          break;
        case "code":
          formatting.font = "Courier New";
          break;
        case "br":
          runs.push(
            new TextRun({
              text: "",
              break: 1,
              ...inheritedFormatting,
            }),
          );
          return; // Don't process children for br
      }

      // Process child nodes with accumulated formatting
      for (const child of Array.from(elem.childNodes)) {
        processNode(child, formatting);
      }
    }
  }

  // Process all child nodes
  for (const node of Array.from(element.childNodes)) {
    processNode(node);
  }

  // If no runs were created but element has text content, create a simple run
  if (runs.length === 0 && element.textContent?.trim()) {
    runs.push(
      new TextRun({
        text: element.textContent.trim(),
      }),
    );
  }

  return runs;
}

/**
 * Gets the current date in YYYY-MM-DD format for filename generation
 */
export function getCurrentDateString(): string {
  return new Date().toISOString().split("T")[0];
}
