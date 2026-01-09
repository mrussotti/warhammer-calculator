/**
 * Stepper - Increment/decrement number input with optional label
 */
function Stepper({ value, onChange, min = 0, max = Infinity, label, showValue, small = false }) {
  return (
    <div>
      {label && <label className="block text-xs text-gray-500 mb-1">{label}</label>}
      <div className="flex items-center">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className={`${small ? 'px-2 py-1 text-sm' : 'px-3 py-1.5'} bg-gray-700 hover:bg-gray-600 rounded-l text-gray-300 font-medium transition-colors`}
        >
          −
        </button>
        <div className={`${small ? 'w-10 py-1 text-sm' : 'w-12 py-1.5'} bg-gray-900 text-center text-white font-bold border-y border-gray-600`}>
          {showValue || value}
        </div>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className={`${small ? 'px-2 py-1 text-sm' : 'px-3 py-1.5'} bg-gray-700 hover:bg-gray-600 rounded-r text-gray-300 font-medium transition-colors`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default Stepper;
