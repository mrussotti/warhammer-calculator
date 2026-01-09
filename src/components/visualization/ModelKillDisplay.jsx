/**
 * ModelKillDisplay - Visual representation of killed/wounded models
 */
function ModelKillDisplay({ kills, total, woundsPerModel }) {
  const deadModels = Math.floor(kills);
  const partialDamage = (kills - deadModels) * woundsPerModel;
  const aliveModels = Math.max(0, total - deadModels - (partialDamage > 0 ? 1 : 0));
  
  // Limit display to 20 models max for readability
  const displayTotal = Math.min(total, 20);
  const scale = total > 20 ? displayTotal / total : 1;
  
  const displayDead = Math.floor(deadModels * scale);
  const displayPartial = partialDamage > 0 && (displayDead < displayTotal);
  const displayAlive = displayTotal - displayDead - (displayPartial ? 1 : 0);
  
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {/* Dead models */}
        {Array.from({ length: displayDead }).map((_, i) => (
          <div key={`dead-${i}`} className="w-7 h-7 rounded bg-red-500/80 flex items-center justify-center">
            <svg className="w-4 h-4 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        ))}
        
        {/* Partially damaged model */}
        {displayPartial && (
          <div className="w-7 h-7 rounded bg-yellow-500/80 flex items-center justify-center text-xs font-bold text-yellow-900">
            {Math.round(partialDamage)}
          </div>
        )}
        
        {/* Alive models */}
        {Array.from({ length: Math.max(0, displayAlive) }).map((_, i) => (
          <div key={`alive-${i}`} className="w-7 h-7 rounded bg-gray-600 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-green-400" />
          </div>
        ))}
      </div>
      
      {total > 20 && (
        <div className="text-xs text-gray-500 mt-1">
          Showing scaled representation ({total} models)
        </div>
      )}
    </div>
  );
}

export default ModelKillDisplay;
