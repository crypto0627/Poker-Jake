const RED_SUITS = new Set(['♥', '♦']);

/** Backend sends labels like "K♥️" — rank followed by an emoji suit. */
function parseLabel(label: string): { rank: string; suit: string } {
  const clean = label.replace(/️/g, ''); // strip emoji variation selector
  return { rank: clean.slice(0, -1), suit: clean.slice(-1) };
}

export default function PlayingCard({ label, hidden }: { label?: string; hidden?: boolean }) {
  if (hidden || !label) {
    return <div className="card-back h-18 w-12 shrink-0 rounded-lg border border-ivory/25 shadow-md shadow-black/40" />;
  }

  const { rank, suit } = parseLabel(label);
  const color = RED_SUITS.has(suit) ? 'text-crimson' : 'text-ink';

  return (
    <div className="flex h-18 w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg bg-ivory shadow-md shadow-black/40">
      <span className={`font-display text-xl leading-none font-bold ${color}`}>{rank}</span>
      <span className={`text-base leading-none ${color}`}>{suit}</span>
    </div>
  );
}
