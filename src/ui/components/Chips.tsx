export interface ChipsProps {
  items: string[];
  tone?: 'neutral' | 'matched' | 'missing';
  limit?: number;
}

export function Chips({ items, tone = 'neutral', limit }: ChipsProps) {
  const shown = limit ? items.slice(0, limit) : items;
  const rest = limit ? items.length - shown.length : 0;
  return (
    <div className="jp-chips">
      {shown.map((item) => (
        <span key={item} className={['jp-chip', tone !== 'neutral' && `jp-chip--${tone}`].filter(Boolean).join(' ')}>
          {item}
        </span>
      ))}
      {rest > 0 && <span className="jp-chip">+{rest}</span>}
    </div>
  );
}
