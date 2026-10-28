/** Raw text of a .docx via mammoth's browser build (lazy-loaded). */
export async function extractDocxText(data: ArrayBuffer): Promise<string> {
  const mod = await import('mammoth/mammoth.browser.js');
  const mammoth = (mod.default ?? mod) as typeof mod.default;
  const result = await mammoth.extractRawText({ arrayBuffer: data });
  const text = result.value.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!text) throw new Error('This Word document contains no text.');
  return text;
}
