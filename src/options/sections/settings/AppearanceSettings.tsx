import { updateSettings } from '@/shared/storage';
import type { Settings } from '@/shared/types';
import { Card } from '@/ui/components/Card';

const THEMES: { id: Settings['theme']; label: string }[] = [
  { id: 'system', label: 'Match system' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

export function AppearanceSettings({ theme }: { theme: Settings['theme'] }) {
  const setTheme = (next: Settings['theme']) =>
    void updateSettings((s) => {
      s.theme = next;
      return s;
    });
  return (
    <Card title="Appearance">
      <fieldset className="jp-opt-segmented">
        <legend className="jp-field__label">Theme</legend>
        {THEMES.map((t) => (
          <label key={t.id} className={`jp-opt-segmented__option${theme === t.id ? ' is-selected' : ''}`}>
            <input type="radio" name="jp-theme" value={t.id} checked={theme === t.id} onChange={() => setTheme(t.id)} />
            {t.label}
          </label>
        ))}
      </fieldset>
      <p className="jp-small jp-faint" style={{ marginTop: 8 }}>
        Applies to the management page, popup, side panel and overlay.
      </p>
    </Card>
  );
}
