import WeaponProfileCard from './WeaponProfileCard';
import { PROFILE_COLORS } from '../../utils/constants';

/**
 * WeaponProfileList - Container for managing multiple weapon profiles
 */
function WeaponProfileList({ profiles, onAddProfile, onUpdateProfile, onRemoveProfile }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-300">Weapon Profiles</h2>
        <button
          onClick={onAddProfile}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300 transition-colors"
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
