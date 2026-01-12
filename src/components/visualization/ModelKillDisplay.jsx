function ModelKillDisplay({ kills, total, woundsPerModel }) {
  const deadModels = Math.floor(kills);
  const partialDamage = (kills - deadModels) * woundsPerModel;
  const aliveModels = Math.max(0, total - deadModels - (partialDamage > 0 ? 1 : 0));
  
  const displayTotal = Math.min(total, 20);
  const scale = total > 20 ? displayTotal / total : 1;
  const displayDead = Math.floor(deadModels * scale);
  const displayPartial = partialDamage > 0 && (displayDead < displayTotal);
  const displayAlive = displayTotal - displayDead - (displayPartial ? 1 : 0);
  
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {/* Dead models - red X */}
        {Array.from({ length: displayDead }).map((_, i) => (
          <div key={`dead-${i}`} className="w-8 h-8 rounded-lg bg-red-500/30 border-2 border-red-500/50 flex items-center justify-center">
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </div>
        ))}
        {/* Partially damaged model - yellow with wound count */}
        {displayPartial && (
          <div className="w-8 h-8 rounded-lg bg-yellow-500/30 border-2 border-yellow-500/60 flex items-center justify-center">
            <span className="text-xs font-bold text-yellow-300 font-mono">{Math.round(partialDamage)}</span>
          </div>
        )}
        {/* Alive models - green dot */}
        {Array.from({ length: Math.max(0, displayAlive) }).map((_, i) => (
          <div key={`alive-${i}`} className="w-8 h-8 rounded-lg bg-zinc-800/50 border border-zinc-700 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          </div>
        ))}
      </div>
      {total > 20 && <div className="text-[10px] text-zinc-500 mt-2">Showing scaled representation ({total} models total)</div>}
    </div>
  );
}

export default ModelKillDisplay;