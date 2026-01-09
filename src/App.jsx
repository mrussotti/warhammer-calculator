import { useState } from 'react';
import { useProfiles } from './hooks';
import { WeaponProfileList } from './components/weapons';
import { DamageAnalysisTab, TargetUnitTab } from './components/tabs';

/**
 * Warhammer 40K Damage Calculator
 * 
 * Main application component that orchestrates:
 * - Weapon profile management
 * - Tab navigation between analysis views
 */
function Warhammer40KDamageCalculator() {
  const [activeTab, setActiveTab] = useState('analysis');
  const { profiles, addProfile, updateProfile, removeProfile } = useProfiles();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-6">
      {/* Header */}
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-orange-400">
        Warhammer 40K Damage Calculator
      </h1>
      
      {/* Weapon Profiles Section */}
      <WeaponProfileList
        profiles={profiles}
        onAddProfile={addProfile}
        onUpdateProfile={updateProfile}
        onRemoveProfile={removeProfile}
      />
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-700 mb-6">
        <div className="flex gap-1">
          <TabButton
            active={activeTab === 'analysis'}
            onClick={() => setActiveTab('analysis')}
            icon="📊"
            label="Damage Analysis"
          />
          <TabButton
            active={activeTab === 'target'}
            onClick={() => setActiveTab('target')}
            icon="🎯"
            label="Target Unit"
          />
        </div>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'analysis' && <DamageAnalysisTab profiles={profiles} />}
      {activeTab === 'target' && <TargetUnitTab profiles={profiles} />}
    </div>
  );
}

/**
 * TabButton - Styled tab navigation button
 */
function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 font-medium transition-colors rounded-t-lg ${
        active
          ? 'bg-gray-800 text-orange-400 border-b-2 border-orange-400'
          : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
      }`}
    >
      {icon} {label}
    </button>
  );
}

export default Warhammer40KDamageCalculator;