import { Spinner } from '@/ui/components/Spinner';

export function BusyBar({ text }: { text: string }) {
  return (
    <div className="jp-ov-busy" role="status">
      <Spinner />
      <span>{text}</span>
    </div>
  );
}
