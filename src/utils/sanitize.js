/**
 * Sanitize text for safe rendering in the DOM.
 * Escapes HTML entities to prevent XSS from AI-generated or user content.
 */
const HTML_ENTITY_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
};

export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>"']/g, (char) => HTML_ENTITY_MAP[char]);
}

/**
 * Convert plain text with markdown-style bold (**text**) and newlines
 * into safe HTML. All other content is escaped first.
 */
export function safeMarkdown(text) {
  if (typeof text !== 'string') return '';
  let safe = escapeHtml(text);
  // Convert **bold** markers
  safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Convert newlines to <br>
  safe = safe.replace(/\n/g, '<br>');
  return safe;
}
