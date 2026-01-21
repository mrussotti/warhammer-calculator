import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { parseArmyList, getArmyStats, validateArmyList } from '../../utils/armyListParser';
import { mergeArmyWithWahapedia, getMatchSummary } from '../../utils/wahapediaMatcher';

/**
 * ArmyListImport - Compact army list importer
 * 
 * Design:
 * - Empty state: Shows textarea to paste
 * - Loaded state: Compact header bar (name, faction, points, unit count)
 * - Click to expand and edit/replace
 */
function ArmyListImport({ onImport }) {
  const [rawText, setRawText] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [wahapediaUnits, setWahapediaUnits] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const lastImportedRef = useRef(null);
  
  // Load Wahapedia data on mount
  useEffect(() => {
    async function loadWahapediaData() {
      try {
        const res = await fetch('/data/units.json');
        if (res.ok) {
          const units = await res.json();
          setWahapediaUnits(units);
        }
      } catch (err) {
        console.error('Failed to load Wahapedia data:', err);
      } finally {
        setIsLoadingData(false);
      }
    }
    loadWahapediaData();
  }, []);
  
  // Parse the army list whenever text changes
  const parsedArmy = useMemo(() => {
    if (!rawText.trim()) return null;
    return parseArmyList(rawText);
  }, [rawText]);
  
  // Merge with Wahapedia data
  const mergedArmy = useMemo(() => {
    if (!parsedArmy || !wahapediaUnits) return parsedArmy;
    return mergeArmyWithWahapedia(parsedArmy, wahapediaUnits);
  }, [parsedArmy, wahapediaUnits]);
  
  // Get match summary for warnings
  const matchSummary = useMemo(() => {
    return getMatchSummary(mergedArmy);
  }, [mergedArmy]);
  
  // Get stats
  const stats = useMemo(() => {
    if (!mergedArmy) return null;
    return getArmyStats(mergedArmy);
  }, [mergedArmy]);
  
  const hasValidParse = mergedArmy && mergedArmy.units.length > 0;
  
  // Notify parent when army changes
  useEffect(() => {
    const armyId = hasValidParse ? `${rawText.length}-${mergedArmy?.units?.length}` : null;
    
    if (armyId !== lastImportedRef.current) {
      lastImportedRef.current = armyId;
      
      if (hasValidParse && onImport) {
        onImport(mergedArmy);
      } else if (!hasValidParse && onImport) {
        onImport(null);
      }
    }
  }, [rawText, hasValidParse, mergedArmy, onImport]);
  
  // Auto-collapse when we have a valid parse
  useEffect(() => {
    if (hasValidParse) {
      const timer = setTimeout(() => setIsExpanded(false), 300);
      return () => clearTimeout(timer);
    } else {
      setIsExpanded(true);
    }
  }, [hasValidParse]);
  
  const handleClear = () => {
    setRawText('');
    setIsExpanded(true);
  };

  // Compact loaded state - just a header bar
  if (hasValidParse && !isExpanded) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              matchSummary.hasIssues ? 'bg-yellow-500/20' : 'bg-green-500/20'
            }`}>
              {matchSummary.hasIssues ? (
                <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                {mergedArmy.armyName || 'Unnamed Army'}
              </h3>
              <p className="text-xs text-zinc-500">
                {mergedArmy.faction && `${mergedArmy.faction} • `}
                {mergedArmy.units.length} units • {stats?.totalModels || 0} models
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-blue-400 font-mono">
              {mergedArmy.totalParsedPoints} pts
            </span>
            <button
              onClick={() => setIsExpanded(true)}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
        
        {/* Show warning if there are match issues */}
        {matchSummary.hasIssues && (
          <div className="px-4 py-2 border-t border-zinc-800 bg-yellow-500/5">
            <p className="text-xs text-yellow-400">
              ⚠ {matchSummary.summary} - some weapons won't have stats
            </p>
          </div>
        )}
      </div>
    );
  }

  // Empty or expanded state - show textarea
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Import Army List</h3>
              <p className="text-xs text-zinc-500">
                {isLoadingData ? 'Loading weapon database...' : 'Paste from Warhammer app'}
              </p>
            </div>
          </div>
          
          {hasValidParse && (
            <button
              onClick={() => setIsExpanded(false)}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Collapse ↑
            </button>
          )}
        </div>
        
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder={`Paste your army list from the Warhammer app...

Example:
* * * * * My Army (2000 Points)
Orks
War Horde
Strike Force (2,000 Points)

CHARACTERS
Warboss (75 Points)
• 1x Big choppa
...`}
          className="w-full h-40 px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-600 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
        />
        
        {/* Status footer */}
        {rawText && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
            <button
              onClick={handleClear}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Clear
            </button>
            {hasValidParse ? (
              <span className={`text-xs flex items-center gap-1.5 ${matchSummary.hasIssues ? 'text-yellow-400' : 'text-green-400'}`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {mergedArmy.units.length} units parsed
                {matchSummary.hasIssues && ` (${matchSummary.summary})`}
              </span>
            ) : rawText.length > 20 ? (
              <span className="text-xs text-yellow-400">
                Parsing... check format if stuck
              </span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export default ArmyListImport;