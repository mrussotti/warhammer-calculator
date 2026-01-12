import WeaponProfileCard from './WeaponProfileCard';
import { PROFILE_COLORS } from '../../utils/constants';

function WeaponProfileList({ profiles, onAddProfile, onUpdateProfile, onRemoveProfile }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Weapon Profiles</h2>
          <p className="text-xs text-zinc-500">Configure your attacking units</p>
        </div>
        <button
          onClick={onAddProfile}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 hover:border-orange-500/50 rounded-lg text-sm font-medium text-orange-500 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Weapon
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {profiles.map((profile, index) => (
          <WeaponProfileCard
            key={profile.id}
            profile={profile}
            index={index}
            color={PROFILE_COLORS[index % PROFILE_COLORS.length]}
            onUpdate={(updated) => onUpdateProfile(profile.id, updated)}
            onRemove={() => onRemoveProfile(profile.id)}
            canRemove={profiles.length > 1}
          />
        ))}
      </div>
    </div>
  );
}

export default WeaponProfileList;
