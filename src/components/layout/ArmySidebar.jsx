import { useState, useMemo } from 'react';
import ArmyImportSection from './ArmyImportSection';
import UnitSelector from './UnitSelector';
import CompositionPanel from './CompositionPanel';

/**
 * ArmySidebar - Collapsible sidebar for army management
 * 
 * Contains:
 * - Army import (paste text)
 * - Unit selection checkboxes
 * - Composition controls (attach leaders, embark)
 */
function ArmySidebar({
  // State from useArmy
  importedArmy,
  wahapediaUnits,
  isLoadingData,
  sidebarCollapsed,
  units,
  leaders,
  squads,
  transports,
  selectedUnitIds,
  attachments,
  embarked,
  armyStats,
  matchStats,
  // Actions
  importArmy,
  clearArmy,
  toggleUnit,
  selectAll,
  deselectAll,
  attachLeader,
  embarkUnit,
  toggleSidebar,
  getDisplayName,
}) {
  const [activeSection, setActiveSection] = useState('units'); // 'units' | 'compose'
  
  // Count of units by category
  const categoryCounts = useMemo(() => ({
    leaders: leaders.length,
    squads: squads.length,
    transports: transports.length,
  }), [leaders, squads, transports]);
  
  // Collapsed sidebar - just a thin strip with expand button
  if (sidebarCollapsed) {
    return (
      <div className="w-12 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-4">
        <button
          onClick={toggleSidebar}
          className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          title="Expand sidebar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        {importedArmy && (
          <>
            <div className="mt-4 w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-green-400">{units.length}</span>
            </div>
            <span className="text-[9px] text-zinc-500 mt-1">units</span>
            
            {selectedUnitIds.size > 0 && (
              <>
                <div className="mt-3 w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-orange-400">{selectedUnitIds.size}</span>
                </div>
                <span className="text-[9px] text-zinc-500 mt-1">selected</span>
              </>
            )}
          </>
        )}
      </div>
    );
  }
  
  return (
    <div className="w-80 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Your Army</h2>
            {armyStats && (
              <p className="text-[10px] text-zinc-500">{armyStats.totalPoints} pts</p>
            )}
          </div>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
          title="Collapse sidebar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
      
      {/* Import Section */}
      <ArmyImportSection
        importedArmy={importedArmy}
        wahapediaUnits={wahapediaUnits}
        isLoadingData={isLoadingData}
        armyStats={armyStats}
        matchStats={matchStats}
        onImport={importArmy}
        onClear={clearArmy}
      />
      
      {/* Content - only show when army is loaded */}
      {importedArmy && units.length > 0 && (
        <>
          {/* Section Tabs */}
          <div className="flex border-b border-zinc-800">
            <button
              onClick={() => setActiveSection('units')}
              className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors relative ${
                activeSection === 'units' 
                  ? 'text-white' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Units
              <span className="ml-1.5 px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px]">
                {selectedUnitIds.size}/{units.length}
              </span>
              {activeSection === 'units' && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-orange-500 rounded-t" />
              )}
            </button>
            <button
              onClick={() => setActiveSection('compose')}
              className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors relative ${
                activeSection === 'compose' 
                  ? 'text-white' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Compose
              {Object.keys(attachments).length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px]">
                  {Object.keys(attachments).length}
                </span>
              )}
              {activeSection === 'compose' && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-orange-500 rounded-t" />
              )}
            </button>
          </div>
          
          {/* Section Content */}
          <div className="flex-1 overflow-y-auto">
            {activeSection === 'units' && (
              <UnitSelector
                units={units}
                leaders={leaders}
                squads={squads}
                transports={transports}
                selectedUnitIds={selectedUnitIds}
                attachments={attachments}
                onToggle={toggleUnit}
                onSelectAll={selectAll}
                onDeselectAll={deselectAll}
                getDisplayName={getDisplayName}
              />
            )}
            
            {activeSection === 'compose' && (
              <CompositionPanel
                units={units}
                leaders={leaders}
                squads={squads}
                transports={transports}
                attachments={attachments}
                embarked={embarked}
                onAttach={attachLeader}
                onEmbark={embarkUnit}
                getDisplayName={getDisplayName}
              />
            )}
          </div>
          
          {/* Footer Summary */}
          <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-950/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">
                {selectedUnitIds.size === 0 
                  ? 'No units selected'
                  : `${selectedUnitIds.size} unit${selectedUnitIds.size !== 1 ? 's' : ''} selected`
                }
              </span>
              {selectedUnitIds.size > 0 && (
                <button
                  onClick={deselectAll}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </>
      )}
      
      {/* Empty State - No army loaded */}
      {!importedArmy && !isLoadingData && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-zinc-400 mb-2">No Army Loaded</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Paste your army list from the Warhammer app to get started
          </p>
        </div>
      )}
    </div>
  );
}

export default ArmySidebar;
