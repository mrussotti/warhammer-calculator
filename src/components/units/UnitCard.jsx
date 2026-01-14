import { useState } from 'react';
import { WeaponProfileCard } from '../weapons';
import { PROFILE_COLORS } from '../../utils/constants';

function UnitCard({ 
  unit, 
  unitIndex,
  onUpdateUnit, 
  onRemoveUnit, 
  onDuplicateUnit,
  onAddProfile,
  onUpdateProfile,
  onRemoveProfile,
  canRemove,
  globalProfileIndex = 0,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const totalModels = unit.profiles.reduce((sum, p) => sum + (p.modelCount || 1), 0);
  const totalAttacks = unit.profiles.reduce((sum, p) => {
    const atk = typeof p.attacks === 'number' ? p.attacks : parseFloat(p.attacks) || 1;
    return sum + atk * (p.modelCount || 1);
  }, 0);
  
  // Get unit color based on index
  const unitColor = PROFILE_COLORS[unitIndex % PROFILE_COLORS.length];
  
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Unit Header */}
      <div 
        className="px-4 py-3 border-b border-zinc-800 cursor-pointer hover:bg-zinc-800/30 transition-colors"
        style={{ borderLeft: `4px solid ${unitColor.bg}` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Collapse button */}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <svg 
                className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            {/* Unit name */}
            {isEditing ? (
              <input
                type="text"
                value={unit.name}
                onChange={(e) => onUpdateUnit({ name: e.target.value })}
                onBlur={() => setIsEditing(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditing(false);
                  if (e.key === 'Escape') setIsEditing(false);
                }}
                className="bg-zinc-800 text-white font-semibold text-base px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 flex-1 min-w-0"
                autoFocus
              />
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="text-white font-semibold text-base hover:text-orange-400 transition-colors truncate text-left"
              >
                {unit.name}
              </button>
            )}
            
            {/* Unit stats badge */}
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">
                {totalModels} model{totalModels !== 1 ? 's' : ''}
              </span>
              <span className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">
                {unit.profiles.length} weapon{unit.profiles.length !== 1 ? 's' : ''}
              </span>
              <span className="px-2 py-0.5 bg-orange-500/20 rounded text-orange-400 font-mono">
                ~{typeof totalAttacks === 'number' ? totalAttacks.toFixed(0) : totalAttacks} atk
              </span>
            </div>
          </div>
          
          {/* Unit actions */}
          <div className="flex items-center gap-1 ml-3">
            <button
              onClick={() => onAddProfile()}
              className="p-1.5 text-zinc-500 hover:text-green-400 hover:bg-green-500/10 rounded transition-colors"
              title="Add weapon"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={() => onDuplicateUnit()}
              className="p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
              title="Duplicate unit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            {canRemove && (
              <button
                onClick={() => onRemoveUnit()}
                className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                title="Remove unit"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Weapon Profiles */}
      {!isCollapsed && (
        <div className="p-4">
          {unit.profiles.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <p className="text-sm">No weapons configured</p>
              <button
                onClick={() => onAddProfile()}
                className="mt-2 text-orange-500 hover:text-orange-400 text-sm font-medium"
              >
                + Add a weapon
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {unit.profiles.map((profile, profileIndex) => (
                <WeaponProfileCard
                  key={profile.id}
                  profile={profile}
                  index={globalProfileIndex + profileIndex}
                  color={PROFILE_COLORS[(globalProfileIndex + profileIndex) % PROFILE_COLORS.length]}
                  onUpdate={(updated) => onUpdateProfile(profile.id, updated)}
                  onRemove={() => onRemoveProfile(profile.id)}
                  canRemove={unit.profiles.length > 1}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UnitCard;