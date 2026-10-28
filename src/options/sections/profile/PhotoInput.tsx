import { useState } from 'react';
import { errorMessage } from '@/shared/utils/errors';
import { FileButton } from '../../components/FileButton';
import { imageFileToDataUrl } from '../../lib/image';

export interface PhotoInputProps {
  value: string;
  onChange: (dataUrl: string) => void;
}

/** Photo upload stored as a (downscaled) data URL. Only shown on resumes when the design enables it. */
export function PhotoInput({ value, onChange }: PhotoInputProps) {
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="jp-opt-photo">
      <div className="jp-opt-photo__frame">{value ? <img src={value} alt="Your profile photo" /> : <span aria-hidden="true">No photo</span>}</div>
      <FileButton
        size="sm"
        accept="image/png,image/jpeg,image/webp"
        onFile={async (file) => {
          setError(null);
          try {
            onChange(await imageFileToDataUrl(file));
          } catch (err) {
            setError(errorMessage(err));
          }
        }}
      >
        {value ? 'Change photo' : 'Upload photo'}
      </FileButton>
      {value && (
        <button type="button" className="jp-btn jp-btn--ghost jp-btn--sm" onClick={() => onChange('')}>
          Remove
        </button>
      )}
      {error && <span className="jp-small" style={{ color: 'var(--jp-danger)' }}>{error}</span>}
      <span className="jp-field__hint">Optional. Used only when “Show photo” is on in Resume designs.</span>
    </div>
  );
}
