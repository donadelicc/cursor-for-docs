import mammoth from 'mammoth';

export interface ImportResult {
  html: string;
  messages: string[];
}

/**
 * Converts a DOCX file to HTML that can be inserted into TipTap
 */
export async function importDocxFile(file: File): Promise<ImportResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    const result = await mammoth.convertToHtml(
      { arrayBuffer },
      {
        // Configure conversion options for better TipTap compatibility
        ignoreEmptyParagraphs: false, // Keep empty paragraphs for spacing
        includeDefaultStyleMap: true, // Include default mappings which might have font info
        styleMap: [
          // Map DOCX styles to HTML elements that TipTap understands
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
          "p[style-name='Quote'] => blockquote:fresh",
          "p[style-name='Code'] => pre:fresh",
          // Handle built-in heading styles
          "p[style-name='Title'] => h1:fresh",
          "p[style-name='Subtitle'] => h2:fresh",
          // Handle list styles
          "p[style-name='List Paragraph'] => p:fresh",
          // Handle center alignment
          "p[style-name='centered'] => p.centered:fresh",
          "p[style-name='center'] => p.centered:fresh",
          // Handle other common styles
          "p[style-name='Normal (Web)'] => p:fresh",
          "p[style-name='Body Text'] => p:fresh",
          // Try to preserve font information by mapping runs to spans
          'r => span:fresh',
        ],
      },
    );

    // Clean up the HTML for TipTap compatibility
    const cleanedHtml = cleanHtmlForTipTap(result.value);

    // Debug: Log the original and cleaned HTML to see font preservation
    console.log('Original HTML from mammoth:', result.value);
    console.log('Cleaned HTML for TipTap:', cleanedHtml);

    // Try to detect and apply fonts based on document analysis
    const fontEnhancedHtml = detectAndApplyFonts(cleanedHtml, file.name);

    return {
      html: fontEnhancedHtml,
      messages: result.messages.map((m) => m.message),
    };
  } catch (error) {
    throw new Error(
      `Failed to import DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Cleans HTML to be more compatible with TipTap while preserving formatting
 */
function cleanHtmlForTipTap(html: string): string {
  // Create a temporary DOM element for HTML manipulation
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Process all elements to preserve and enhance formatting
  const allElements = tempDiv.querySelectorAll('*');
  allElements.forEach((element) => {
    // Process inline styles to convert them to TipTap-compatible attributes
    const style = element.getAttribute('style');
    if (style) {
      processInlineStyles(element, style);
    }

    // Remove problematic attributes but keep formatting ones
    element.removeAttribute('id');
    element.removeAttribute('dir');
    element.removeAttribute('lang');

    // Keep class if it's useful for TipTap
    const className = element.getAttribute('class');
    if (className && !isValidTipTapClass(className)) {
      // Convert some common classes to TipTap format
      if (className.includes('center') || className.includes('Center')) {
        element.setAttribute('style', 'text-align: center');
      }
      element.removeAttribute('class');
    }
  });

  // Convert formatting elements to TipTap-compatible ones
  convertFormattingElements(tempDiv);

  // Handle text alignment from DOCX
  handleTextAlignment(tempDiv);

  // Ensure font families are properly wrapped in spans for TipTap
  ensureFontSpans(tempDiv);

  return tempDiv.innerHTML;
}

/**
 * Converts formatting elements to TipTap-compatible structure
 */
function convertFormattingElements(container: Element): void {
  // Convert <b> to <strong>
  const boldElements = container.querySelectorAll('b');
  boldElements.forEach((b) => {
    const strong = document.createElement('strong');
    strong.innerHTML = b.innerHTML;
    // Preserve any styles that were on the <b> element
    const style = b.getAttribute('style');
    if (style) {
      strong.setAttribute('style', style);
    }
    b.parentNode?.replaceChild(strong, b);
  });

  // Convert <i> to <em>
  const italicElements = container.querySelectorAll('i');
  italicElements.forEach((i) => {
    const em = document.createElement('em');
    em.innerHTML = i.innerHTML;
    // Preserve any styles that were on the <i> element
    const style = i.getAttribute('style');
    if (style) {
      em.setAttribute('style', style);
    }
    i.parentNode?.replaceChild(em, i);
  });

  // Handle <u> elements for underline
  const underlineElements = container.querySelectorAll('u');
  underlineElements.forEach((u) => {
    const span = document.createElement('span');
    span.innerHTML = u.innerHTML;
    const existingStyle = u.getAttribute('style') || '';
    span.setAttribute('style', existingStyle + 'text-decoration: underline;');
    u.parentNode?.replaceChild(span, u);
  });

  // Ensure proper paragraph structure for loose text nodes
  const textNodes = Array.from(container.childNodes).filter(
    (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
  );

  textNodes.forEach((textNode) => {
    if (textNode.textContent?.trim()) {
      const p = document.createElement('p');
      p.textContent = textNode.textContent;
      textNode.parentNode?.replaceChild(p, textNode);
    }
  });
}

/**
 * Processes inline styles and converts them to TipTap-compatible format
 */
function processInlineStyles(element: Element, style: string): void {
  // Parse common CSS properties
  const styles = style.split(';').reduce(
    (acc, s) => {
      const [property, value] = s.split(':').map((x) => x.trim());
      if (property && value) {
        acc[property] = value;
      }
      return acc;
    },
    {} as Record<string, string>,
  );

  let newStyle = '';

  // Handle text alignment
  if (styles['text-align']) {
    newStyle += `text-align: ${styles['text-align']};`;
  }

  // Handle font weight (bold)
  if (
    styles['font-weight'] &&
    (styles['font-weight'] === 'bold' || Number(styles['font-weight']) >= 700)
  ) {
    // For bold, we'll let the <strong> tag handle this, but keep the style as backup
    newStyle += `font-weight: bold;`;
  }

  // Handle font style (italic)
  if (styles['font-style'] === 'italic') {
    newStyle += `font-style: italic;`;
  }

  // Handle text decoration (underline)
  if (styles['text-decoration'] && styles['text-decoration'].includes('underline')) {
    newStyle += `text-decoration: underline;`;
  }

  // Handle color
  if (styles['color']) {
    newStyle += `color: ${styles['color']};`;
  }

  // Handle font family - ensure it's preserved and cleaned
  if (styles['font-family']) {
    let fontFamily = styles['font-family'];
    // Clean up font family value (remove extra quotes, normalize)
    fontFamily = fontFamily.replace(/['"]/g, '').trim();

    // Map common DOCX font names to our available fonts
    const fontMapping: Record<string, string> = {
      'Times New Roman': 'Times New Roman, serif',
      Times: 'Times New Roman, serif',
      Arial: 'Arial',
      Helvetica: 'Helvetica',
      Georgia: 'Georgia, serif',
      'Courier New': 'Courier New, monospace',
      Courier: 'Courier New, monospace',
      Verdana: 'Verdana, sans-serif',
      Tahoma: 'Tahoma, sans-serif',
      'Comic Sans MS': 'Comic Sans MS, cursive',
      Impact: 'Impact, sans-serif',
      Monaco: 'Monaco, monospace',
    };

    // Use mapped font or original if not found
    const mappedFont = fontMapping[fontFamily] || fontFamily;
    newStyle += `font-family: ${mappedFont};`;
  }

  // Handle background color (highlighting)
  if (styles['background-color'] || styles['background']) {
    const bgColor = styles['background-color'] || styles['background'];
    if (bgColor !== 'transparent' && bgColor !== 'white' && bgColor !== '#ffffff') {
      newStyle += `background-color: ${bgColor};`;
    }
  }

  // Update the element's style
  if (newStyle) {
    element.setAttribute('style', newStyle);
  } else {
    element.removeAttribute('style');
  }
}

/**
 * Ensures that text with font-family styles is properly wrapped in spans for TipTap
 */
function ensureFontSpans(container: Element): void {
  // Find all elements with font-family styles
  const elementsWithFonts = container.querySelectorAll('*[style*="font-family"]');

  elementsWithFonts.forEach((element) => {
    const style = element.getAttribute('style') || '';
    const fontFamilyMatch = style.match(/font-family:\s*([^;]+)/);

    if (fontFamilyMatch && element.tagName.toLowerCase() !== 'span') {
      // If it's not already a span, we need to wrap the content
      const fontFamily = fontFamilyMatch[1].trim();

      // Check if this element has only text content or simple formatting
      if (element.children.length === 0 || onlyContainsSimpleFormatting(element)) {
        // Wrap the content in a span with the font-family
        const span = document.createElement('span');
        span.setAttribute('style', `font-family: ${fontFamily}`);
        span.innerHTML = element.innerHTML;

        // Remove font-family from the original element
        const newStyle = style.replace(/font-family:\s*[^;]+;?/g, '').trim();
        if (newStyle) {
          element.setAttribute('style', newStyle);
        } else {
          element.removeAttribute('style');
        }

        // Replace content with the span
        element.innerHTML = '';
        element.appendChild(span);
      }
    }
  });
}

/**
 * Checks if an element only contains simple formatting (strong, em, u, etc.)
 */
function onlyContainsSimpleFormatting(element: Element): boolean {
  const allowedTags = ['strong', 'em', 'u', 'span', 'b', 'i'];
  const children = Array.from(element.children);

  return children.every(
    (child) =>
      allowedTags.includes(child.tagName.toLowerCase()) || child.nodeType === Node.TEXT_NODE,
  );
}

/**
 * Handles text alignment detection and conversion
 */
function handleTextAlignment(container: Element): void {
  // Look for center-aligned content (common in document headers)
  const paragraphs = container.querySelectorAll('p');
  paragraphs.forEach((p) => {
    const text = p.textContent?.trim() || '';

    // Check if this looks like a title or header that should be centered
    if (isTitleText(text)) {
      const currentStyle = p.getAttribute('style') || '';
      if (!currentStyle.includes('text-align')) {
        p.setAttribute('style', currentStyle + 'text-align: center;');
      }
    }
  });
}

/**
 * Determines if text looks like a title that should be centered
 */
function isTitleText(text: string): boolean {
  // Common patterns for document titles
  const titlePatterns = [
    /^[A-Z\s-]+AGREEMENT$/i,
    /^[A-Z\s-]+CONTRACT$/i,
    /^[A-Z\s-]+DOCUMENT$/i,
    /^PART-TIME\s+EMPLOYMENT/i,
    /^EMPLOYMENT\s+AGREEMENT/i,
  ];

  return (
    titlePatterns.some((pattern) => pattern.test(text)) ||
    (text.length < 50 && text === text.toUpperCase() && text.includes(' '))
  );
}

/**
 * Detects and applies fonts based on document content analysis
 */
function detectAndApplyFonts(html: string, filename: string): string {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Common document types and their typical fonts
  const documentFontMap: Record<string, string> = {
    contract: 'Times New Roman, serif',
    agreement: 'Times New Roman, serif',
    legal: 'Times New Roman, serif',
    formal: 'Times New Roman, serif',
    letter: 'Times New Roman, serif',
    memo: 'Arial',
    report: 'Arial',
    business: 'Arial',
  };

  // Analyze filename and content to guess the appropriate font
  let detectedFont = 'Times New Roman, serif'; // Default to Times New Roman for formal documents

  const lowerFilename = filename.toLowerCase();
  const content = tempDiv.textContent?.toLowerCase() || '';

  // Check filename for hints
  for (const [type, font] of Object.entries(documentFontMap)) {
    if (lowerFilename.includes(type)) {
      detectedFont = font;
      break;
    }
  }

  // Check content for legal/formal language patterns
  const formalPatterns = [
    /agreement/i,
    /contract/i,
    /whereas/i,
    /party of the first part/i,
    /party of the second part/i,
    /terms and conditions/i,
    /employment/i,
    /legal/i,
    /hereby/i,
    /aforementioned/i,
  ];

  const isFormalDocument = formalPatterns.some((pattern) => pattern.test(content));
  if (isFormalDocument) {
    detectedFont = 'Times New Roman, serif';
  }

  // Apply the detected font to all paragraphs and spans that don't already have a font
  const textElements = tempDiv.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6');
  textElements.forEach((element) => {
    const currentStyle = element.getAttribute('style') || '';

    // Only apply font if no font-family is already set
    if (!currentStyle.includes('font-family')) {
      const newStyle = currentStyle
        ? `${currentStyle}; font-family: ${detectedFont}`
        : `font-family: ${detectedFont}`;
      element.setAttribute('style', newStyle);
    }
  });

  console.log(`Applied detected font: ${detectedFont} to document`);
  return tempDiv.innerHTML;
}

/**
 * Checks if a CSS class name is compatible with TipTap
 */
function isValidTipTapClass(className: string): boolean {
  // List of class names that TipTap uses/allows
  const validClasses = ['highlight', 'code-block', 'centered'];
  return validClasses.some((validClass) => className.includes(validClass));
}
