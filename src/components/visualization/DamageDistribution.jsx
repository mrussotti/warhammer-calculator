function DamageDistribution({ expected, stdDev }) {
  if (expected === 0) return null;
  const maxDisplay = expected + 2.5 * stdDev;
  
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
      <h3 className="text-base font-semibold text-white mb-4">Damage Distribution</h3>
      <div className="relative h-12 bg-zinc-950 rounded-lg overflow-hidden">
        <div className="absolute top-0 h-full bg-orange-500/20 transition-all" style={{ left: `${Math.max(0, (expected - 2 * stdDev) / maxDisplay * 100)}%`, width: `${Math.min(100, (4 * stdDev) / maxDisplay * 100)}%` }} />
        <div className="absolute top-0 h-full bg-orange-500/40 transition-all" style={{ left: `${Math.max(0, (expected - stdDev) / maxDisplay * 100)}%`, width: `${Math.min(100, (2 * stdDev) / maxDisplay * 100)}%` }} />
        <div className="absolute top-0 h-full w-0.5 bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)] transition-all" style={{ left: `${(expected / maxDisplay) * 100}%` }} />
        <div className="absolute inset-0 flex items-center justify-between px-4 text-xs font-mono">
          <span className="text-zinc-400">{Math.max(0, expected - 2 * stdDev).toFixed(1)}</span>
          <span className="font-bold text-orange-500">{expected.toFixed(1)}</span>
          <span className="text-zinc-400">{(expected + 2 * stdDev).toFixed(1)}</span>
        </div>
      </div>
      <div className="flex justify-center gap-6 mt-3 text-[10px] text-zinc-500">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-orange-500/40" /><span>68%: {Math.max(0, expected - stdDev).toFixed(1)}–{(expected + stdDev).toFixed(1)}</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-orange-500/20" /><span>95%: {Math.max(0, expected - 2*stdDev).toFixed(1)}–{(expected + 2*stdDev).toFixed(1)}</span></div>
      </div>
    </div>
  );
}

export default DamageDistribution;
