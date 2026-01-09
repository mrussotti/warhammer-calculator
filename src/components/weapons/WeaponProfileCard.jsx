import { Stepper } from '../ui';
import { parseDamage } from '../../utils/damageCalculations';
import { BS_WS_RANGE, DAMAGE_PRESETS } from '../../utils/constants';

/**
 * WeaponProfileCard - Editable card for a single weapon profile
 */
function WeaponProfileCard({ profile, index, color, onUpdate, onRemove, canRemove }) {
  const hitProb = (7 - profile.bs) / 6;
  const damageStats = parseDamage(profile.damage);
  
  return (
    <div 
      className="bg-gray-800 rounded-lg p-4 border-l-4"
      style={{ borderLeftColor: color.bg }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <input
          type="text"
          value={profile.name}
          onChange={(e) => onUpdate({ ...profile, name: e.target.value })}
          className="bg-transparent text-white font-semibold text-lg focus:outline-none focus:border-b focus:border-gray-500 w-full"
          placeholder="Weapon name"
        />
        {canRemove && (
          <button
            onClick={onRemove}
            className="text-gray-500 hover:text-red-400 ml-2 p-1 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Stepper 
          label="Attacks" 
          value={profile.attacks} 
          onChange={(v) => onUpdate({ ...profile, attacks: v })} 
          min={1} 
          small 
        />
        
        {/* BS/WS Selector */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">BS/WS</label>
          <div className="flex">
            {BS_WS_RANGE.map((val, i) => (
              <button
                key={val}
                onClick={() => onUpdate({ ...profile, bs: val })}
                className={`flex-1 py-1 text-xs font-medium transition-colors ${
                  i === 0 ? 'rounded-l' : ''
                } ${i === BS_WS_RANGE.length - 1 ? 'rounded-r' : ''} ${
                  profile.bs === val ? 'text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
                style={profile.bs === val ? { backgroundColor: color.bg } : {}}
              >
                {val}+
              </button>
            ))}
          </div>
        </div>
        
        <Stepper 
          label="Strength" 
          value={profile.strength} 
          onChange={(v) => onUpdate({ ...profile, strength: v })} 
          min={1} 
          small 
        />
        <Stepper 
          label="AP" 
          value={profile.ap} 
          onChange={(v) => onUpdate({ ...profile, ap: v })} 
          min={0} 
          showValue={`-${profile.ap}`} 
          small 
        />
      </div>
      
      {/* Damage Selection */}
      <div className="mt-3">
        <label className="block text-xs text-gray-500 mb-1">Damage</label>
        <div className="flex flex-wrap gap-1">
          {DAMAGE_PRESETS.map(preset => (
            <button
              key={preset}
              onClick={() => onUpdate({ ...profile, damage: preset })}
              className={`px-2 py-0.5 rounded font-mono text-xs transition-colors ${
                profile.damage === preset ? 'text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
              style={profile.damage === preset ? { backgroundColor: color.bg } : {}}
            >
              {preset}
            </button>
          ))}
          <input
            type="text"
            value={profile.damage}
            onChange={(e) => onUpdate({ ...profile, damage: e.target.value })}
            className="px-2 py-0.5 bg-gray-700 rounded text-white text-xs font-mono border border-gray-600 focus:border-orange-500 focus:outline-none w-14"
          />
        </div>
      </div>
      
      {/* Quick Stats Footer */}
      <div className="mt-3 pt-2 border-t border-gray-700 flex gap-4 text-xs text-gray-500">
        <span>Hit: {(hitProb * 100).toFixed(0)}%</span>
        <span>
          D: {damageStats.mean.toFixed(1)}
          {damageStats.variance > 0 && ` ±${Math.sqrt(damageStats.variance).toFixed(1)}`}
        </span>
      </div>
    </div>
  );
}

export default WeaponProfileCard;
