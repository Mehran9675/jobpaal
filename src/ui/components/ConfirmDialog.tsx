import { useState, type ReactNode } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';

export interface ConfirmDialogProps {
  title: ReactNode;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button as destructive. */
  danger?: boolean;
  /** When set, the user must type this exact text before confirming. */
  requireText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger,
  requireText,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState('');
  const blocked = Boolean(requireText) && typed.trim() !== requireText;
  return (
    <Modal
      title={title}
      onClose={onCancel}
      size="sm"
      role="alertdialog"
      footer={
        <>
          <Button onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={blocked} data-autofocus={requireText ? undefined : true}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="jp-stack">
        <div>{message}</div>
        {requireText && (
          <label className="jp-field">
            <span className="jp-field__label">
              Type <strong>{requireText}</strong> to confirm
            </span>
            <input className="jp-input" value={typed} onChange={(e) => setTyped(e.target.value)} data-autofocus autoComplete="off" />
          </label>
        )}
      </div>
    </Modal>
  );
}
