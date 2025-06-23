import { Converter } from "showdown";

/**
 * Converts HTML content to Markdown format
 * This is a simplified converter that handles common TipTap editor elements
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return "";

  // Create a temporary DOM element to parse the HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  return convertNodeToMarkdown(tempDiv);
}

function convertNodeToMarkdown(node: Node): string {
  let markdown = "";

  // Handle text nodes
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || "";
  }

  // Handle element nodes
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    const tagName = element.tagName.toLowerCase();

    switch (tagName) {
      case "h1":
        markdown += `# ${getTextContent(element)}\n\n`;
        break;
      case "h2":
        markdown += `## ${getTextContent(element)}\n\n`;
        break;
      case "h3":
        markdown += `### ${getTextContent(element)}\n\n`;
        break;
      case "h4":
        markdown += `#### ${getTextContent(element)}\n\n`;
        break;
      case "h5":
        markdown += `##### ${getTextContent(element)}\n\n`;
        break;
      case "h6":
        markdown += `###### ${getTextContent(element)}\n\n`;
        break;
      case "p":
        markdown += `${getTextContent(element)}\n\n`;
        break;
      case "strong":
      case "b":
        markdown += `**${getTextContent(element)}**`;
        break;
      case "em":
      case "i":
        markdown += `*${getTextContent(element)}*`;
        break;
      case "u":
        markdown += `__${getTextContent(element)}__`;
        break;
      case "s":
      case "strike":
        markdown += `~~${getTextContent(element)}~~`;
        break;
      case "mark":
        markdown += `==${getTextContent(element)}==`;
        break;
      case "code":
        if (element.parentElement?.tagName.toLowerCase() === "pre") {
          markdown += element.textContent || "";
        } else {
          markdown += `\`${element.textContent || ""}\``;
        }
        break;
      case "pre":
        markdown += `\`\`\`\n${element.textContent || ""}\n\`\`\`\n\n`;
        break;
      case "blockquote":
        const blockquoteContent = getTextContent(element);
        markdown += `> ${blockquoteContent.replace(/\n/g, "\n> ")}\n\n`;
        break;
      case "ul":
        markdown += convertListToMarkdown(element, false);
        break;
      case "ol":
        markdown += convertListToMarkdown(element, true);
        break;
      case "li":
        // This will be handled by the parent ul/ol
        markdown += getTextContent(element);
        break;
      case "hr":
        markdown += "---\n\n";
        break;
      case "br":
        markdown += "\n";
        break;
      default:
        // For other elements, process their children
        for (const child of Array.from(element.childNodes)) {
          markdown += convertNodeToMarkdown(child);
        }
    }
  }

  return markdown;
}

function getTextContent(element: Element): string {
  let text = "";
  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      text += child.textContent || "";
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      text += convertNodeToMarkdown(child);
    }
  }
  return text.trim();
}

function convertListToMarkdown(
  listElement: Element,
  isOrdered: boolean,
): string {
  let markdown = "";
  const items = listElement.querySelectorAll("li");

  items.forEach((item, index) => {
    const prefix = isOrdered ? `${index + 1}. ` : "- ";
    const content = getTextContent(item);
    markdown += `${prefix}${content}\n`;
  });

  markdown += "\n";
  return markdown;
}

/**
 * Converts Markdown to HTML for TipTap editor using Showdown
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return "";

  console.log("📝 markdownToHtml input:", markdown);

  // Preprocess markdown to ensure proper paragraph breaks
  let processedMarkdown = markdown;

  // If the text doesn't have double newlines but has single newlines separating sentences/paragraphs
  // Convert single newlines to double newlines for paragraph breaks
  if (!processedMarkdown.includes("\n\n")) {
    // Split by single newlines and rejoin with double newlines for proper paragraph separation
    const lines = processedMarkdown
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (lines.length > 1) {
      processedMarkdown = lines.join("\n\n");
    }
  }

  console.log("📝 Processed markdown:", processedMarkdown);

  // Create Showdown converter with options optimized for TipTap
  const converter = new Converter({
    headerLevelStart: 1,
    simplifiedAutoLink: true,
    strikethrough: true,
    tables: true,
    tasklists: true,
    smoothLivePreview: true,
    smartIndentationFix: true,
    disableForced4SpacesIndentedSublists: true,
    simpleLineBreaks: false, // Changed to false to preserve paragraph structure
    requireSpaceBeforeHeadingText: true,
  });

  // Convert markdown to HTML
  const html = converter.makeHtml(processedMarkdown);

  console.log("📝 markdownToHtml final output:", html);

  return html;
}

/**
 * Downloads content as a markdown file
 */
export function downloadMarkdown(
  content: string,
  filename: string = "document.md",
): void {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
