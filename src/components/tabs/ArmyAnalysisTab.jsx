import { useState, useMemo, useCallback } from 'react';
import { ArmyListImport, UnitCompositionManager } from '../army';

/**
 * ArmyAnalysisTab - Full army list analysis
 * 
 * Features:
 * - Import army list from Warhammer app
 * - Attach leaders to squads (multiple allowed)
 * - Assign units to transports (no capacity limits)
 * - Analyze composed army
 */
function ArmyAnalysisTab() {
  const [importedArmy, setImportedArmy] = useState(null);
  const [composition, setComposition] = useState({ attachments: {}, embarked: {} });
  
  // CRITICAL: useCallback prevents infinite re-render loop
  // Without this, handleImport is a new function every render,
  // which causes ArmyListImport's useEffect to fire repeatedly
  const handleImport = useCallback((armyData) => {
    setImportedArmy(armyData);
    // Reset composition when importing new army
    setComposition({ attachments: {}, embarked: {} });
  }, []);
  
  const handleCompositionChange = useCallback((newComposition) => {
    setComposition(newComposition);
  }, []);
  
  // Calculate composed army stats
  const composedStats = useMemo(() => {
    if (!importedArmy?.units) return null;
    
    const { attachments, embarked } = composition;
    
    // Count composed units (squads with leaders count as 1)
    const attachedLeaderIndices = new Set(Object.keys(attachments).map(Number));
    const embarkedIndices = new Set(Object.keys(embarked).map(Number));
    
    let composedUnitCount = 0;
    
    importedArmy.units.forEach((unit, index) => {
      // Skip attached leaders - they're part of another unit
      if (attachedLeaderIndices.has(index)) return;
      composedUnitCount++;
    });
    
    const totalAttachments = Object.keys(attachments).length;
    const totalEmbarked = Object.keys(embarked).length;
    const transportCount = importedArmy.units.filter(u => u.section === 'transports').length;
    
    return {
      originalUnits: importedArmy.units.length,
      composedUnits: composedUnitCount,
      attachedLeaders: totalAttachments,
      embarkedUnits: totalEmbarked,
      transports: transportCount,
    };
  }, [importedArmy, composition]);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Army Analysis</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Import your army list and configure unit compositions
          </p>
        </div>
        {importedArmy && (
          <button
            onClick={() => {
              setImportedArmy(null);
              setComposition({ attachments: {}, embarked: {} });
            }}
            className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            Reset
          </button>
        )}
      </div>
      
      {/* Import Section */}
      <ArmyListImport onImport={handleImport} />
      
      {/* Unit Composition Manager */}
      {importedArmy && (
        <UnitCompositionManager 
          army={importedArmy} 
          onCompositionChange={handleCompositionChange}
        />
      )}
      
      {/* Composition Summary Stats */}
      {importedArmy && composedStats && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Composition Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard 
              label="Total Units" 
              value={composedStats.originalUnits} 
              subtext="in list"
              color="zinc"
            />
            <StatCard 
              label="Composed" 
              value={composedStats.composedUnits} 
              subtext="after attachments"
              color="blue"
            />
            <StatCard 
              label="Leaders" 
              value={composedStats.attachedLeaders} 
              subtext="attached"
              color="purple"
            />
            <StatCard 
              label="Embarked" 
              value={composedStats.embarkedUnits} 
              subtext="in transports"
              color="green"
            />
            <StatCard 
              label="Transports" 
              value={composedStats.transports} 
              subtext="available"
              color="cyan"
            />
          </div>
        </div>
      )}
      
      {/* Analysis Sections */}
      {importedArmy && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stat Check Analysis */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Stat Check Analysis</h3>
                <p className="text-xs text-zinc-500">Coming soon</p>
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              Analyze how your composed army handles common stat check targets like C'tan Shards, 
              Wraithknights, and other high-toughness threats.
            </p>
          </div>
          
          {/* Damage Profile */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Damage Profile</h3>
                <p className="text-xs text-zinc-500">Coming soon</p>
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              See your army's damage distribution across different target types: 
              anti-infantry, anti-elite, anti-vehicle, anti-monster.
            </p>
          </div>
          
          {/* Unit Efficiency */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Unit Efficiency</h3>
                <p className="text-xs text-zinc-500">Coming soon</p>
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              Rank your units by points efficiency: damage per point, kills per point, 
              and value contribution to the army.
            </p>
          </div>
          
          {/* Threat Coverage */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Threat Coverage</h3>
                <p className="text-xs text-zinc-500">Coming soon</p>
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              Identify gaps in your list: do you have enough anti-tank? 
              Can you deal with hordes? What's your ranged vs melee split?
            </p>
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {!importedArmy && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Army Imported</h3>
          <p className="text-sm text-zinc-500 max-w-md mx-auto mb-6">
            Paste your army list from the Warhammer app above to start analyzing 
            your army's offensive capabilities.
          </p>
          
          {/* Quick tips */}
          <div className="max-w-lg mx-auto text-left bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-white mb-3">Quick Tips</h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span><strong className="text-zinc-300">Attach Leaders</strong> to squads - they become one unit for targeting</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span><strong className="text-zinc-300">Embark units</strong> in transports - group them together for analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                <span><strong className="text-zinc-300">Multiple leaders</strong> can attach to the same squad if your rules allow</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, subtext, color = 'zinc' }) {
  const colors = {
    zinc: 'text-zinc-300',
    blue: 'text-blue-400',
    orange: 'text-orange-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
    cyan: 'text-cyan-400',
  };
  
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold font-mono ${colors[color]}`}>{value}</div>
      <div className="text-xs text-zinc-400 font-medium">{label}</div>
      <div className="text-[10px] text-zinc-600">{subtext}</div>
    </div>
  );
}

export default ArmyAnalysisTab;