import { Notice } from '@/ui/components/Notice';

export interface ActionFeedbackProps {
  error: string | null;
  message: string | null;
}

/** Shows the result of the last action (error or success). */
export function ActionFeedback({ error, message }: ActionFeedbackProps) {
  if (error) return <Notice tone="danger">{error}</Notice>;
  if (message) return <Notice tone="success">{message}</Notice>;
  return null;
}
