import React, { useEffect, useMemo, useState } from 'react';

/**
 * Stepper - Increment/decrement number input with optional label
 *
 * Props:
 *  - value: number
 *  - onChange: (nextNumber) => void
 *  - min/max: clamp bounds
 *  - label: string
 *  - showValue: if provided, renders a non-editable display value (keeps old behavior)
 *  - small: compact sizing
 */
function Stepper({ value, onChange, min = 0, max = Infinity, label, showValue, small = false }) {
  const numericValue = Number.isFinite(value) ? value : (typeof value === 'number' ? value : 0);

  // When showValue is provided, keep this as a display-only stepper (backwards compatible).
  const isEditable = showValue === undefined || showValue === null;

  const clamp = (n) => Math.min(max, Math.max(min, n));

  const [text, setText] = useState(String(numericValue));

  // Keep local text in sync when the external value changes (e.g., plus/minus click).
  useEffect(() => {
    if (!isEditable) return;
    setText(String(numericValue));
  }, [numericValue, isEditable]);

  const commit = (raw) => {
    if (!isEditable) return;

    // Allow the user to temporarily clear the field while typing;
    // on commit, revert to the last valid value.
    if (raw === '' || raw === '-' || raw === '+') {
      setText(String(numericValue));
      return;
    }

    const n = Number(raw);
    if (!Number.isFinite(n)) {
      setText(String(numericValue));
      return;
    }

    const next = clamp(n);
    setText(String(next));
    onChange(next);
  };

  const onTextChange = (e) => {
    const raw = e.target.value;

    // Allow intermediate states like '' and '-' while typing.
    if (/^[+-]?\d*$/.test(raw)) {
      setText(raw);
    }
  };

  const inputClasses = useMemo(() => {
    const base = `${small ? 'w-10 py-1 text-sm' : 'w-12 py-1.5'} bg-gray-900 text-center text-white font-bold border-y border-gray-600`;
    // Remove native number spinners in most browsers
    return `${base} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`;
  }, [small]);

  return (
    <div>
      {label && <label className="block text-xs text-gray-500 mb-1">{label}</label>}

      <div className="flex items-center">
        <button
          type="button"
          onClick={() => onChange(clamp(numericValue - 1))}
          className={`${small ? 'px-2 py-1 text-sm' : 'px-3 py-1.5'} bg-gray-700 hover:bg-gray-600 rounded-l text-gray-300 font-medium transition-colors`}
          aria-label="Decrement"
        >
          −
        </button>

        {isEditable ? (
          <input
            type="text"
            inputMode="numeric"
            value={text}
            onChange={onTextChange}
            onBlur={() => commit(text)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit(text);
              if (e.key === 'Escape') setText(String(numericValue));
            }}
            className={inputClasses}
            aria-label={label || 'Value'}
          />
        ) : (
          <div className={inputClasses}>
            {showValue}
          </div>
        )}

        <button
          type="button"
          onClick={() => onChange(clamp(numericValue + 1))}
          className={`${small ? 'px-2 py-1 text-sm' : 'px-3 py-1.5'} bg-gray-700 hover:bg-gray-600 rounded-r text-gray-300 font-medium transition-colors`}
          aria-label="Increment"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default Stepper;
