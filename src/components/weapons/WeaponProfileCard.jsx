import { useState } from 'react';
import { Stepper } from '../ui';
import { parseDice } from '../../utils/damageCalculations';
import { BS_WS_RANGE, DAMAGE_PRESETS, ATTACK_PRESETS, UNIT_KEYWORDS } from '../../utils/constants';

function AbilityToggle({ label, active, onChange, color = 'orange' }) {
  const colors = { blue: 'bg-blue-500/15 border-blue-500/50 text-blue-400', green: 'bg-green-500/15 border-green-500/50 text-green-400', purple: 'bg-purple-500/15 border-purple-500/50 text-purple-400', orange: 'bg-orange-500/15 border-orange-500/50 text-orange-400' };
  return <button onClick={() => onChange(!active)} className={`px-2 py-1 rounded text-[11px] font-medium transition-all border ${active ? colors[color] : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400'}`}>{label}</button>;
}

function AbilityNumber({ label, value, onChange, max = 3, min = 0, color = 'orange', showSign = false }) {
  const active = value !== 0;
  const colors = { blue: 'bg-blue-500/15 border-blue-500/50 text-blue-400', green: 'bg-green-500/15 border-green-500/50 text-green-400', purple: 'bg-purple-500/15 border-purple-500/50 text-purple-400', orange: 'bg-orange-500/15 border-orange-500/50 text-orange-400' };
  return (
    <div className="flex items-center">
      <button onClick={() => onChange(value === 0 ? (min < 0 ? -1 : 1) : 0)} className={`px-2 py-1 text-[11px] font-medium transition-all border ${active ? `${colors[color]} rounded-l rounded-r-none border-r-0` : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400 rounded'}`}>{label}</button>
      {active && <select value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="h-[26px] bg-zinc-800 text-zinc-300 text-xs py-0.5 px-2 rounded-r border border-l-0 border-zinc-700 focus:outline-none focus:border-orange-500">{Array.from({ length: max - min + 1 }, (_, i) => min + i).filter(n => n !== 0 || min === 0).map(n => <option key={n} value={n}>{showSign && n > 0 ? `+${n}` : n}</option>)}</select>}
    </div>
  );
}

function AbilitySelect({ label, value, onChange, options, color = 'orange' }) {
  const defaultValue = options[0]?.value;
  const active = value !== defaultValue;
  const colors = { blue: 'bg-blue-500/15 border-blue-500/50 text-blue-400', green: 'bg-green-500/15 border-green-500/50 text-green-400', purple: 'bg-purple-500/15 border-purple-500/50 text-purple-400', orange: 'bg-orange-500/15 border-orange-500/50 text-orange-400' };
  return (
    <div className="flex items-center">
      <span className={`px-2 py-1 text-[11px] font-medium border rounded-l rounded-r-none border-r-0 ${active ? colors[color] : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>{label}</span>
      <select value={value} onChange={(e) => { const val = e.target.value; onChange(val === 'none' ? val : isNaN(val) ? val : parseInt(val)); }} className="h-[26px] bg-zinc-800 text-zinc-300 text-xs py-0.5 px-2 rounded-r border border-l-0 border-zinc-700 focus:outline-none focus:border-orange-500">{options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select>
    </div>
  );
}

function AntiKeywordSelector({ value, onChange }) {
  const normalized = value && typeof value === 'object' && typeof value.keyword === 'string' && value.keyword.length > 0 ? { keyword: value.keyword, value: parseInt(value.value, 10) || 4 } : null;
  const active = normalized !== null;
  const [showDropdown, setShowDropdown] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => { if (active) onChange(null); else setShowDropdown(!showDropdown); }} className={`px-2 py-1 rounded text-[11px] font-medium transition-all border ${active ? 'bg-purple-500/15 border-purple-500/50 text-purple-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400'}`}>{active ? `Anti-${normalized.keyword} ${normalized.value}+` : 'Anti-X'}</button>
      {showDropdown && !active && (
        <div className="absolute top-full left-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg z-20 p-2 min-w-36">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 px-1">Select keyword</div>
          {UNIT_KEYWORDS.map(kw => <button key={kw} onClick={() => { onChange({ keyword: kw, value: 4 }); setShowDropdown(false); }} className="block w-full text-left px-2 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 rounded transition-colors">{kw}</button>)}
        </div>
      )}
      {active && <select value={normalized.value} onChange={(e) => onChange({ ...normalized, value: parseInt(e.target.value, 10) })} onClick={(e) => e.stopPropagation()} className="ml-1 h-[26px] bg-zinc-800 text-zinc-300 text-xs py-0.5 px-1.5 rounded border border-zinc-700 focus:outline-none focus:border-orange-500">{[2, 3, 4, 5].map(n => <option key={n} value={n}>{n}+</option>)}</select>}
    </div>
  );
}

function WeaponProfileCard({ profile, index, color, onUpdate, onRemove, canRemove }) {
  const [showAbilities, setShowAbilities] = useState(false);
  const hitProb = profile.torrent ? 1 : (7 - profile.bs) / 6;
  const damageStats = parseDice(profile.damage);
  const attackStats = parseDice(profile.attacks);
  
  const activeCount = [profile.torrent, profile.heavy, profile.hitMod !== 0, profile.rerollHits !== 'none', profile.critHitOn < 6, profile.lance, profile.woundMod !== 0, profile.twinLinked, profile.rerollWounds !== 'none', profile.critWoundOn < 6, profile.sustainedHits > 0, profile.lethalHits, profile.devastatingWounds, profile.antiKeyword?.keyword, profile.melta > 0, profile.rapidFire > 0, profile.ignoresCover, profile.blast].filter(Boolean).length;
  
  const abilitySummary = [profile.torrent && 'Torrent', profile.heavy && 'Heavy', profile.hitMod > 0 && `+${profile.hitMod} Hit`, profile.hitMod < 0 && `${profile.hitMod} Hit`, profile.rerollHits === 'ones' && 'RR1 Hit', profile.rerollHits === 'all' && 'RR Hit', profile.critHitOn < 6 && `Crit ${profile.critHitOn}+`, profile.lance && 'Lance', profile.woundMod > 0 && `+${profile.woundMod} Wnd`, profile.woundMod < 0 && `${profile.woundMod} Wnd`, profile.twinLinked && 'Twin', profile.rerollWounds === 'ones' && 'RR1 Wnd', profile.rerollWounds === 'all' && !profile.twinLinked && 'RR Wnd', profile.critWoundOn < 6 && `CritW ${profile.critWoundOn}+`, profile.sustainedHits > 0 && `Sust${profile.sustainedHits}`, profile.lethalHits && 'Lethal', profile.devastatingWounds && 'DevW', profile.antiKeyword?.keyword && `Anti-${profile.antiKeyword.keyword.slice(0,3)}`, profile.melta > 0 && `Melta${profile.melta}`, profile.rapidFire > 0 && `RF${profile.rapidFire}`, profile.ignoresCover && 'IgnCov', profile.blast && 'Blast'].filter(Boolean).join(' · ');
  
  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden relative transition-all group ${profile.active !== false ? 'hover:border-zinc-700' : 'opacity-40 hover:opacity-60'}`}>
      <div className={`absolute top-0 left-0 w-1 h-full transition-opacity ${profile.active !== false ? '' : 'opacity-30'}`} style={{ background: color.bg }} />
      
      <div className="px-4 pl-5 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          {/* Active toggle with label */}
          <button
            onClick={() => onUpdate({ ...profile, active: profile.active === false })}
            className={`flex-shrink-0 flex items-center gap-1.5 px-2 py-1 rounded transition-all ${
              profile.active !== false 
                ? 'bg-green-500/10 text-green-400' 
                : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
            }`}
            title={profile.active !== false ? 'Click to disable' : 'Click to enable'}
          >
            <span className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
              profile.active !== false 
                ? 'border-green-500 bg-green-500/20' 
                : 'border-zinc-600'
            }`}>
              {profile.active !== false && (
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wide">
              {profile.active !== false ? 'Active' : 'Inactive'}
            </span>
          </button>
          <input type="text" value={profile.name} onChange={(e) => onUpdate({ ...profile, name: e.target.value })} className={`flex-1 bg-transparent font-semibold text-base focus:outline-none border-b border-transparent focus:border-zinc-600 transition-colors ${profile.active !== false ? 'text-white' : 'text-zinc-500'}`} placeholder="Weapon name" />
          {canRemove && <button onClick={onRemove} className="text-zinc-600 hover:text-red-400 p-1 transition-colors opacity-0 group-hover:opacity-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>}
        </div>
      </div>
      
      <div className="p-4 pl-5 pr-6 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">Attacks per model</label>
            <div className="flex flex-wrap gap-1.5">
              {['1', '2', '3', '4', '5', 'D3', 'D6'].map(preset => <button key={preset} onClick={() => onUpdate({ ...profile, attacks: preset })} className={`px-2 py-1 rounded font-mono text-xs font-medium transition-all border ${String(profile.attacks) === preset ? 'bg-orange-500/15 border-orange-500/50 text-orange-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400'}`}>{preset}</button>)}
              <input type="text" value={profile.attacks} onChange={(e) => onUpdate({ ...profile, attacks: e.target.value })} className="px-2 py-1 bg-zinc-950 rounded text-white text-xs font-mono border border-zinc-700 focus:border-orange-500 focus:outline-none w-14 text-center" placeholder="2D6" />
            </div>
          </div>
          <div className="flex-shrink-0">
            <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5"># of models</label>
            <Stepper value={profile.modelCount || 1} onChange={(v) => onUpdate({ ...profile, modelCount: v })} min={1} max={100} small />
          </div>
        </div>
        <div className="text-[10px] text-zinc-500 font-mono">{attackStats.variance > 0 ? `≈ ${(attackStats.mean * (profile.modelCount || 1)).toFixed(1)} attacks total (${attackStats.min * (profile.modelCount || 1)}–${attackStats.max * (profile.modelCount || 1)})` : `= ${attackStats.mean * (profile.modelCount || 1)} attacks total`}</div>
        
        <div>
          <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">BS / WS</label>
          <div className="flex rounded-lg overflow-hidden border border-zinc-700">
            {BS_WS_RANGE.map((val) => <button key={val} onClick={() => onUpdate({ ...profile, bs: val })} className={`flex-1 py-1.5 text-xs font-medium transition-all ${profile.bs === val ? 'text-white' : 'bg-zinc-950 text-zinc-500 hover:text-zinc-400 hover:bg-zinc-900'}`} style={profile.bs === val ? { background: color.bg } : {}}>{val}+</button>)}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Stepper label="Strength" value={profile.strength} onChange={(v) => onUpdate({ ...profile, strength: v })} min={1} small />
          <Stepper label="AP" value={profile.ap} onChange={(v) => onUpdate({ ...profile, ap: v })} min={0} showValue={`-${profile.ap}`} small />
        </div>
        
        <div>
          <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">Damage</label>
          <div className="flex flex-wrap gap-1.5">
            {DAMAGE_PRESETS.map(preset => <button key={preset} onClick={() => onUpdate({ ...profile, damage: preset })} className={`px-2 py-1 rounded font-mono text-xs font-medium transition-all border ${profile.damage === preset ? 'bg-orange-500/15 border-orange-500/50 text-orange-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400'}`}>{preset}</button>)}
            <input type="text" value={profile.damage} onChange={(e) => onUpdate({ ...profile, damage: e.target.value })} className="px-2 py-1 bg-zinc-950 rounded text-white text-xs font-mono border border-zinc-700 focus:border-orange-500 focus:outline-none w-14 text-center" placeholder="D6" />
          </div>
          {damageStats.variance > 0 && <div className="text-[10px] text-zinc-500 mt-1 font-mono">≈ {damageStats.mean.toFixed(1)} avg ({damageStats.min}–{damageStats.max})</div>}
        </div>
        
        <div>
          <button onClick={() => setShowAbilities(!showAbilities)} className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-400 transition-colors">
            <svg className={`w-3 h-3 transition-transform ${showAbilities ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span>Weapon Abilities</span>
            {activeCount > 0 && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white" style={{ background: color.bg }}>{activeCount}</span>}
          </button>
          
          {showAbilities && (
            <div className="mt-3 space-y-3 animate-fade-in">
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                <div className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider mb-2">Hit Modifiers</div>
                <div className="flex flex-wrap gap-1.5">
                  <AbilityToggle label="Torrent" active={profile.torrent} onChange={(v) => onUpdate({ ...profile, torrent: v })} color="blue" />
                  <AbilityToggle label="Heavy" active={profile.heavy} onChange={(v) => onUpdate({ ...profile, heavy: v })} color="blue" />
                  <AbilityNumber label="Hit Mod" value={profile.hitMod || 0} onChange={(v) => onUpdate({ ...profile, hitMod: v })} min={-2} max={2} showSign color="blue" />
                  <AbilitySelect label="RR Hits" value={profile.rerollHits || 'none'} onChange={(v) => onUpdate({ ...profile, rerollHits: v })} options={[{ value: 'none', label: 'None' }, { value: 'ones', label: '1s' }, { value: 'all', label: 'All' }]} color="blue" />
                  <AbilitySelect label="Crit On" value={profile.critHitOn || 6} onChange={(v) => onUpdate({ ...profile, critHitOn: v })} options={[{ value: 6, label: '6s' }, { value: 5, label: '5+' }, { value: 4, label: '4+' }]} color="blue" />
                </div>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                <div className="text-[11px] font-semibold text-green-400 uppercase tracking-wider mb-2">Wound Modifiers</div>
                <div className="flex flex-wrap gap-1.5">
                  <AbilityToggle label="Lance" active={profile.lance} onChange={(v) => onUpdate({ ...profile, lance: v })} color="green" />
                  <AbilityToggle label="Twin-Linked" active={profile.twinLinked} onChange={(v) => onUpdate({ ...profile, twinLinked: v })} color="green" />
                  <AbilityNumber label="Wnd Mod" value={profile.woundMod || 0} onChange={(v) => onUpdate({ ...profile, woundMod: v })} min={-2} max={2} showSign color="green" />
                  <AbilitySelect label="RR Wnds" value={profile.rerollWounds || 'none'} onChange={(v) => onUpdate({ ...profile, rerollWounds: v })} options={[{ value: 'none', label: 'None' }, { value: 'ones', label: '1s' }, { value: 'all', label: 'All' }]} color="green" />
                  <AbilitySelect label="Crit Wnd" value={profile.critWoundOn || 6} onChange={(v) => onUpdate({ ...profile, critWoundOn: v })} options={[{ value: 6, label: '6s' }, { value: 5, label: '5+' }, { value: 4, label: '4+' }]} color="green" />
                </div>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                <div className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider mb-2">Critical Abilities</div>
                <div className="flex flex-wrap gap-1.5">
                  <AbilityNumber label="Sust Hits" value={profile.sustainedHits || 0} onChange={(v) => onUpdate({ ...profile, sustainedHits: v })} max={3} color="purple" />
                  <AbilityToggle label="Lethal" active={profile.lethalHits} onChange={(v) => onUpdate({ ...profile, lethalHits: v })} color="purple" />
                  <AbilityToggle label="Dev. Wounds" active={profile.devastatingWounds} onChange={(v) => onUpdate({ ...profile, devastatingWounds: v })} color="purple" />
                  <AntiKeywordSelector value={profile.antiKeyword} onChange={(v) => onUpdate({ ...profile, antiKeyword: v })} />
                </div>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                <div className="text-[11px] font-semibold text-orange-400 uppercase tracking-wider mb-2">Range & Other</div>
                <div className="flex flex-wrap gap-1.5">
                  <AbilityNumber label="Melta" value={profile.melta || 0} onChange={(v) => onUpdate({ ...profile, melta: v })} max={4} color="orange" />
                  <AbilityNumber label="Rapid Fire" value={profile.rapidFire || 0} onChange={(v) => onUpdate({ ...profile, rapidFire: v })} max={4} color="orange" />
                  <AbilityToggle label="Ign. Cover" active={profile.ignoresCover} onChange={(v) => onUpdate({ ...profile, ignoresCover: v })} color="orange" />
                  <AbilityToggle label="Blast" active={profile.blast} onChange={(v) => onUpdate({ ...profile, blast: v })} color="orange" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="px-5 pr-6 py-3 bg-zinc-950 border-t border-zinc-800">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
          <span className="text-zinc-500"><span className="text-zinc-400 font-mono">{attackStats.variance > 0 ? `≈${(attackStats.mean * (profile.modelCount || 1)).toFixed(1)}` : `${attackStats.mean * (profile.modelCount || 1)}`}</span> attacks</span>
          <span className="text-zinc-500"><span className="text-zinc-400 font-mono">{profile.torrent ? '100' : `${(hitProb * 100).toFixed(0)}`}%</span> to hit</span>
          <span className="text-zinc-500"><span className="text-zinc-400 font-mono">{damageStats.mean.toFixed(1)}</span> dmg{damageStats.variance > 0 && <span className="text-zinc-600"> ±{Math.sqrt(damageStats.variance).toFixed(1)}</span>}</span>
        </div>
        {abilitySummary && <div className="mt-1.5 text-[10px] truncate" style={{ color: color.bg }} title={abilitySummary}>{abilitySummary}</div>}
      </div>
    </div>
  );
}

export default WeaponProfileCard;