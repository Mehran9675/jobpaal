export function escapeHtml(text: string): string {
  return (text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Escaped text with line breaks turned into <br>. */
export function escapeLines(text: string): string {
  return escapeHtml(text).replace(/\n/g, '<br>');
}
