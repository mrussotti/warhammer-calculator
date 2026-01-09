import { useState, useMemo } from 'react';
import { calculateCombinedDamage, getHeatmapColor } from '../../utils/damageCalculations';
import { TOUGHNESS_RANGE, SAVE_RANGE } from '../../utils/constants';
import { AttackFlowDiagram, DamageDistribution } from '../visualization';

/**
 * DamageAnalysisTab - Heatmap view showing damage across T/Sv combinations
 */
function DamageAnalysisTab({ profiles }) {
  const [showMode, setShowMode] = useState('expected');
  const [hoveredCell, setHoveredCell] = useState(null);
  const [selectedCell, setSelectedCell] = useState({ toughness: 5, save: 3 });
  
  // Generate heatmap data for all T/Sv combinations
  const heatmapData = useMemo(() => {
    const data = [];
    let maxExpected = 0;
    let maxStdDev = 0;
    
    for (const t of TOUGHNESS_RANGE) {
      const row = [];
      for (const sv of SAVE_RANGE) {
        const combined = calculateCombinedDamage(profiles, t, sv);
        row.push({ 
          ...combined.total, 
          toughness: t, 
          save: sv,
          breakdown: combined.breakdown 
        });
        maxExpected = Math.max(maxExpected, combined.total.expected);
        maxStdDev = Math.max(maxStdDev, combined.total.stdDev);
      }
      data.push(row);
    }
    
    return { data, maxExpected, maxStdDev };
  }, [profiles]);
  
  const displayCell = hoveredCell || selectedCell;
  const combinedData = useMemo(() => {
    return calculateCombinedDamage(profiles, displayCell.toughness, displayCell.save);
  }, [profiles, displayCell]);
  
  const getValue = (cell) => {
    switch (showMode) {
      case 'expected': return cell.expected;
      case 'stddev': return cell.stdDev;
      case 'cv': return cell.expected > 0 ? (cell.stdDev / cell.expected) : 0;
      default: return cell.expected;
    }
  };
  
  const getMax = () => {
    switch (showMode) {
      case 'expected': return heatmapData.maxExpected;
      case 'stddev': return heatmapData.maxStdDev;
      case 'cv': return 1;
      default: return heatmapData.maxExpected;
    }
  };
  
  const formatValue = (val) => {
    if (showMode === 'cv') return (val * 100).toFixed(0) + '%';
    return val.toFixed(1);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Heatmap */}
      <div>
        {/* Mode toggles */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: 'expected', label: 'Expected Damage' },
            { key: 'stddev', label: 'Std Deviation' },
            { key: 'cv', label: 'CV (σ/μ)' },
          ].map(mode => (
            <button
              key={mode.key}
              onClick={() => setShowMode(mode.key)}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                showMode === mode.key 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
        
        {/* Heatmap table */}
        <div className="bg-gray-800 rounded-lg p-4 overflow-x-auto">
          <h2 className="text-lg font-semibold text-gray-300 mb-4">
            {showMode === 'expected' && 'Expected Damage'}
            {showMode === 'stddev' && 'Standard Deviation'}
            {showMode === 'cv' && 'Coefficient of Variation (Swinginess)'}
          </h2>
          
          <table className="border-collapse w-full">
            <thead>
              <tr>
                <th className="p-2 text-sm text-gray-500 font-normal">T↓ Sv→</th>
                {SAVE_RANGE.map(sv => (
                  <th key={sv} className="p-2 text-sm text-gray-400 font-medium min-w-12">
                    {sv <= 6 ? `${sv}+` : '—'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapData.data.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  <td className="p-2 text-sm text-gray-400 font-medium">
                    {TOUGHNESS_RANGE[rowIdx]}
                  </td>
                  {row.map((cell, colIdx) => {
                    const value = getValue(cell);
                    const max = getMax();
                    const isHovered = hoveredCell?.toughness === cell.toughness && hoveredCell?.save === cell.save;
                    const isSelected = !hoveredCell && selectedCell.toughness === cell.toughness && selectedCell.save === cell.save;
                    
                    return (
                      <td
                        key={colIdx}
                        className={`p-2 text-center text-sm font-mono cursor-pointer transition-all duration-150 ${
                          isSelected ? 'ring-2 ring-orange-400 ring-inset' : ''
                        } ${isHovered ? 'ring-2 ring-white/50 ring-inset' : ''}`}
                        style={{
                          backgroundColor: getHeatmapColor(value, max),
                          color: value > max * 0.4 ? '#fff' : '#1f2937',
                        }}
                        onMouseEnter={() => setHoveredCell(cell)}
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() => setSelectedCell({ toughness: cell.toughness, save: cell.save })}
                      >
                        {formatValue(value)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          
          <p className="text-xs text-gray-500 mt-3">Hover to preview · Click to select</p>
        </div>
      </div>
      
      {/* Details panel */}
      <div className="space-y-6">
        {/* Selected cell stats */}
        <div className="bg-gray-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-400">Target Profile</div>
              <div className="text-xl font-bold text-white">
                T{displayCell.toughness} / {displayCell.save <= 6 ? `${displayCell.save}+ Save` : 'No Save'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-orange-400">
                {combinedData.total.expected.toFixed(1)}
              </div>
              <div className="text-sm text-gray-400">expected damage</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
            <div>
              <div className="text-2xl font-bold text-gray-300">
                ±{combinedData.total.stdDev.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">Std Deviation</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-300">
                {combinedData.total.expected > 0 
                  ? ((combinedData.total.stdDev / combinedData.total.expected) * 100).toFixed(0) + '%'
                  : '—'}
              </div>
              <div className="text-xs text-gray-500">CV (Variance)</div>
            </div>
          </div>
        </div>
        
        <AttackFlowDiagram data={combinedData} profiles={profiles} />
        <DamageDistribution expected={combinedData.total.expected} stdDev={combinedData.total.stdDev} />
      </div>
    </div>
  );
}

export default DamageAnalysisTab;
