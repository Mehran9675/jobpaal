const PLACEHOLDER = /^(select|choose|please select|please choose|--+|—+|pick one|select an option|select one)\b.*$|^$/i;

const norm = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9+#%$]+/g, ' ')
    .trim();

/** Drops "Select..." style placeholder options. */
export function realOptions(options: string[]): string[] {
  return options.map((o) => o.trim()).filter((o) => !PLACEHOLDER.test(o));
}

function words(s: string): Set<string> {
  return new Set(norm(s).split(' ').filter((w) => w.length > 1 || /\d/.test(w)));
}

/**
 * Maps a free-text answer onto exactly one of the options (fuzzy). Returns '' when none fits.
 */
export function matchOption(answer: string, options: string[]): string {
  const choices = realOptions(options);
  const a = norm(answer);
  if (!a || !choices.length) return '';
  const exact = choices.find((o) => norm(o) === a);
  if (exact) return exact;

  const yes = /^(yes|y|true|i am|i do|i have|i can|i will|correct|affirmative)\b/.test(a);
  const no = /^(no|n|false|i am not|i do not|i don t|i have not|i cannot|i can t|i will not|i won t)\b/.test(a);
  if (yes !== no) {
    const target = yes ? /^(yes|true|i am|i do|i have|i can|i will)\b/ : /^(no|false|i am not|i do not|i don t|i have not|i cannot|i will not)\b/;
    const hit = choices.find((o) => target.test(norm(o)));
    if (hit) return hit;
  }

  const contained = choices
    .filter((o) => norm(o).length >= 2 && new RegExp(`(^| )${norm(o).replace(/[+$]/g, '\\$&')}( |$)`).test(a))
    .sort((x, y) => norm(y).length - norm(x).length);
  if (contained.length) return contained[0];
  if (a.length >= 3) {
    const containing = choices.filter((o) => norm(o).includes(a));
    if (containing.length === 1) return containing[0];
  }

  const aw = words(answer);
  let best = '';
  let bestScore = 0;
  for (const o of choices) {
    const ow = words(o);
    const inter = [...ow].filter((w) => aw.has(w)).length;
    const union = new Set([...ow, ...aw]).size;
    const score = union ? inter / union : 0;
    if (score > bestScore) {
      best = o;
      bestScore = score;
    }
  }
  return bestScore >= 0.5 ? best : '';
}

/** Cuts text to `max` characters at a sentence or word boundary (no ellipsis, for form fields). */
export function fitLength(text: string, max?: number): string {
  const t = text.trim();
  if (!max || max <= 0 || t.length <= max) return t;
  const cut = t.slice(0, max);
  const sentenceEnd = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '), /[.!?]$/.test(cut) ? cut.length - 1 : -1);
  if (sentenceEnd >= max * 0.5) return cut.slice(0, sentenceEnd + 1).trim();
  const space = cut.lastIndexOf(' ');
  return (space > 0 ? cut.slice(0, space) : cut).replace(/[\s,;:–—-]+$/, '').trim();
}
