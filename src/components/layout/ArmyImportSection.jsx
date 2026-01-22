import { useState, useMemo, useEffect, useRef } from 'react';
import { parseArmyList } from '../../utils/armyListParser';
import { mergeArmyWithWahapedia } from '../../utils/wahapediaMatcher';

/**
 * ArmyImportSection - Compact import UI for sidebar
 * 
 * States:
 * - No army: Shows expandable textarea
 * - Army loaded: Shows compact summary with edit/clear
 */
function ArmyImportSection({
  importedArmy,
  wahapediaUnits,
  isLoadingData,
  armyStats,
  matchStats,
  onImport,
  onClear,
}) {
  const [isExpanded, setIsExpanded] = useState(!importedArmy);
  const [rawText, setRawText] = useState('');
  const textareaRef = useRef(null);
  
  // Parse and merge when text changes
  const parsedArmy = useMemo(() => {
    if (!rawText.trim()) return null;
    return parseArmyList(rawText);
  }, [rawText]);
  
  const mergedArmy = useMemo(() => {
    if (!parsedArmy || !wahapediaUnits) return parsedArmy;
    return mergeArmyWithWahapedia(parsedArmy, wahapediaUnits);
  }, [parsedArmy, wahapediaUnits]);
  
  const hasValidParse = mergedArmy && mergedArmy.units?.length > 0;
  
  // Notify parent when we have a valid army
  useEffect(() => {
    if (hasValidParse && mergedArmy !== importedArmy) {
      onImport(mergedArmy);
      // Auto-collapse after successful import
      setTimeout(() => setIsExpanded(false), 300);
    }
  }, [hasValidParse, mergedArmy, importedArmy, onImport]);
  
  // Expand when no army
  useEffect(() => {
    if (!importedArmy) {
      setIsExpanded(true);
    }
  }, [importedArmy]);
  
  const handleClear = () => {
    setRawText('');
    setIsExpanded(true);
    onClear();
  };
  
  const handleEdit = () => {
    setIsExpanded(true);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };
  
  // Collapsed state - show summary
  if (importedArmy && !isExpanded) {
    const hasIssues = matchStats?.hasIssues;
    
    return (
      <div className="border-b border-zinc-800">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              hasIssues ? 'bg-yellow-500/20' : 'bg-green-500/20'
            }`}>
              {hasIssues ? (
                <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-white truncate">
                {armyStats?.armyName || 'Unnamed Army'}
              </h3>
              <p className="text-[10px] text-zinc-500 truncate">
                {armyStats?.faction}
                {armyStats?.totalModels && ` • ${armyStats.totalModels} models`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleEdit}
              className="flex-1 px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleClear}
              className="flex-1 px-3 py-1.5 text-xs text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
        
        {/* Match warning */}
        {hasIssues && (
          <div className="px-4 py-2 border-t border-zinc-800 bg-yellow-500/5">
            <p className="text-[10px] text-yellow-400">
              ⚠ {matchStats.unitsMatched < matchStats.units 
                ? `${matchStats.units - matchStats.unitsMatched} unit(s) not found` 
                : `${matchStats.weapons - matchStats.weaponsMatched} weapon(s) not found`
              }
            </p>
          </div>
        )}
      </div>
    );
  }
  
  // Expanded state - show textarea
  return (
    <div className="border-b border-zinc-800">
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-zinc-400">
            {isLoadingData ? 'Loading data...' : 'Paste army list'}
          </span>
          {importedArmy && (
            <button
              onClick={() => setIsExpanded(false)}
              className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
        
        <textarea
          ref={textareaRef}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Paste from Warhammer app..."
          disabled={isLoadingData}
          className="w-full h-28 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-600 font-mono focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none"
        />
        
        {/* Status */}
        {rawText && (
          <div className="flex items-center justify-between mt-2">
            <button
              onClick={() => setRawText('')}
              className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Clear text
            </button>
            {hasValidParse ? (
              <span className="text-[10px] text-green-400 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {mergedArmy.units.length} units found
              </span>
            ) : rawText.length > 20 ? (
              <span className="text-[10px] text-yellow-400">
                Parsing...
              </span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export default ArmyImportSection;
