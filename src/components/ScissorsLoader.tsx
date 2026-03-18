import { Scissors } from 'lucide-react';

type Props = {
  size?: 'sm' | 'md';
};

export function ScissorsLoader({ size = 'md' }: Props) {
  const h = size === 'sm' ? 'h-9' : 'h-12';
  const w = size === 'sm' ? 'w-20' : 'w-28';
  const icon = size === 'sm' ? 22 : 26;

  return (
    <div className={`relative ${h} ${w}`} aria-label="Carregando" role="status">
      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="relative h-8 w-1 rounded-full bg-foreground/25 overflow-hidden"
          >
            <div className="absolute left-0 top-0 h-3 w-full bg-foreground/35 hair-fall" style={{ animationDelay: `${i * 0.1}s` }} />
          </div>
        ))}
      </div>

      <div className="absolute left-2 top-1/2 -translate-y-1/2 scissors-snips">
        <Scissors className="text-primary" size={icon} />
      </div>
    </div>
  );
}

