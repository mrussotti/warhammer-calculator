import UnitCard from './UnitCard';

function UnitList({ 
  units, 
  onAddUnit,
  onUpdateUnit, 
  onRemoveUnit,
  onDuplicateUnit,
  onAddProfile,
  onUpdateProfile,
  onRemoveProfile,
}) {
  // Calculate global profile index for consistent coloring
  let globalProfileIndex = 0;
  
  const totalModels = units.reduce((sum, u) => {
    return sum + u.profiles.reduce((pSum, p) => pSum + (p.modelCount || 1), 0);
  }, 0);
  
  const totalWeapons = units.reduce((sum, u) => sum + u.profiles.length, 0);
  
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Army List</h2>
          <p className="text-xs text-zinc-500">
            {units.length} unit{units.length !== 1 ? 's' : ''} • {totalModels} model{totalModels !== 1 ? 's' : ''} • {totalWeapons} weapon{totalWeapons !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={onAddUnit}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 hover:border-orange-500/50 rounded-lg text-sm font-medium text-orange-500 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Unit
        </button>
      </div>
      
      <div className="space-y-4">
        {units.map((unit, unitIndex) => {
          const profileCount = unit.profiles.length;
          const startIndex = globalProfileIndex;
          globalProfileIndex += profileCount;
          
          return (
            <UnitCard
              key={unit.id}
              unit={unit}
              unitIndex={unitIndex}
              globalProfileIndex={startIndex}
              onUpdateUnit={(updates) => onUpdateUnit(unit.id, updates)}
              onRemoveUnit={() => onRemoveUnit(unit.id)}
              onDuplicateUnit={() => onDuplicateUnit(unit.id)}
              onAddProfile={() => onAddProfile(unit.id)}
              onUpdateProfile={(profileId, updates) => onUpdateProfile(unit.id, profileId, updates)}
              onRemoveProfile={(profileId) => onRemoveProfile(unit.id, profileId)}
              canRemove={units.length > 1}
            />
          );
        })}
      </div>
      
      {/* Quick add section */}
      <div className="mt-4 pt-4 border-t border-zinc-800">
        <button
          onClick={onAddUnit}
          className="w-full py-3 border-2 border-dashed border-zinc-700 hover:border-zinc-600 rounded-lg text-zinc-500 hover:text-zinc-400 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Another Unit
        </button>
      </div>
    </div>
  );
}

export default UnitList;