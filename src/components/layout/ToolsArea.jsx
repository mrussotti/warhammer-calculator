import { useState, useMemo } from 'react';
import SelectedUnitsEditor from './SelectedUnitsEditor';

/**
 * ToolsArea - Main content area with analysis tools as tabs
 * 
 * Tools receive selected units/profiles from the sidebar
 */
function ToolsArea({
  // Tool components passed as props to avoid circular imports
  DamageCalculator,
  DamageAnalysis,
  ArmyDashboard,
  // Data from useArmy
  importedArmy,
  selectedProfiles,
  unitsForCalculator,
  selectedUnitIds,
  armyStats,
  // Profile override functions
  updateProfileOverride,
  resetProfileOverrides,
}) {
  const [activeTool, setActiveTool] = useState('damage');
  
  // Tool definitions
  const tools = useMemo(() => [
    {
      id: 'damage',
      label: 'Damage Calculator',
      icon: <TargetIcon />,
      available: true, // Always available
    },
    {
      id: 'analysis',
      label: 'Damage Heatmap',
      icon: <AnalysisIcon />,
      available: true,
    },
    {
      id: 'dashboard',
      label: 'Army Dashboard',
      icon: <DashboardIcon />,
      available: !!importedArmy,
      badge: !importedArmy ? 'Import army' : null,
    },
  ], [importedArmy]);
  
  // Find active tool
  const currentTool = tools.find(t => t.id === activeTool) || tools[0];
  
  // If current tool becomes unavailable, switch to first available
  if (!currentTool.available) {
    const firstAvailable = tools.find(t => t.available);
    if (firstAvailable && firstAvailable.id !== activeTool) {
      setActiveTool(firstAvailable.id);
    }
  }
  
  // Status bar content
  const statusContent = useMemo(() => {
    if (!importedArmy) {
      return {
        text: 'No army loaded â€” enter weapons manually or import an army',
        type: 'info',
      };
    }
    
    if (selectedUnitIds.size === 0) {
      return {
        text: 'Select units from the sidebar to analyze',
        type: 'warning',
      };
    }
    
    const weaponCount = selectedProfiles.length;
    return {
      text: `${selectedUnitIds.size} unit${selectedUnitIds.size !== 1 ? 's' : ''} selected â€” ${weaponCount} weapon profile${weaponCount !== 1 ? 's' : ''}`,
      type: 'success',
    };
  }, [importedArmy, selectedUnitIds, selectedProfiles]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between px-6 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex gap-1">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => tool.available && setActiveTool(tool.id)}
              disabled={!tool.available}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTool === tool.id 
                  ? 'text-white' 
                  : tool.available
                    ? 'text-zinc-500 hover:text-zinc-300'
                    : 'text-zinc-600 cursor-not-allowed'
              }`}
            >
              <span className={activeTool === tool.id ? 'text-orange-500' : ''}>{tool.icon}</span>
              {tool.label}
              {tool.badge && (
                <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-500 text-[10px] rounded">
                  {tool.badge}
                </span>
              )}
              {activeTool === tool.id && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-orange-500 rounded-t" />
              )}
            </button>
          ))}
        </div>
        
        {/* Status indicator */}
        <div className={`flex items-center gap-2 text-xs ${
          statusContent.type === 'success' ? 'text-green-400' :
          statusContent.type === 'warning' ? 'text-yellow-400' :
          'text-zinc-500'
        }`}>
          {statusContent.type === 'success' && (
            <div className="w-2 h-2 rounded-full bg-green-500" />
          )}
          {statusContent.type === 'warning' && (
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
          )}
          <span>{statusContent.text}</span>
        </div>
      </div>
      
      {/* Tool Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Weapon Modifiers Editor - shown when damage tool is active and units are selected */}
        {activeTool === 'damage' && unitsForCalculator.length > 0 && (
          <SelectedUnitsEditor
            units={unitsForCalculator}
            onProfileUpdate={updateProfileOverride}
            onResetAll={resetProfileOverrides}
          />
        )}
        
        {activeTool === 'damage' && DamageCalculator && selectedProfiles.length > 0 && (
          <DamageCalculator 
            profiles={selectedProfiles} 
            units={unitsForCalculator}
            hasArmy={!!importedArmy}
          />
        )}
        
        {activeTool === 'analysis' && DamageAnalysis && selectedProfiles.length > 0 && (
          <DamageAnalysis 
            profiles={selectedProfiles}
            units={unitsForCalculator}
          />
        )}
        
        {activeTool === 'dashboard' && ArmyDashboard && importedArmy && (
          <ArmyDashboard 
            army={importedArmy}
            armyStats={armyStats}
          />
        )}
        
        {/* Empty state when no profiles and using damage tools */}
        {(activeTool === 'damage' || activeTool === 'analysis') && selectedProfiles.length === 0 && (
          <EmptyToolState 
            hasArmy={!!importedArmy}
            toolName={currentTool.label}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Empty state component shown when no units selected
 */
function EmptyToolState({ hasArmy, toolName }) {
  if (hasArmy) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-zinc-400 mb-2">Select Units to Analyze</h3>
        <p className="text-sm text-zinc-500 max-w-md">
          Check units in the sidebar to include them in the {toolName.toLowerCase()}.
          Selected units' weapons will be calculated together.
        </p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-zinc-400 mb-2">Import Your Army</h3>
      <p className="text-sm text-zinc-500 max-w-md mb-4">
        Paste your army list from the Warhammer app to automatically load units and weapons.
      </p>
      <div className="text-xs text-zinc-600">
        Or use the manual weapon entry below
      </div>
    </div>
  );
}

// Icons
function TargetIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  );
}

function AnalysisIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18 9l-5 5-4-4-3 3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="4" rx="1" />
      <rect x="14" y="10" width="7" height="11" rx="1" />
      <rect x="3" y="13" width="7" height="8" rx="1" />
    </svg>
  );
}

export default ToolsArea;