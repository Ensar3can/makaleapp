import { scoreStroke } from './score-badge';

export function ScoreGauge({
  value,
  label,
  size = 'md',
  caption,
}: {
  value: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  caption?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const frame = size === 'sm' ? 'h-12 w-12' : size === 'lg' ? 'h-24 w-24' : 'h-20 w-20';
  const numeral = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-2xl' : 'text-lg';
  const stroke = scoreStroke(clamped);

  const name = `${label ?? 'Score'} ${clamped} of 100`;

  return (
    <div className={label || caption ? 'flex items-center gap-3' : undefined} role="img" aria-label={name}>
      <svg viewBox="0 0 88 88" className={frame} aria-hidden="true">
        <circle cx="44" cy="44" r={radius} fill="none" stroke="#e4e2e4" strokeWidth="8" />
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 44 44)"
        />
        <text
          x="44"
          y="49"
          textAnchor="middle"
          className={`fill-ink font-sans font-semibold ${numeral}`}
        >
          {clamped.toFixed(0)}
        </text>
      </svg>
      {label || caption ? (
        <div>
          {label ? (
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
          ) : null}
          {caption ? <p className="text-sm text-muted">{caption}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
