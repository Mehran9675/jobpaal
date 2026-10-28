import { useEffect, useRef, useState } from 'react';
import { updateAiSettings } from '@/shared/storage';
import type { ProviderPreset } from '@/shared/types';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { Notice } from '@/ui/components/Notice';
import { Spinner } from '@/ui/components/Spinner';
import { useAiSettings } from '@/ui/hooks/useAiSettings';
import { PageHeader } from '../../components/PageHeader';
import { createProviderFromPreset } from '../../lib/providers';
import { AddProviderPicker } from './AddProviderPicker';
import { ProviderForm } from './ProviderForm';
import { ProviderList } from './ProviderList';
import { UsageReport } from './UsageReport';

export function ProvidersSection({ focus }: { focus?: 'usage' }) {
  const ai = useAiSettings();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const usageRef = useRef<HTMLDivElement>(null);

  const loaded = ai !== undefined;
  useEffect(() => {
    if (focus === 'usage' && loaded) usageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [focus, loaded]);

  if (!ai) {
    return (
      <div className="jp-opt-loading">
        <Spinner label="Loading providers" />
      </div>
    );
  }

  const selected = ai.providers.find((p) => p.id === selectedId) ?? null;

  const add = async (preset: ProviderPreset) => {
    const config = createProviderFromPreset(
      preset,
      ai.providers.map((p) => p.name),
    );
    await updateAiSettings((current) => {
      current.providers.push(config);
      if (!current.activeProviderId) current.activeProviderId = config.id;
      return current;
    });
    setAdding(false);
    setSelectedId(config.id);
  };

  return (
    <div className="jp-opt-section">
      <PageHeader
        title="AI providers"
        description="Connect your own AI provider. JobPaal sends content directly from your browser to the provider you choose — never to JobPaal."
        actions={
          !adding && (
            <Button variant="primary" onClick={() => setAdding(true)}>
              Add provider
            </Button>
          )
        }
      />
      <Notice>
        API keys and settings are stored locally in this browser and are only sent to the provider they belong to. Content you process is handled under that
        provider’s own terms and data policies.
      </Notice>
      {adding && (
        <Card title="Add a provider" actions={<Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>}>
          <AddProviderPicker onPick={(preset) => void add(preset)} />
        </Card>
      )}
      <Card title="Connections">
        <ProviderList ai={ai} selectedId={selectedId} onSelect={(id) => setSelectedId((cur) => (cur === id ? null : id))} onAdd={() => setAdding(true)} />
      </Card>
      {selected && (
        <Card title={`Edit ${selected.name}`} actions={<Button size="sm" variant="ghost" onClick={() => setSelectedId(null)}>Close</Button>}>
          <ProviderForm key={selected.id} provider={selected} isActive={ai.activeProviderId === selected.id} onDeleted={() => setSelectedId(null)} />
        </Card>
      )}
      <div ref={usageRef} id="usage" className="jp-opt-anchor">
        <UsageReport />
      </div>
    </div>
  );
}
