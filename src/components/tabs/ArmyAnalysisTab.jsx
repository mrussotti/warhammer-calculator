import { useState, useCallback } from 'react';
import { ArmyListImport, UnitCompositionManager } from '../army';

/**
 * ArmyAnalysisTab - Clean army analysis flow
 * 
 * Design:
 * 1. Import section (compact after success)
 * 2. Composition manager (attach leaders, embark units)
 * 3. That's it - no fluff, no "coming soon"
 */
function ArmyAnalysisTab() {
  const [importedArmy, setImportedArmy] = useState(null);
  const [composition, setComposition] = useState({ attachments: {}, embarked: {} });
  
  const handleImport = useCallback((armyData) => {
    setImportedArmy(armyData);
    setComposition({ attachments: {}, embarked: {} });
  }, []);
  
  const handleCompositionChange = useCallback((newComposition) => {
    setComposition(newComposition);
  }, []);

  return (
    <div className="space-y-4">
      {/* Header - only show when no army */}
      {!importedArmy && (
        <div className="mb-2">
          <h2 className="text-xl font-bold text-white">Army Analysis</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Import your army list to configure compositions and analyze damage output
          </p>
        </div>
      )}
      
      {/* Import Section */}
      <ArmyListImport onImport={handleImport} />
      
      {/* Composition Manager - only show when army is loaded */}
      {importedArmy && (
        <UnitCompositionManager 
          army={importedArmy} 
          onCompositionChange={handleCompositionChange}
        />
      )}
      
      {/* Empty State Help */}
      {!importedArmy && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-3">How to use</h3>
          <ol className="space-y-2 text-sm text-zinc-400">
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <span>Open the Warhammer app and go to your army list</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <span>Tap <strong className="text-white">Share</strong> → <strong className="text-white">Copy as Text</strong></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              <span>Paste the text into the box above</span>
            </li>
          </ol>
          
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <p className="text-xs text-zinc-500">
              Your army will be matched against the Wahapedia database to pull in weapon stats automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ArmyAnalysisTab;