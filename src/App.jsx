import { useArmy } from './hooks';
import { ArmySidebar, ToolsArea } from './components/layout';
import { DamageAnalysisTab, TargetUnitTab } from './components/tabs';

/**
 * Warhammer 40K Damage Calculator
 * 
 * New architecture: Army-centric sidebar with analysis tools
 * 
 * Layout:
 * ┌──────────────────┬────────────────────────────────────────────┐
 * │ YOUR ARMY    [<] │  [Damage] [Heatmap] [Dashboard]            │
 * │                  ├────────────────────────────────────────────┤
 * │ "army name"      │                                            │
 * │ 2000 pts         │  Active tool content                       │
 * │                  │                                            │
 * │ ☑ Unit 1         │  (Damage calc, heatmap, etc.)              │
 * │ ☑ Unit 2         │                                            │
 * │ ☐ Unit 3         │                                            │
 * │                  │                                            │
 * │ [Import]         │                                            │
 * │ [Compose]        │                                            │
 * └──────────────────┴────────────────────────────────────────────┘
 */
function Warhammer40KDamageCalculator() {
  // Unified army state
  const army = useArmy();

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-1/2 -left-1/4 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.06),transparent_70%)]" />
        <div className="absolute -bottom-1/2 -right-1/4 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.04),transparent_70%)]" />
      </div>
      
      {/* Sidebar */}
      <ArmySidebar
        importedArmy={army.importedArmy}
        wahapediaUnits={army.wahapediaUnits}
        isLoadingData={army.isLoadingData}
        sidebarCollapsed={army.sidebarCollapsed}
        units={army.units}
        leaders={army.leaders}
        squads={army.squads}
        transports={army.transports}
        selectedUnitIds={army.selectedUnitIds}
        attachments={army.attachments}
        embarked={army.embarked}
        armyStats={army.armyStats}
        matchStats={army.matchStats}
        importArmy={army.importArmy}
        clearArmy={army.clearArmy}
        toggleUnit={army.toggleUnit}
        selectAll={army.selectAll}
        deselectAll={army.deselectAll}
        attachLeader={army.attachLeader}
        embarkUnit={army.embarkUnit}
        toggleSidebar={army.toggleSidebar}
        getDisplayName={army.getDisplayName}
      />
      
      {/* Main Content */}
      <ToolsArea
        DamageCalculator={TargetUnitTab}
        DamageAnalysis={DamageAnalysisTab}
        ArmyDashboard={ArmyDashboard}
        importedArmy={army.importedArmy}
        selectedProfiles={army.selectedProfiles}
        unitsForCalculator={army.unitsForCalculator}
        selectedUnitIds={army.selectedUnitIds}
        armyStats={army.armyStats}
        updateProfileOverride={army.updateProfileOverride}
        resetProfileOverrides={army.resetProfileOverrides}
      />
    </div>
  );
}

/**
 * Placeholder Army Dashboard
 * TODO: Implement proper dashboard with points breakdown, unit roles, etc.
 */
function ArmyDashboard({ army, armyStats }) {
  if (!army || !armyStats) {
    return (
      <div className="text-center py-16 text-zinc-500">
        No army loaded
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-1">{armyStats.armyName}</h2>
        <p className="text-zinc-500">{armyStats.faction}</p>
        
        <div className="grid grid-cols-3 gap-6 mt-6">
          <div>
            <div className="text-3xl font-bold text-blue-400 font-mono">{armyStats.totalPoints}</div>
            <div className="text-xs text-zinc-500 mt-1">Total Points</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-400 font-mono">{armyStats.totalUnits}</div>
            <div className="text-xs text-zinc-500 mt-1">Units</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-400 font-mono">{armyStats.totalModels}</div>
            <div className="text-xs text-zinc-500 mt-1">Models</div>
          </div>
        </div>
      </div>
      
      {/* Units by Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h3 className="text-lg font-semibold text-white">Unit Breakdown</h3>
        </div>
        
        <div className="divide-y divide-zinc-800">
          {/* Characters */}
          {army.units.filter(u => u.section === 'characters').length > 0 && (
            <SectionRow 
              label="Characters" 
              units={army.units.filter(u => u.section === 'characters')}
              color="purple"
            />
          )}
          
          {/* Battleline */}
          {army.units.filter(u => u.section === 'battleline').length > 0 && (
            <SectionRow 
              label="Battleline" 
              units={army.units.filter(u => u.section === 'battleline')}
              color="green"
            />
          )}
          
          {/* Other */}
          {army.units.filter(u => u.section === 'other').length > 0 && (
            <SectionRow 
              label="Other Datasheets" 
              units={army.units.filter(u => u.section === 'other')}
              color="blue"
            />
          )}
          
          {/* Transports */}
          {army.units.filter(u => u.section === 'transports').length > 0 && (
            <SectionRow 
              label="Transports" 
              units={army.units.filter(u => u.section === 'transports')}
              color="orange"
            />
          )}
        </div>
      </div>
      
      {/* Coming Features */}
      <div className="bg-zinc-900/50 border border-dashed border-zinc-800 rounded-xl p-6 text-center">
        <h4 className="text-sm font-medium text-zinc-400 mb-2">Coming Soon</h4>
        <p className="text-xs text-zinc-500">
          Defensive profile analysis, efficiency metrics, threat coverage analysis
        </p>
      </div>
    </div>
  );
}

function SectionRow({ label, units, color }) {
  const totalPoints = units.reduce((sum, u) => sum + (u.points || 0), 0);
  const colors = {
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
  };
  
  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${colors[color]}`} />
          <span className="text-sm font-medium text-white">{label}</span>
          <span className="text-xs text-zinc-500">({units.length})</span>
        </div>
        <span className="text-sm text-zinc-400 font-mono">{totalPoints} pts</span>
      </div>
      <div className="ml-4 space-y-1">
        {units.map((unit, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">{unit.name}</span>
            <span className="text-zinc-500 font-mono">{unit.points}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Warhammer40KDamageCalculator;