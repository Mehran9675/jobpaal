/** Short random id, unique enough for local records. */
export function createId(prefix = ''): string {
  const random = crypto.getRandomValues(new Uint32Array(2));
  const id = Date.now().toString(36) + random[0].toString(36) + random[1].toString(36).slice(0, 4);
  return prefix ? `${prefix}_${id}` : id;
}
