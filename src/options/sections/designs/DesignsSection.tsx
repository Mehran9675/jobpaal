import { updateSettings } from '@/shared/storage';
import type { DesignSettings, FileNamingSettings, Settings } from '@/shared/types';
import { Card } from '@/ui/components/Card';
import { SelectField } from '@/ui/components/SelectField';
import { Toggle } from '@/ui/components/Toggle';
import { PageHeader } from '../../components/PageHeader';
import { AccentPicker } from './AccentPicker';
import { CustomFontEditor } from './CustomFontEditor';
import { DesignPreview } from './DesignPreview';
import { FileNamingEditor } from './FileNamingEditor';
import { OutputFormatsEditor } from './OutputFormatsEditor';
import { SectionOrderEditor } from './SectionOrderEditor';
import { TemplatePicker } from './TemplatePicker';
import { UploadedFiles } from './UploadedFiles';

/** Design settings are saved immediately; the preview updates live and works without AI. */
export function DesignsSection({ settings }: { settings: Settings }) {
  const design = settings.design;
  const setDesign = (patch: Partial<DesignSettings>) =>
    void updateSettings((s) => {
      s.design = { ...s.design, ...patch };
      return s;
    });
  const setNaming = (fileNaming: FileNamingSettings) =>
    void updateSettings((s) => {
      s.fileNaming = fileNaming;
      return s;
    });

  return (
    <div className="jp-opt-section jp-opt-section--wide">
      <PageHeader title="Resume designs" description="How your documents look. Changes are saved automatically and apply to the next files JobPaal renders." />
      <div className="jp-opt-designs">
        <div className="jp-opt-designs__controls">
          <Card title="Template">
            <TemplatePicker value={design.template} onChange={(template) => setDesign({ template })} />
          </Card>
          <Card title="Colour and layout">
            <div className="jp-stack jp-stack--lg">
              <AccentPicker value={design.accent} onChange={(accent) => setDesign({ accent })} />
              <div className="jp-grid-2">
                <SelectField
                  label="Density"
                  value={design.density}
                  options={[
                    { value: 'comfortable', label: 'Comfortable' },
                    { value: 'normal', label: 'Normal' },
                    { value: 'compact', label: 'Compact' },
                  ]}
                  onChange={(density) => setDesign({ density })}
                />
                <SelectField
                  label="Page size"
                  value={design.pageSize}
                  options={[
                    { value: 'A4', label: 'A4' },
                    { value: 'Letter', label: 'US Letter' },
                  ]}
                  onChange={(pageSize) => setDesign({ pageSize })}
                />
              </div>
              <Toggle checked={design.showPhoto} onChange={(showPhoto) => setDesign({ showPhoto })} label="Show photo (from My profile)" />
            </div>
          </Card>
          <Card title="Sections">
            <SectionOrderEditor
              order={design.sectionOrder}
              hidden={design.hiddenSections}
              onChange={(sectionOrder, hiddenSections) => setDesign({ sectionOrder, hiddenSections })}
            />
          </Card>
          <Card title="Custom PDF font">
            <CustomFontEditor value={design.customFont} onChange={(customFont) => setDesign({ customFont })} />
          </Card>
          <Card title="Output formats">
            <OutputFormatsEditor value={design.outputFormats} onChange={(outputFormats) => setDesign({ outputFormats })} />
          </Card>
          <Card title="File names">
            <FileNamingEditor value={settings.fileNaming} onChange={setNaming} primaryFormat={design.outputFormats[0] ?? 'pdf'} />
          </Card>
        </div>
        <div className="jp-opt-designs__preview">
          <DesignPreview design={design} />
        </div>
      </div>
      <UploadedFiles />
    </div>
  );
}
