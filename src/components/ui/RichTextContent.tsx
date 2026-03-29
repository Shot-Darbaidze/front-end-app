import React from "react";

/**
 * Renders plain text with Google Messages-style inline formatting:
 *   *bold*  or  **bold**  →  <strong>
 *   _italic_              →  <em>
 *   ~strikethrough~       →  <s>
 *   newlines              →  <br />
 *
 * Reusable in both server and client components.
 */

const INLINE_RE = /\*\*(.+?)\*\*|\*([^*]+?)\*|_([^_]+?)_|~([^~]+?)~/g;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isProbablyHtml(text: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(text);
}

function htmlToInlineRichHtml(html: string): string {
  const B_OPEN = "__RT_B_OPEN__";
  const B_CLOSE = "__RT_B_CLOSE__";
  const I_OPEN = "__RT_I_OPEN__";
  const I_CLOSE = "__RT_I_CLOSE__";
  const S_OPEN = "__RT_S_OPEN__";
  const S_CLOSE = "__RT_S_CLOSE__";
  const BR = "__RT_BR__";

  const textWithMarkers = html
    .replace(/<\s*br\s*\/?\s*>/gi, BR)
    .replace(/<\s*\/\s*(p|div|section|article|blockquote|header|footer|h[1-6])\s*>/gi, BR)
    .replace(/<\s*li[^>]*>/gi, "• ")
    .replace(/<\s*\/\s*li\s*>/gi, BR)
    .replace(/<\s*(strong|b)[^>]*>/gi, B_OPEN)
    .replace(/<\s*\/\s*(strong|b)\s*>/gi, B_CLOSE)
    .replace(/<\s*(em|i)[^>]*>/gi, I_OPEN)
    .replace(/<\s*\/\s*(em|i)\s*>/gi, I_CLOSE)
    .replace(/<\s*(s|strike|del)[^>]*>/gi, S_OPEN)
    .replace(/<\s*\/\s*(s|strike|del)\s*>/gi, S_CLOSE)
    .replace(/<[^>]+>/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");

  return escapeHtml(textWithMarkers)
    .replace(new RegExp(B_OPEN, "g"), "<strong>")
    .replace(new RegExp(B_CLOSE, "g"), "</strong>")
    .replace(new RegExp(I_OPEN, "g"), "<em>")
    .replace(new RegExp(I_CLOSE, "g"), "</em>")
    .replace(new RegExp(S_OPEN, "g"), "<s>")
    .replace(new RegExp(S_CLOSE, "g"), "</s>")
    .replace(new RegExp(BR, "g"), "<br>")
    .replace(/(<br>\s*){3,}/g, "<br><br>")
    .replace(/(<br>\s*)+$/g, "");
}

function cleanPlainSegment(text: string): string {
  return text
    // Hide stray marker tokens left by copy/paste, e.g. standalone "**".
    .replace(/(^|\s)(\*\*|\*|_|~)(?=\s|$)/g, "$1")
    .replace(/(\*\*|\*|_|~)(?=[,.;:!?)]|$)/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
}

function normalizeRichText(text: string): string {
  return text
    .replace(/\u00A0/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
}

function parseInline(line: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  INLINE_RE.lastIndex = 0;

  while ((match = INLINE_RE.exec(line)) !== null) {
    if (match.index > last) nodes.push(cleanPlainSegment(line.slice(last, match.index)));

    if (match[1] !== undefined) {
      nodes.push(<strong key={key++} className="font-semibold">{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      nodes.push(<strong key={key++} className="font-semibold">{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      nodes.push(<em key={key++}>{match[3]}</em>);
    } else if (match[4] !== undefined) {
      nodes.push(<s key={key++}>{match[4]}</s>);
    }

    last = match.index + match[0].length;
  }

  if (last < line.length) nodes.push(cleanPlainSegment(line.slice(last)));
  return nodes;
}

interface RichTextContentProps {
  text: string;
  className?: string;
}

export default function RichTextContent({ text, className }: RichTextContentProps) {
  if (!text) return null;
  const normalizedText = normalizeRichText(text);

  if (isProbablyHtml(normalizedText)) {
    const safeHtml = htmlToInlineRichHtml(normalizedText);
    return <span className={className} dangerouslySetInnerHTML={{ __html: safeHtml }} />;
  }

  const lines = normalizedText.split("\n");
  return (
    <span className={className}>
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          {parseInline(line)}
          {i < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </span>
  );
}
