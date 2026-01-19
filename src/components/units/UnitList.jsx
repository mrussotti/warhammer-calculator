import UnitCard from './UnitCard';
import AddUnitPanel from './AddUnitPanel';

function UnitList({ 
  units, 
  onAddUnitWithData, // New: add unit with pre-loaded weapons
  onUpdateUnit, 
  onRemoveUnit,
  onDuplicateUnit,
  onAddProfile,
  onSetProfiles,
  onUpdateProfile,
  onRemoveProfile,
}) {
  // Calculate global profile index for consistent coloring
  let globalProfileIndex = 0;
  
  // Only count active units and profiles
  const activeUnits = units.filter(u => u.active !== false);
  const totalModels = activeUnits.reduce((sum, u) => {
    return sum + u.profiles.filter(p => p.active !== false).reduce((pSum, p) => pSum + (p.modelCount || 1), 0);
  }, 0);
  
  const totalWeapons = units.reduce((sum, u) => sum + u.profiles.length, 0);
  const activeWeapons = activeUnits.reduce((sum, u) => sum + u.profiles.filter(p => p.active !== false).length, 0);
  
  const unitsSummary = activeUnits.length === units.length 
    ? `${units.length} unit${units.length !== 1 ? 's' : ''}`
    : `${activeUnits.length}/${units.length} units`;
  
  const weaponsSummary = activeWeapons === totalWeapons
    ? `${totalWeapons} weapon${totalWeapons !== 1 ? 's' : ''}`
    : `${activeWeapons}/${totalWeapons} weapons`;
  
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Army List</h2>
          <p className="text-xs text-zinc-500">
            {units.length === 0 
              ? 'Add units to get started'
              : `${unitsSummary} • ${totalModels} model${totalModels !== 1 ? 's' : ''} • ${weaponsSummary}`
            }
          </p>
        </div>
      </div>
      
      {/* Unit Cards */}
      {units.length > 0 && (
        <div className="space-y-4 mb-4">
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
                onAddProfile={(initialData) => onAddProfile(unit.id, initialData)}
                onSetProfiles={onSetProfiles ? (profiles) => onSetProfiles(unit.id, profiles) : null}
                onUpdateProfile={(profileId, updates) => onUpdateProfile(unit.id, profileId, updates)}
                onRemoveProfile={(profileId) => onRemoveProfile(unit.id, profileId)}
                canRemove={true}
              />
            );
          })}
        </div>
      )}
      
      {/* Add Unit Panel - search-first approach */}
      <AddUnitPanel onUnitAdd={onAddUnitWithData} />
    </div>
  );
}

export default UnitList;