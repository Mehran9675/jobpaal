import { useMemo } from 'react';
import { renderResumeHtml } from '@/shared/documents';
import { isProfileUsable } from '@/shared/storage';
import { buildBaseResume } from '@/shared/resume/baseResume';
import type { DesignSettings } from '@/shared/types';
import { errorMessage } from '@/shared/utils/errors';
import { Card } from '@/ui/components/Card';
import { Notice } from '@/ui/components/Notice';
import { useProfile } from '@/ui/hooks/useProfile';
import { SAMPLE_RESUME } from '../../lib/sampleResume';

/** Live, sandboxed HTML preview of the untailored resume with the current design. No AI involved. */
export function DesignPreview({ design }: { design: DesignSettings }) {
  const profile = useProfile();
  const usable = profile ? isProfileUsable(profile) : false;

  const result = useMemo(() => {
    if (!profile) return { html: '', error: null as string | null };
    try {
      const content = usable ? buildBaseResume(profile) : SAMPLE_RESUME;
      return { html: renderResumeHtml(content, design), error: null };
    } catch (error) {
      return { html: '', error: errorMessage(error) };
    }
  }, [profile, usable, design]);

  return (
    <Card title="Live preview" actions={<span className="jp-small jp-faint">{design.pageSize} · HTML preview</span>}>
      <div className="jp-stack">
        {!usable && profile && (
          <Notice>
            Showing sample content. Fill in <a href="#profile">My profile</a> to preview your own resume.
          </Notice>
        )}
        {result.error ? (
          <Notice tone="danger">The preview could not be rendered: {result.error}</Notice>
        ) : (
          <iframe className="jp-opt-preview-frame" title="Resume design preview" sandbox="" srcDoc={result.html} />
        )}
        <p className="jp-small jp-faint">The PDF and DOCX files follow the same design; small differences in spacing are normal.</p>
      </div>
    </Card>
  );
}
