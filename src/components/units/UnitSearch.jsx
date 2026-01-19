import { useState, useEffect, useRef, useMemo } from 'react';

/**
 * UnitSearch - Autocomplete search for BSData unit data
 * Shows full unit card with abilities for manual defensive ability configuration
 * 
 * Props:
 *   - onSelect(unit): Called when a unit is selected
 *   - onClear(): Called when selection is cleared  
 *   - selectedUnit: Currently selected unit object
 *   - placeholder: Input placeholder text
 *   - className: Additional CSS classes
 */
function UnitSearch({ 
  onSelect, 
  onClear,
  selectedUnit = null,
  placeholder = "Search units (e.g. 'Terminator', 'C'tan')", 
  className = '' 
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchIndex, setSearchIndex] = useState([]);
  const [fullUnits, setFullUnits] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showAbilities, setShowAbilities] = useState(false);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Strip HTML tags from text (in case data has embedded HTML)
  const stripHTML = (text) => {
    if (!text) return '';
    return text
      .replace(/<[^>]*>/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Load search index on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [indexRes, unitsRes] = await Promise.all([
          fetch('/data/searchIndex.json'),
          fetch('/data/units.json'),
        ]);
        
        if (!indexRes.ok) {
          throw new Error(`Failed to load searchIndex.json: ${indexRes.status}`);
        }
        
        const index = await indexRes.json();
        setSearchIndex(index);
        
        // Load full unit data for abilities display
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
      .replace(/[\u2018\u2019\u201A\u201B\u2032\u0027\u0060]/g, "'")
      .replace(/[\u201C\u201D\u201E\u201F\u2033\u0022]/g, '"')
      .replace(/'/g, '')
      .replace(/[^a-z0-9\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Match scoring
  const matchScore = (query, target) => {
    const q = normalize(query);
    const t = normalize(target);
    if (!q || !t) return 0;
    if (t === q) return 100;
    if (t.startsWith(q)) return 80;
    if (t.includes(q)) return 60;
    
    const queryWords = q.split(/\s+/).filter(w => w.length >= 2);
    const targetWords = t.split(/\s+/);
    if (queryWords.length === 0) return 0;
    
    let score = 0;
    let matchedWords = 0;
    for (const qw of queryWords) {
      if (targetWords.some(tw => tw.startsWith(qw))) {
        matchedWords++;
        score += 15;
      } else if (targetWords.some(tw => tw.includes(qw))) {
        matchedWords++;
        score += 8;
      }
    }
    return matchedWords < queryWords.length ? 0 : score;
  };

  // Search implementation
  const search = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const normalizedQuery = normalize(query);
    if (normalizedQuery.length < 2) return [];
    
    const scored = searchIndex.map(unit => {
      const nameScore = matchScore(query, unit.name);
      const factionScore = matchScore(query, unit.faction) * 0.5;
      let keywordScore = 0;
      if (unit.keywords?.some(kw => normalize(kw).includes(normalizedQuery))) {
        keywordScore = 10;
      }
      return { ...unit, score: nameScore + factionScore + keywordScore };
    });
    
    return scored
      .filter(u => u.score > 0)
      .sort((a, b) => b.score !== a.score ? b.score - a.score : a.name.localeCompare(b.name))
      .slice(0, 20);
  }, [query, searchIndex]);

  useEffect(() => {
    setResults(search);
    setSelectedIndex(0);
  }, [search]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') setIsOpen(true);
      return;
    }
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
        if (results[selectedIndex]) selectUnit(results[selectedIndex]);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  // Select a unit
  const selectUnit = (unit) => {
    const fullUnit = fullUnits[unit.id] || unit;
    onSelect({
      id: unit.id,
      name: unit.name,
      faction: unit.faction || fullUnit.faction,
      toughness: unit.t,
      save: unit.sv,
      wounds: unit.w,
      invuln: unit.inv ?? 7,
      fnp: unit.fnp ?? 7,
      damageReduction: unit.damageReduction ?? 0,
      damageCap: unit.damageCap ?? 0,
      keywords: unit.keywords || [],
      // Include full data for display
      abilities: fullUnit.abilities || [],
      weapons: fullUnit.weapons || { ranged: [], melee: [] },
      profiles: fullUnit.profiles || [],
    });
    setQuery('');
    setIsOpen(false);
    setShowAbilities(false);
    inputRef.current?.blur();
  };

  // Scroll into view
  useEffect(() => {
    if (listRef.current && isOpen) {
      const selected = listRef.current.children[selectedIndex];
      if (selected) selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, isOpen]);

  // Get full unit data for selected unit
  const selectedFullUnit = selectedUnit?.id ? fullUnits[selectedUnit.id] : null;
  const abilities = selectedFullUnit?.abilities || selectedUnit?.abilities || [];

  return (
    <div className={`relative ${className}`}>
      {/* Selected unit display */}
      {selectedUnit && selectedUnit.name && (
        <div className="mb-2 bg-zinc-800/50 border border-zinc-700 rounded-lg overflow-hidden">
          {/* Header with stats */}
          <div className="flex items-center gap-2 p-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-white">{selectedUnit.name}</span>
                {selectedUnit.faction && (
                  <span className="text-xs text-zinc-500">• {selectedUnit.faction}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="px-1.5 py-0.5 bg-zinc-700 rounded text-xs text-zinc-300 font-mono">T{selectedUnit.toughness}</span>
                <span className="px-1.5 py-0.5 bg-zinc-700 rounded text-xs text-zinc-300 font-mono">{selectedUnit.save}+</span>
                <span className="px-1.5 py-0.5 bg-zinc-700 rounded text-xs text-zinc-300 font-mono">{selectedUnit.wounds}W</span>
                {selectedUnit.invuln && selectedUnit.invuln < 7 && (
                  <span className="px-1.5 py-0.5 bg-purple-500/30 rounded text-xs text-purple-300 font-mono">{selectedUnit.invuln}++</span>
                )}
                {selectedUnit.fnp && selectedUnit.fnp < 7 && (
                  <span className="px-1.5 py-0.5 bg-green-500/30 rounded text-xs text-green-300 font-mono">{selectedUnit.fnp}+++</span>
                )}
                {selectedUnit.damageReduction === -1 && (
                  <span className="px-1.5 py-0.5 bg-blue-500/30 rounded text-xs text-blue-300 font-mono">½ Dmg</span>
                )}
                {selectedUnit.damageReduction > 0 && (
                  <span className="px-1.5 py-0.5 bg-blue-500/30 rounded text-xs text-blue-300 font-mono">-{selectedUnit.damageReduction} Dmg</span>
                )}
                {selectedUnit.damageCap > 0 && (
                  <span className="px-1.5 py-0.5 bg-amber-500/30 rounded text-xs text-amber-300 font-mono">Max {selectedUnit.damageCap}W</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {abilities.length > 0 && (
                <button
                  onClick={() => setShowAbilities(!showAbilities)}
                  className={`p-1.5 rounded transition-colors ${showAbilities ? 'bg-orange-500/20 text-orange-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700'}`}
                  title={showAbilities ? "Hide abilities" : "Show abilities"}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              )}
              {onClear && (
                <button
                  onClick={onClear}
                  className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 rounded transition-colors"
                  title="Clear selection"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Abilities panel */}
          {showAbilities && abilities.length > 0 && (
            <div className="border-t border-zinc-700 p-3 bg-zinc-900/50 max-h-64 overflow-y-auto">
              <div className="text-xs font-medium text-zinc-400 mb-2">ABILITIES</div>
              <div className="space-y-2">
                {abilities.map((ability, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="font-medium text-orange-400">{ability.name}</div>
                    <div className="text-zinc-400 mt-0.5 leading-relaxed">{stripHTML(ability.description)}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-2 border-t border-zinc-700/50 text-[10px] text-zinc-500">
                💡 Check abilities above and manually set defensive options below if needed
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={isLoading ? 'Loading unit data...' : placeholder}
          disabled={isLoading}
          className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <svg className="w-5 h-5 text-zinc-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div 
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-80 overflow-y-auto"
        >
          {results.map((unit, index) => (
            <button
              key={unit.id}
              onClick={() => selectUnit(unit)}
              className={`w-full px-4 py-2.5 text-left flex items-center justify-between transition-colors ${
                index === selectedIndex 
                  ? 'bg-orange-500/20 text-white' 
                  : 'text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{unit.name}</div>
                <div className="text-xs text-zinc-500 truncate">{unit.faction}</div>
              </div>
              <div className="flex items-center gap-1.5 text-xs ml-2 flex-shrink-0">
                <span className="px-1.5 py-0.5 bg-zinc-700 rounded text-zinc-300">T{unit.t}</span>
                <span className="px-1.5 py-0.5 bg-zinc-700 rounded text-zinc-300">{unit.sv}+</span>
                <span className="px-1.5 py-0.5 bg-zinc-700 rounded text-zinc-300">{unit.w}W</span>
                {unit.inv && unit.inv < 7 && (
                  <span className="px-1.5 py-0.5 bg-purple-500/30 rounded text-purple-300">{unit.inv}++</span>
                )}
                {unit.damageReduction === -1 && (
                  <span className="px-1.5 py-0.5 bg-blue-500/30 rounded text-blue-300">½D</span>
                )}
                {unit.damageReduction > 0 && (
                  <span className="px-1.5 py-0.5 bg-blue-500/30 rounded text-blue-300">-{unit.damageReduction}D</span>
                )}
                {unit.damageCap && (
                  <span className="px-1.5 py-0.5 bg-amber-500/30 rounded text-amber-300">{unit.damageCap}W</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl p-4 text-center text-zinc-500 text-sm">
          No units found for "{query}"
        </div>
      )}
    </div>
  );
}

export default UnitSearch;