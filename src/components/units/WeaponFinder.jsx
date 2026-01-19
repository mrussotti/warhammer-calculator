import { useState, useEffect, useRef } from 'react';

/**
 * WeaponFinder - Search for unit and add its weapons
 */

function normalizeText(text) {
  return (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[''`]/g, "'").trim();
}

function parseWeaponStat(value) {
  if (!value || value === '-' || value === 'N/A') return null;
  const str = String(value).trim().toUpperCase();
  if (/^\d+$/.test(str)) return parseInt(str);
  return str;
}

function parseSkill(value) {
  if (!value) return 4;
  const match = String(value).match(/(\d+)/);
  return match ? parseInt(match[1]) : 4;
}

function parseAP(value) {
  if (!value || value === '-' || value === '0') return 0;
  const match = String(value).match(/-?(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

function processWeapon(w, type) {
  return {
    name: w.name,
    type,
    attacks: parseWeaponStat(w.a) || 1,
    bs: type === 'ranged' ? parseSkill(w.bs) : parseSkill(w.ws),
    strength: parseWeaponStat(w.s) || 4,
    ap: parseAP(w.ap),
    damage: parseWeaponStat(w.d) || 1,
    keywords: w.keywords || '',
  };
}

export default function WeaponFinder({ 
  unitName,
  onWeaponAdd,
  onLoadoutReplace,
  onUnitNameChange,
  onClose,
}) {
  const [searchIndex, setSearchIndex] = useState([]);
  const [fullUnits, setFullUnits] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  
  const [matchedUnit, setMatchedUnit] = useState(null);
  const [weapons, setWeapons] = useState({ ranged: [], melee: [] });
  
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  
  const [addedWeapons, setAddedWeapons] = useState([]);
  
  const inputRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  // Delayed close for smoother UX
  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      onClose?.();
    }, 300);
  };

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        const indexPaths = ['/data/searchIndex.min.json', '/data/searchIndex.json'];
        for (const path of indexPaths) {
          try {
            const res = await fetch(path);
            if (res.ok) {
              setSearchIndex(await res.json());
              break;
            }
          } catch {}
        }
        
        const unitsPaths = ['/data/units.json'];
        for (const path of unitsPaths) {
          try {
            const res = await fetch(path);
            if (res.ok) {
              const units = await res.json();
              const map = {};
              units.forEach(u => map[u.id] = u);
              setFullUnits(map);
              break;
            }
          } catch {}
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load data:', err);
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Try to match unit name when data loads or name changes
  useEffect(() => {
    if (isLoading || !unitName) return;
    
    const normalizedName = normalizeText(unitName);
    if (!normalizedName || normalizedName === 'new unit' || normalizedName === 'custom unit') {
      setShowSearch(true);
      return;
    }
    
    // Find best match
    const match = searchIndex.find(u => normalizeText(u.name) === normalizedName);
    
    if (match) {
      const fullUnit = fullUnits[match.id];
      setMatchedUnit({ ...match, ...fullUnit });
      setWeapons(fullUnit?.weapons || { ranged: [], melee: [] });
      setShowSearch(false);
    } else {
      // Try partial match
      const partial = searchIndex.find(u => 
        normalizeText(u.name).includes(normalizedName) || 
        normalizedName.includes(normalizeText(u.name))
      );
      if (partial) {
        const fullUnit = fullUnits[partial.id];
        setMatchedUnit({ ...partial, ...fullUnit });
        setWeapons(fullUnit?.weapons || { ranged: [], melee: [] });
        setShowSearch(false);
      } else {
        setShowSearch(true);
        setQuery(unitName);
      }
    }
  }, [isLoading, unitName, searchIndex, fullUnits]);

  // Search logic
  useEffect(() => {
    if (!showSearch || !query.trim() || query.length < 2) {
      setResults([]);
      return;
    }
    
    const normalized = normalizeText(query);
    const words = normalized.split(/\s+/).filter(w => w.length > 0);
    
    const scored = searchIndex
      .map(unit => {
        const name = normalizeText(unit.name);
        const faction = normalizeText(unit.faction);
        if (!words.every(w => name.includes(w) || faction.includes(w))) return null;
        
        let score = 0;
        if (name === normalized) score = 100;
        else if (name.startsWith(normalized)) score = 80;
        else if (name.includes(normalized)) score = 60;
        else score = 20;
        
        return { ...unit, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
    
    setResults(scored);
  }, [query, showSearch, searchIndex]);

  const selectUnit = (unit) => {
    const fullUnit = fullUnits[unit.id];
    setMatchedUnit({ ...unit, ...fullUnit });
    setWeapons(fullUnit?.weapons || { ranged: [], melee: [] });
    setShowSearch(false);
    setAddedWeapons([]);
    
    if (onUnitNameChange && unit.name !== unitName) {
      onUnitNameChange(unit.name);
    }
  };

  const handleAddWeapon = (w, type) => {
    setAddedWeapons(prev => [...prev, w.name]);
    onWeaponAdd?.(processWeapon(w, type));
  };

  const handleAddAll = () => {
    const all = [
      ...(weapons.ranged || []).map(w => processWeapon(w, 'ranged')),
      ...(weapons.melee || []).map(w => processWeapon(w, 'melee')),
    ];
    setAddedWeapons(all.map(w => w.name));
    onLoadoutReplace?.(all);
  };

  const getAddedCount = (name) => addedWeapons.filter(n => n === name).length;

  const hasWeapons = weapons.ranged?.length > 0 || weapons.melee?.length > 0;
  const totalWeapons = (weapons.ranged?.length || 0) + (weapons.melee?.length || 0);

  if (isLoading) {
    return (
      <div 
        className="p-4 text-center text-zinc-500 text-sm transition-opacity duration-200" 
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
      >
        Loading weapons data...
      </div>
    );
  }

  // SEARCH MODE
  if (showSearch) {
    return (
      <div 
        className="p-3 transition-all duration-200" 
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
      >
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a unit..."
            autoFocus
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors duration-150"
          />
        </div>
        
        {results.length > 0 && (
          <div className="mt-2 bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
            {results.map((unit) => (
              <button
                key={unit.id}
                onClick={() => selectUnit(unit)}
                className="w-full px-3 py-2 text-left hover:bg-zinc-700 transition-all duration-150 hover:pl-4"
              >
                <div className="text-sm font-medium text-white">{unit.name}</div>
                <div className="text-xs text-zinc-500">{unit.faction}</div>
              </button>
            ))}
          </div>
        )}
        
        {query.length >= 2 && results.length === 0 && (
          <div className="mt-2 text-sm text-zinc-500 text-center py-2">
            No units found
          </div>
        )}
      </div>
    );
  }

  // WEAPONS MODE
  return (
    <div 
      className="transition-all duration-200"
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
    >
      <div className="flex items-center justify-between p-3 border-b border-zinc-700">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-white">{matchedUnit?.name}</div>
          <button
            onClick={() => setShowSearch(true)}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors duration-150"
          >
            (change)
          </button>
        </div>
        {hasWeapons && (
          <button
            onClick={handleAddAll}
            className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded transition-colors duration-150"
          >
            Add All ({totalWeapons})
          </button>
        )}
      </div>

      {hasWeapons ? (
        <div className="max-h-60 overflow-y-auto">
          {weapons.ranged?.length > 0 && (
            <div className="p-2">
              <div className="text-[10px] font-medium text-zinc-500 uppercase px-2 mb-1">Ranged</div>
              {weapons.ranged.map((w, i) => (
                <WeaponRow key={i} weapon={w} type="ranged" onAdd={handleAddWeapon} addedCount={getAddedCount(w.name)} />
              ))}
            </div>
          )}
          {weapons.melee?.length > 0 && (
            <div className="p-2 border-t border-zinc-700/50">
              <div className="text-[10px] font-medium text-zinc-500 uppercase px-2 mb-1">Melee</div>
              {weapons.melee.map((w, i) => (
                <WeaponRow key={i} weapon={w} type="melee" onAdd={handleAddWeapon} addedCount={getAddedCount(w.name)} isMelee />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 text-center text-sm text-zinc-500">
          No weapons data available for this unit
        </div>
      )}

      {addedWeapons.length > 0 && (
        <div className="px-3 py-2 bg-green-500/10 border-t border-green-500/20 text-xs text-green-400 animate-in fade-in slide-in-from-bottom-1 duration-200">
          ✓ {addedWeapons.length} weapon{addedWeapons.length !== 1 ? 's' : ''} added
        </div>
      )}
    </div>
  );
}

function WeaponRow({ weapon, type, onAdd, addedCount, isMelee }) {
  const w = weapon;
  return (
    <button
      onClick={() => onAdd(w, type)}
      className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-zinc-700/50 group text-left transition-all duration-150 ease-out hover:pl-3"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium truncate transition-colors duration-150 ${isMelee ? 'text-orange-300 group-hover:text-orange-200' : 'text-zinc-200 group-hover:text-white'}`}>
            {w.name}
          </span>
          {addedCount > 0 && (
            <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded animate-in fade-in duration-200">
              +{addedCount}
            </span>
          )}
        </div>
        <div className="text-[10px] text-zinc-500 mt-0.5 transition-colors duration-150 group-hover:text-zinc-400">
          {w.a}A • {type === 'ranged' ? w.bs : w.ws} • S{w.s} • AP{w.ap} • D{w.d}
          {w.keywords && <span className="text-zinc-600 group-hover:text-zinc-500"> • {w.keywords}</span>}
        </div>
      </div>
      <span className="ml-2 text-orange-500 opacity-0 group-hover:opacity-100 transition-all duration-150 transform group-hover:scale-110">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </span>
    </button>
  );
}