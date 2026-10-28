import type { TemplateId } from '@/shared/types';

export interface TemplateInfo {
  id: TemplateId;
  name: string;
  description: string;
}

export const TEMPLATES: TemplateInfo[] = [
  { id: 'classic', name: 'Classic', description: 'Serif type, centered header and thin rules under each section.' },
  { id: 'modern', name: 'Modern', description: 'Clean sans-serif with an accent-coloured name and underlined headings.' },
  { id: 'minimal', name: 'Minimal', description: 'Generous whitespace, quiet gray headings and no rules.' },
  { id: 'executive', name: 'Executive', description: 'Serif type under a bold accent-colour header band.' },
  { id: 'compact', name: 'Compact', description: 'Small type, tight spacing and two-column skills to fit more on a page.' },
  { id: 'technical', name: 'Technical', description: 'Left-aligned engineering layout with monospace skill chips.' },
];

export const ACCENT_PRESETS: string[] = [
  '#2563eb',
  '#0f766e',
  '#7c3aed',
  '#be123c',
  '#c2410c',
  '#15803d',
  '#334155',
  '#111827',
];
