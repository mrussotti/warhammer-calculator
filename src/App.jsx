import { useState } from 'react';
import { useUnits } from './hooks';
import { UnitList } from './components/units';
import { DamageAnalysisTab, TargetUnitTab } from './components/tabs';

function Warhammer40KDamageCalculator() {
  const [activeTab, setActiveTab] = useState('target'); // Start on Target tab - more useful with no weapons
  const { 
    units, 
    addUnitWithData,  // NEW: primary way to add units
    updateUnit, 
    removeUnit, 
    duplicateUnit,
    addProfile, 
    setUnitProfiles,
    updateProfile, 
    removeProfile,
    allProfiles,
  } = useUnits();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-6 lg:p-8">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-1/2 -left-1/4 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.08),transparent_70%)]" />
        <div className="absolute -bottom-1/2 -right-1/4 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.05),transparent_70%)]" />
      </div>
      
      <div className="relative max-w-[1600px] mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Damage Calculator
              </h1>
              <p className="text-sm text-zinc-500">Warhammer 40K 10th Edition</p>
            </div>
          </div>
        </header>
        
        {/* Army List Section */}
        <section className="mb-8">
          <UnitList
            units={units}
            onAddUnitWithData={addUnitWithData}
            onUpdateUnit={updateUnit}
            onRemoveUnit={removeUnit}
            onDuplicateUnit={duplicateUnit}
            onAddProfile={addProfile}
            onSetProfiles={setUnitProfiles}
            onUpdateProfile={updateProfile}
            onRemoveProfile={removeProfile}
          />
        </section>
        
        {/* Tab Navigation */}
        <div className="flex gap-1 border-b border-zinc-800 mb-6">
          <TabButton active={activeTab === 'target'} onClick={() => setActiveTab('target')} icon={<TargetIcon />} label="Target Unit" />
          <TabButton active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} icon={<AnalysisIcon />} label="Damage Analysis" />
        </div>
        
        {/* Tab Content */}
        <main>
          {activeTab === 'target' && <TargetUnitTab profiles={allProfiles} units={units} />}
          {activeTab === 'analysis' && <DamageAnalysisTab profiles={allProfiles} units={units} />}
        </main>
        
        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-zinc-800 text-center">
          <p className="text-xs text-zinc-600">Built for the competitive 40K community</p>
        </footer>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors relative ${
        active ? 'text-orange-500' : 'text-zinc-500 hover:text-zinc-300'
      }`}
    >
      <span className={active ? 'text-orange-500' : 'text-zinc-600'}>{icon}</span>
      {label}
      {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-t" />}
    </button>
  );
}

function AnalysisIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18 9l-5 5-4-4-3 3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  );
}

export default Warhammer40KDamageCalculator;