import { useEffect, useState } from 'react';

function Stepper({ value, onChange, min = 0, max = Infinity, label, showValue, small = false }) {
  const numericValue = Number.isFinite(value) ? value : (typeof value === 'number' ? value : 0);
  const isEditable = showValue === undefined || showValue === null;
  const clamp = (n) => Math.min(max, Math.max(min, n));

  const [text, setText] = useState(String(numericValue));

  useEffect(() => {
    if (!isEditable) return;
    setText(String(numericValue));
  }, [numericValue, isEditable]);

  const commit = (raw) => {
    if (!isEditable) return;
    if (raw === '' || raw === '-' || raw === '+') { setText(String(numericValue)); return; }
    const n = Number(raw);
    if (!Number.isFinite(n)) { setText(String(numericValue)); return; }
    const next = clamp(n);
    setText(String(next));
    onChange(next);
  };

  const btnClass = small ? 'px-2.5 py-1 text-sm' : 'px-3 py-1.5 text-base';
  const inputClass = small ? 'w-10 py-1 text-sm' : 'w-12 py-1.5 text-base';

  return (
    <div>
      {label && <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">{label}</label>}
      <div className="flex items-center">
        <button type="button" onClick={() => onChange(clamp(numericValue - 1))} className={`${btnClass} bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 rounded-l-lg text-zinc-400 font-medium transition-all`}>−</button>
        {isEditable ? (
          <input type="text" inputMode="numeric" value={text} onChange={(e) => /^[+-]?\d*$/.test(e.target.value) && setText(e.target.value)} onBlur={() => commit(text)} onKeyDown={(e) => { if (e.key === 'Enter') commit(text); if (e.key === 'Escape') setText(String(numericValue)); }} className={`${inputClass} bg-zinc-900 text-center text-white font-mono font-bold border-y border-zinc-700 focus:outline-none focus:border-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`} />
        ) : (
          <div className={`${inputClass} bg-zinc-900 text-center text-white font-mono font-bold border-y border-zinc-700 flex items-center justify-center`}>{showValue}</div>
        )}
        <button type="button" onClick={() => onChange(clamp(numericValue + 1))} className={`${btnClass} bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 rounded-r-lg text-zinc-400 font-medium transition-all`}>+</button>
      </div>
    </div>
  );
}

export default Stepper;
