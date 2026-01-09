/**
 * DamageDistribution - Visualizes the expected damage range with standard deviations
 */
function DamageDistribution({ expected, stdDev }) {
  if (expected === 0) return null;
  
  const maxDisplay = expected + 2.5 * stdDev;
  
  return (
    <div className="bg-gray-800 rounded-lg p-5">
      <h3 className="text-lg font-semibold text-gray-300 mb-4">Damage Distribution</h3>
      
      {/* Distribution visualization */}
      <div className="relative h-14 bg-gray-700/50 rounded-lg overflow-hidden">
        {/* 95% confidence interval (±2σ) */}
        <div 
          className="absolute top-0 h-full bg-orange-500/30 transition-all duration-300"
          style={{
            left: `${Math.max(0, (expected - 2 * stdDev) / maxDisplay * 100)}%`,
            width: `${Math.min(100, (4 * stdDev) / maxDisplay * 100)}%`,
          }}
        />
        {/* 68% confidence interval (±1σ) */}
        <div 
          className="absolute top-0 h-full bg-orange-500/50 transition-all duration-300"
          style={{
            left: `${Math.max(0, (expected - stdDev) / maxDisplay * 100)}%`,
            width: `${Math.min(100, (2 * stdDev) / maxDisplay * 100)}%`,
          }}
        />
        {/* Mean line */}
        <div 
          className="absolute top-0 h-full w-0.5 bg-orange-400 transition-all duration-300"
          style={{ left: `${(expected / maxDisplay) * 100}%` }}
        />
        
        {/* Labels */}
        <div className="absolute inset-0 flex items-center justify-between px-4 text-xs text-white/70">
          <span>{Math.max(0, expected - 2 * stdDev).toFixed(1)}</span>
          <span className="font-bold text-orange-400">{expected.toFixed(1)}</span>
          <span>{(expected + 2 * stdDev).toFixed(1)}</span>
        </div>
      </div>
      
      {/* Confidence intervals legend */}
      <div className="flex justify-center gap-6 mt-2 text-xs text-gray-500">
        <span>68%: {Math.max(0, expected - stdDev).toFixed(1)}–{(expected + stdDev).toFixed(1)}</span>
        <span>95%: {Math.max(0, expected - 2*stdDev).toFixed(1)}–{(expected + 2*stdDev).toFixed(1)}</span>
      </div>
    </div>
  );
}

export default DamageDistribution;
