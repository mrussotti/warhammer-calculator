import { useState, useEffect, useRef, useMemo } from 'react';

/**
 * AddUnitPanel - Search-first unit adding
 * 
 * New flow:
 * 1. User clicks "Add Unit" → search expands
 * 2. User types unit name → sees results
 * 3. User clicks result → unit added with all weapons
 * 
 * That's it. 3 steps instead of 5+.
 */

function AddUnitPanel({ onUnitAdd }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searchIndex, setSearchIndex] = useState([]);
  const [fullUnits, setFullUnits] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [indexRes, unitsRes] = await Promise.all([
          fetch('/data/searchIndex.json'),
          fetch('/data/units.json'),
        ]);
        
        if (indexRes.ok) {
          setSearchIndex(await indexRes.json());
        }
        
        if (unitsRes.ok) {
          const units = await unitsRes.json();
          const unitMap = {};
          units.forEach(u => unitMap[u.id] = u);
          setFullUnits(unitMap);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load unit data:', err);
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Normalize text for searching
  const normalize = (text) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/'/g, '')
      .trim();
  };

  // Search logic
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const normalized = normalize(query);
    const words = normalized.split(/\s+/).filter(w => w.length > 0);
    
    const scored = searchIndex
      .map(unit => {
        const name = normalize(unit.name);
        const faction = normalize(unit.faction);
        
        // Check if all words match
        const allMatch = words.every(w => name.includes(w) || faction.includes(w));
        if (!allMatch) return null;
        
        let score = 0;
        if (name === normalized) score = 100;
        else if (name.startsWith(normalized)) score = 80;
        else if (name.includes(normalized)) score = 60;
        else if (words.every(w => name.includes(w))) score = 40;
        else score = 20;
        
        return { ...unit, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);

    setResults(scored);
    setSelectedIndex(0);
  }, [query, searchIndex]);

  // Select a unit and add it (without weapons - user adds what they want)
  const selectUnit = (unit) => {
    const fullUnit = fullUnits[unit.id];

    onUnitAdd({
      name: fullUnit?.name || unit.name,
      profiles: [], // Start empty - user adds weapons via WeaponFinder
    });

    setQuery('');
    setIsExpanded(false);
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!results.length) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          selectUnit(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsExpanded(false);
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && results.length > 0) {
      const selected = listRef.current.children[selectedIndex];
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, results.length]);

  // Popular units for quick access
  const popularUnits = useMemo(() => {
    const names = [
      'Intercessor Squad',
      'Tactical Squad', 
      'Terminator Squad',
      'Crisis Battlesuits',
      'Leman Russ Battle Tank',
      'Carnifex',
    ];
    return names
      .map(name => searchIndex.find(u => u.name === name))
      .filter(Boolean);
  }, [searchIndex]);

  // Collapsed state - just show button
  if (!isExpanded) {
    return (
      <button
        onClick={() => {
          setIsExpanded(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="w-full py-4 border-2 border-dashed border-zinc-700 hover:border-orange-500/50 rounded-xl text-zinc-400 hover:text-orange-400 transition-all flex items-center justify-center gap-2 group"
      >
        <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="font-medium">Add Unit</span>
      </button>
    );
  }

  // Expanded state - search interface
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <h3 className="text-sm font-semibold text-white">Add Unit</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-zinc-500 hover:text-zinc-300 p-1 rounded hover:bg-zinc-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4">
        {/* Search Input */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? "Loading unit database..." : "Search units..."}
            disabled={isLoading}
            autoFocus
            className="w-full px-4 py-3 pl-11 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
        </div>

        {/* Search Results */}
        {results.length > 0 && (
          <div 
            ref={listRef}
            className="mt-3 max-h-72 overflow-y-auto bg-zinc-800/50 rounded-lg border border-zinc-700"
          >
            {results.map((unit, index) => {
              const fullUnit = fullUnits[unit.id];
              const rangedCount = fullUnit?.weapons?.ranged?.length || 0;
              const meleeCount = fullUnit?.weapons?.melee?.length || 0;
              const totalWeapons = rangedCount + meleeCount;
              
              return (
                <button
                  key={unit.id}
                  onClick={() => selectUnit(unit)}
                  className={`w-full px-4 py-3 text-left transition-colors border-b border-zinc-700/50 last:border-b-0 ${
                    index === selectedIndex 
                      ? 'bg-orange-500/20 text-white' 
                      : 'hover:bg-zinc-700/50 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{unit.name}</div>
                      <div className="text-xs text-zinc-500 truncate">{unit.faction}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {totalWeapons > 0 && (
                        <span className="px-2 py-0.5 bg-zinc-700 rounded text-xs text-zinc-300">
                          {totalWeapons} weapon{totalWeapons !== 1 ? 's' : ''}
                        </span>
                      )}
                      <span className="text-orange-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* No Results */}
        {query.length >= 2 && results.length === 0 && !isLoading && (
          <div className="mt-3 py-6 text-center text-sm text-zinc-500 bg-zinc-800/30 rounded-lg">
            No units found for "{query}"
          </div>
        )}

        {/* Popular Units - show when no search query */}
        {!query && popularUnits.length > 0 && (
          <div className="mt-4">
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Popular Units</div>
            <div className="flex flex-wrap gap-2">
              {popularUnits.map((unit) => {
                const fullUnit = fullUnits[unit.id];
                const totalWeapons = (fullUnit?.weapons?.ranged?.length || 0) + (fullUnit?.weapons?.melee?.length || 0);
                
                return (
                  <button
                    key={unit.id}
                    onClick={() => selectUnit(unit)}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-orange-500/50 rounded-lg text-sm text-zinc-300 hover:text-white transition-all group"
                  >
                    <span>{unit.name}</span>
                    {totalWeapons > 0 && (
                      <span className="ml-2 text-xs text-zinc-500 group-hover:text-zinc-400">
                        ({totalWeapons})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Manual Entry Option */}
        <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
          <button
            onClick={() => {
              onUnitAdd({ name: 'Custom Unit', profiles: [] });
              setIsExpanded(false);
            }}
            className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
          >
            Create empty unit manually →
          </button>
          <div className="text-[10px] text-zinc-600">
            Powered by Wahapedia
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddUnitPanel;