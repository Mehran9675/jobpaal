export function Spinner({ label = 'Working' }: { label?: string }) {
  return <span className="jp-spinner" role="status" aria-label={label} />;
}
