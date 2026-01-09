import { useState, useMemo } from 'react';
import { calculateCombinedDamage } from '../../utils/damageCalculations';
import { TARGET_PRESETS, DEFAULT_TARGET } from '../../utils/constants';
import { Stepper } from '../ui';
import { 
  ModelKillDisplay, 
  AttackFlowDiagram, 
  DamageDistribution, 
  DamageBreakdown 
} from '../visualization';

/**
 * TargetUnitTab - Configure a specific target unit and see expected kills
 */
function TargetUnitTab({ profiles }) {
  const [target, setTarget] = useState(DEFAULT_TARGET);
  
  const combinedData = useMemo(() => {
    return calculateCombinedDamage(
      profiles, 
      target.toughness, 
      target.save, 
      target.wounds, 
      target.models
    );
  }, [profiles, target]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Target configuration */}
      <div className="space-y-6">
        {/* Target unit selector */}
        <div className="bg-gray-800 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-gray-300 mb-4">Target Unit</h3>
          
          {/* Presets */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-2">Presets</label>
            <div className="flex flex-wrap gap-2">
              {TARGET_PRESETS.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => setTarget({ 
                    ...target, 
                    toughness: preset.t, 
                    save: preset.sv, 
                    wounds: preset.w, 
                    models: preset.m, 
                    name: preset.name 
                  })}
                  className={`px-3 py-1.5 rounded text-sm transition-colors ${
                    target.name === preset.name
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Manual config */}
          <div className="grid grid-cols-2 gap-4">
            {/* Toughness selector */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Toughness</label>
              <div className="flex">
                {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((val, i) => (
                  <button
                    key={val}
                    onClick={() => setTarget({ ...target, toughness: val, name: '' })}
                    className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                      i === 0 ? 'rounded-l' : ''
                    } ${i === 9 ? 'rounded-r' : ''} ${
                      target.toughness === val
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Save selector */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Save</label>
              <div className="flex">
                {[2, 3, 4, 5, 6, 7].map((val, i) => (
                  <button
                    key={val}
                    onClick={() => setTarget({ ...target, save: val, name: '' })}
                    className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                      i === 0 ? 'rounded-l' : ''
                    } ${i === 5 ? 'rounded-r' : ''} ${
                      target.save === val
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    {val <= 6 ? `${val}+` : '—'}
                  </button>
                ))}
              </div>
            </div>
            
            <Stepper
              label="Wounds / Model"
              value={target.wounds}
              onChange={(v) => setTarget({ ...target, wounds: v, name: '' })}
              min={1}
              max={30}
            />
            
            <Stepper
              label="Models"
              value={target.models}
              onChange={(v) => setTarget({ ...target, models: v, name: '' })}
              min={1}
              max={30}
            />
          </div>
          
          {/* Total wound pool */}
          <div className="mt-4 pt-4 border-t border-gray-700 text-sm text-gray-400">
            <span className="text-gray-500">Total wound pool:</span>{' '}
            <span className="text-white font-bold">{target.wounds * target.models}</span> wounds
          </div>
        </div>
        
        <AttackFlowDiagram data={combinedData} profiles={profiles} />
      </div>
      
      {/* Results */}
      <div className="space-y-6">
        {/* Big result card */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-sm text-gray-400">Target</div>
              <div className="text-2xl font-bold text-white">
                {target.name || `T${target.toughness}/${target.save <= 6 ? target.save + '+' : '—'}/${target.wounds}W`}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                T{target.toughness} · {target.save <= 6 ? `${target.save}+ Save` : 'No Save'} · {target.wounds}W × {target.models}
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-orange-400">
                {combinedData.total.expectedKills?.toFixed(1) || '0'}
              </div>
              <div className="text-sm text-gray-400">models killed</div>
            </div>
          </div>
          
          {/* Model visualization */}
          <div className="pt-4 border-t border-gray-700">
            <div className="text-xs text-gray-500 mb-3">Expected Result</div>
            <ModelKillDisplay 
              kills={combinedData.total.expectedKills || 0} 
              total={target.models}
              woundsPerModel={target.wounds}
            />
          </div>
          
          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-700 text-center">
            <div>
              <div className="text-xl font-bold text-gray-300">
                {combinedData.total.expected.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">Damage</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-300">
                ±{combinedData.total.stdDev.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">Std Dev</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-300">
                {Math.round((combinedData.total.expectedKills || 0) / target.models * 100)}%
              </div>
              <div className="text-xs text-gray-500">Unit Killed</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-300">
                {((combinedData.total.expectedKills || 0) >= target.models) ? '✓' : '✗'}
              </div>
              <div className="text-xs text-gray-500">Wipes Unit</div>
            </div>
          </div>
        </div>
        
        <DamageDistribution 
          expected={combinedData.total.expected} 
          stdDev={combinedData.total.stdDev} 
        />
        
        <DamageBreakdown 
          breakdown={combinedData.breakdown} 
          totalExpected={combinedData.total.expected} 
        />
      </div>
    </div>
  );
}

export default TargetUnitTab;
