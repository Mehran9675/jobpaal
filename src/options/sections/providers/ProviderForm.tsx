import { useId, useState } from 'react';
import { getPreset } from '@/shared/ai';
import { sendToBackground } from '@/shared/messaging/client';
import { updateAiSettings } from '@/shared/storage';
import type { ProviderConfig } from '@/shared/types';
import { Badge } from '@/ui/components/Badge';
import { Button } from '@/ui/components/Button';
import { Notice } from '@/ui/components/Notice';
import { TextField } from '@/ui/components/TextField';
import { useConfirm } from '@/ui/components/useConfirm';
import { ActionFeedback } from '../../components/ActionFeedback';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { EXTRA_FIELD_LABELS } from '../../lib/providers';

export interface ProviderFormProps {
  provider: ProviderConfig;
  isActive: boolean;
  onDeleted: () => void;
}

const comparable = (p: ProviderConfig) => JSON.stringify({ ...p, lastTest: null });

export function ProviderForm({ provider, isActive, onDeleted }: ProviderFormProps) {
  const [draft, setDraft] = useState<ProviderConfig>(provider);
  const [showKey, setShowKey] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const action = useAsyncAction();
  const { confirm, dialog } = useConfirm();
  const listId = useId();
  const keyId = useId();
  const preset = getPreset(provider.presetId);
  const dirty = comparable(draft) !== comparable(provider);
  // Once the live list is loaded, only offer models the provider actually serves.
  const suggested = models.length ? models : (preset?.suggestedModels ?? []);

  const set = <K extends keyof ProviderConfig>(key: K, value: ProviderConfig[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const persist = () =>
    updateAiSettings((ai) => {
      ai.providers = ai.providers.map((p) => (p.id === draft.id ? { ...draft, lastTest: p.lastTest } : p));
      return ai;
    });

  const save = () => action.run('save', persist, 'Saved.');

  const test = () =>
    action.run('test', async () => {
      if (dirty) await persist();
      let result: { ok: boolean; message: string };
      try {
        result = await sendToBackground('ai:test', { providerId: draft.id });
      } catch (error) {
        result = { ok: false, message: error instanceof Error ? error.message : String(error) };
      }
      await updateAiSettings((ai) => {
        ai.providers = ai.providers.map((p) => (p.id === draft.id ? { ...p, lastTest: { ok: result.ok, at: Date.now(), message: result.message } } : p));
        return ai;
      });
      if (!result.ok) throw new Error(`Connection test failed: ${result.message}`);
    }, 'Connection test passed.');

  const loadModels = () =>
    action.run(
      'models',
      async () => {
        if (dirty) await persist();
        const { models: list } = await sendToBackground('ai:models', { providerId: draft.id });
        setModels(list);
        return list.length;
      },
      (count) => (count ? `Loaded ${count} model${count === 1 ? '' : 's'}.` : 'The provider returned no models. Type the model name instead.'),
    );

  const remove = async () => {
    const ok = await confirm({
      title: `Delete ${provider.name}?`,
      message: 'The connection and its API key are removed from this browser. Usage history is kept.',
      confirmLabel: 'Delete provider',
      danger: true,
    });
    if (!ok) return;
    await updateAiSettings((ai) => {
      ai.providers = ai.providers.filter((p) => p.id !== provider.id);
      if (ai.activeProviderId === provider.id) ai.activeProviderId = ai.providers[0]?.id ?? null;
      return ai;
    });
    onDeleted();
  };

  const setActive = () =>
    void updateAiSettings((ai) => {
      ai.activeProviderId = provider.id;
      return ai;
    });

  return (
    <form
      className="jp-stack jp-stack--lg"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <div className="jp-row jp-row--wrap">
        <span className="jp-small jp-muted">Preset: {preset?.name ?? provider.presetId}</span>
        {preset?.docsUrl && (
          <a className="jp-small" href={preset.docsUrl} target="_blank" rel="noreferrer noopener">
            Provider documentation ↗
          </a>
        )}
        {isActive ? (
          <Badge tone="success">Active</Badge>
        ) : (
          <Button size="sm" onClick={setActive}>
            Set as active
          </Button>
        )}
      </div>
      {preset?.notes && <Notice>{preset.notes}</Notice>}
      <div className="jp-grid-2">
        <TextField label="Name" value={draft.name} onChange={(v) => set('name', v)} />
        <TextField label="Base URL" type="url" value={draft.baseUrl} onChange={(v) => set('baseUrl', v)} spellCheck={false} />
      </div>
      <div className="jp-field">
        <label className="jp-field__label" htmlFor={keyId}>
          API key{preset && !preset.requiresKey ? ' (optional)' : ''}
        </label>
        <div className="jp-opt-inline-row">
          <input
            id={keyId}
            className="jp-input"
            type={showKey ? 'text' : 'password'}
            value={draft.apiKey}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => set('apiKey', e.target.value)}
            placeholder={preset && !preset.requiresKey ? 'Not required for this provider' : 'Paste your API key'}
          />
          <Button size="sm" onClick={() => setShowKey((v) => !v)} aria-pressed={showKey}>
            {showKey ? 'Hide' : 'Show'}
          </Button>
        </div>
        <span className="jp-field__hint">Stored locally in this browser only. It is never included in exports unless you choose to.</span>
      </div>
      <div className="jp-field">
        <TextField
          label="Model"
          value={draft.model}
          onChange={(v) => set('model', v)}
          list={listId}
          spellCheck={false}
          hint={
            preset?.defaultModel
              ? `Default: ${preset.defaultModel}. If the provider has retired it, load the available models.`
              : 'No default: load the available models and pick one.'
          }
        />
        <datalist id={listId}>
          {suggested.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        <div className="jp-row jp-row--wrap" style={{ marginTop: 6 }}>
          <Button size="sm" onClick={() => void loadModels()} loading={action.busy === 'models'}>
            Load available models
          </Button>
          {models.length > 0 && <span className="jp-small jp-faint">{models.length} models available — pick one from the suggestions.</span>}
        </div>
      </div>
      {preset && preset.extraFields.length > 0 && (
        <div className="jp-grid-2">
          {preset.extraFields.map((field) => (
            <TextField
              key={field}
              label={EXTRA_FIELD_LABELS[field].label}
              hint={EXTRA_FIELD_LABELS[field].hint}
              value={draft.extra[field] ?? ''}
              onChange={(v) => setDraft((d) => ({ ...d, extra: { ...d.extra, [field]: v } }))}
              required
            />
          ))}
        </div>
      )}
      <div className="jp-grid-2">
        <TextField
          label="Temperature"
          type="number"
          min={0}
          max={2}
          step={0.1}
          value={String(draft.temperature)}
          onChange={(v) => set('temperature', Math.max(0, Math.min(2, Number(v) || 0)))}
          hint="Lower is more consistent. 0.2–0.5 works well for documents."
        />
        <TextField
          label="Max tokens per response"
          type="number"
          min={256}
          max={200000}
          step={256}
          value={String(draft.maxTokens)}
          onChange={(v) => set('maxTokens', Math.max(256, Math.round(Number(v) || 4096)))}
        />
      </div>
      {provider.lastTest && (
        <Notice tone={provider.lastTest.ok ? 'success' : 'danger'}>
          Last test {provider.lastTest.ok ? 'passed' : 'failed'}: {provider.lastTest.message}
        </Notice>
      )}
      <ActionFeedback error={action.error} message={action.message} />
      <div className="jp-row jp-row--wrap jp-row--between">
        <div className="jp-row jp-row--wrap">
          <Button type="submit" variant="primary" disabled={!dirty} loading={action.busy === 'save'}>
            Save
          </Button>
          <Button onClick={() => void test()} loading={action.busy === 'test'}>
            Test connection
          </Button>
          {dirty && <span className="jp-small jp-faint">Unsaved changes (testing saves first)</span>}
        </div>
        <Button variant="danger" onClick={() => void remove()}>
          Delete
        </Button>
      </div>
      {dialog}
    </form>
  );
}
