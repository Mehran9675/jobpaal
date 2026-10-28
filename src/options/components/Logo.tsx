export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="jp-opt-logo">
      <rect x="1" y="1" width="30" height="30" rx="8" fill="var(--jp-primary)" />
      <path d="M12 9h8v10.5a5 5 0 0 1-5 5h-1.5" fill="none" stroke="var(--jp-on-primary)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="20" cy="9" r="1.6" fill="var(--jp-on-primary)" />
    </svg>
  );
}
