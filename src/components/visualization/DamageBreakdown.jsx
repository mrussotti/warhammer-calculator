import { PROFILE_COLORS } from '../../utils/constants';

function DamageBreakdown({ breakdown, totalExpected }) {
  if (breakdown.length <= 1) return null;
  
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
      <h3 className="text-base font-semibold text-white mb-4">Damage Breakdown</h3>
      <div className="space-y-3">
        {breakdown.map((b, i) => {
          const color = PROFILE_COLORS[i % PROFILE_COLORS.length];
          const percentage = totalExpected > 0 ? (b.result.expected / totalExpected * 100) : 0;
          return (
            <div key={b.profile.id}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: color.bg }} />
                  <span className="text-zinc-400">{b.profile.name}</span>
                </div>
                <div className="text-zinc-500 text-xs font-mono">
                  <span className="text-zinc-400">{b.result.expected.toFixed(1)}</span> dmg · <span className="text-zinc-400">{b.result.expectedKills?.toFixed(1) || '—'}</span> kills
                </div>
              </div>
              <div className="h-2 bg-zinc-950 rounded-full overflow-hidden">
                <div className="h-full transition-all duration-300 rounded-full" style={{ width: `${percentage}%`, backgroundColor: color.bg }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DamageBreakdown;
