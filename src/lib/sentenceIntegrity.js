// api/lib/sentenceIntegrity.js

// Words that often indicate a mid-thought ending if they appear last
const SUSPICIOUS_END_WORDS = [
  "and",
  "but",
  "while",
  "though",
  "because",
  "although",
  "however",
  "as",
  "so",
  "or",
  "yet",
  "unless"
];

// Paragraph <p> classes we should IGNORE (labels, titles, section headers)
const WHITELISTED_P_CLASSES = [
  "label",
  "subsection-title",
  "section-intro",
  "section-number",
  "summary-header"
];

// Strip HTML tags for clean text analysis
function stripTags(html) {
  return html.replace(/<[^>]*>/g, "");
}

// Decide if a paragraph probably ends mid-thought
function isSuspiciousEnding(text) {
  const trimmed = text.trim();
  if (!trimmed) return false;

  const lastChar = trimmed.slice(-1);

  // If it already ends with strong punctuation, it's probably okay
  if (/[.!?…]/.test(lastChar)) return false;

  // Ending with a comma is almost always bad
  if (lastChar === ",") return true;

  const words = trimmed.split(/\s+/);
  const lastWord = words[words.length - 1]
    .toLowerCase()
    .replace(/[^\w]/g, "");

  if (SUSPICIOUS_END_WORDS.includes(lastWord)) return true;

  // Very short fragments without punctuation are suspicious too
  if (trimmed.length < 20) return true;

  return false;
}

/**
 * Ensure sentence integrity in HTML paragraphs.
 *
 * - Scans each <p>...</p>
 * - Skips whitelisted paragraph classes (labels, titles)
 * - Optionally appends a period if missing
 * - Collects warnings for suspicious endings
 *
 * @param {string} html
 * @param {object} options
 * @param {boolean} options.autoFixPunctuation - if true, add '.' when missing
 * @returns {{ html: string, warnings: string[] }}
 */
function ensureSentenceIntegrity(html, { autoFixPunctuation = true } = {}) {
  const warnings = [];

  const PARAGRAPH_REGEX = /(<p\b[^>]*>)([\s\S]*?)(<\/p>)/gi;

  const newHtml = html.replace(
    PARAGRAPH_REGEX,
    (match, openTag, innerHtml, closeTag) => {
      // Extract class attribute from <p>
      const classMatch = openTag.match(/class=["']([^"']*)["']/i);

      if (classMatch) {
        const classes = classMatch[1].split(/\s+/);

        // Skip whitelisted classes (titles, labels, etc.)
        if (classes.some(c => WHITELISTED_P_CLASSES.includes(c))) {
          return match; // return paragraph exactly as-is
        }
      }

      const visibleText = stripTags(innerHtml);
      const trimmed = visibleText.trim();

      if (!trimmed) {
        return match; // ignore empty paragraphs
      }

      const lastChar = trimmed.slice(-1);
      const suspicious = isSuspiciousEnding(trimmed);

      if (suspicious) {
        warnings.push(
          `Suspicious paragraph ending: "${trimmed.slice(0, 120)}${
            trimmed.length > 120 ? "..." : ""
          }"`
        );
      }

      // If we want to auto-fix, and it doesn't end with strong punctuation:
      if (autoFixPunctuation && !/[.!?…]/.test(lastChar)) {
        const fixedInner = innerHtml.replace(/\s*$/, "") + ".";
        return `${openTag}${fixedInner}${closeTag}`;
      }

      // Otherwise return unchanged paragraph
      return match;
    }
  );

  return { html: newHtml, warnings };
}

export { ensureSentenceIntegrity };
