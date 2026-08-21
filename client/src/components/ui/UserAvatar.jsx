import React, { useState } from 'react';
import { AVATAR_MAP, GenericNeutral } from './avatars/avatarLibrary';

/**
 * Normalizes input role/type strings into supported avatar roles
 */
function normalizeRole(role = '') {
  const r = String(role).toLowerCase().trim();
  if (r.includes('student') || r.includes('applicant')) return 'student';
  if (r.includes('teacher') || r.includes('faculty') || r.includes('instructor')) return 'teacher';
  if (r.includes('admin') || r.includes('principal') || r.includes('head')) return 'admin';
  if (r.includes('parent') || r.includes('guardian')) return 'parent';
  if (r.includes('staff')) return 'staff';
  return 'student'; // Default fallback
}

/**
 * Normalizes input gender values ('male', 'female', 'M', 'F', etc.)
 */
function normalizeGender(gender = '') {
  if (!gender) return 'neutral';
  const g = String(gender).toLowerCase().trim();
  if (g === 'male' || g === 'm' || g === 'boy' || g === 'man') return 'male';
  if (g === 'female' || g === 'f' || g === 'girl' || g === 'woman') return 'female';
  return 'neutral';
}

/**
 * Deterministic hash function to map user identifier to an avatar index
 */
function getDeterministicIndex(seed = '', count = 1) {
  if (!seed || count <= 1) return 0;
  const str = String(seed);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % count;
}

const SIZE_MAP = {
  xs: 'w-6 h-6 min-w-[24px] min-h-[24px] text-[10px]',
  sm: 'w-8 h-8 min-w-[32px] min-h-[32px] text-xs',
  md: 'w-10 h-10 min-w-[40px] min-h-[40px] text-sm',
  lg: 'w-14 h-14 min-w-[56px] min-h-[56px] text-base',
  xl: 'w-20 h-20 min-w-[80px] min-h-[80px] text-xl',
  '2xl': 'w-24 h-24 min-w-[96px] min-h-[96px] text-2xl',
};

const STATUS_COLOR_MAP = {
  online: 'bg-emerald-500',
  offline: 'bg-slate-400',
  busy: 'bg-rose-500',
  away: 'bg-amber-500',
};

export default function UserAvatar({
  src,
  avatar,
  photo,
  image,
  role,
  type,
  gender,
  id,
  _id,
  userId,
  admissionNo,
  employeeId,
  name = '',
  firstName = '',
  lastName = '',
  size = 'md',
  status,
  ring = false,
  className = '',
  onClick,
  alt,
  ...props
}) {
  const [imgError, setImgError] = useState(false);

  // 1. Resolve photo url if exists
  const photoUrl = !imgError && (src || avatar || photo || image);

  // 2. Resolve display name & identifier for deterministic avatar selection
  const fullName = name || [firstName, lastName].filter(Boolean).join(' ') || 'User';
  const seed = id || _id || userId || admissionNo || employeeId || fullName;

  // 3. Resolve role and gender
  const resolvedRole = normalizeRole(type || role);
  const resolvedGender = normalizeGender(gender);

  // 4. Select illustrated avatar component
  const roleAvatars = AVATAR_MAP[resolvedRole] || AVATAR_MAP.student;
  const genderAvatars = roleAvatars[resolvedGender] || roleAvatars.neutral || roleAvatars.male || [GenericNeutral];
  const avatarIndex = getDeterministicIndex(seed, genderAvatars.length);
  const IllustratedAvatar = genderAvatars[avatarIndex] || GenericNeutral;

  // Size styling
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;
  const ringClass = ring === true ? 'ring-2 ring-forest/20' : ring || '';

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden select-none transition-transform ${sizeClass} ${ringClass} ${className}`}
      onClick={onClick}
      title={fullName}
      {...props}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={alt || fullName}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <IllustratedAvatar className="w-full h-full" />
      )}

      {/* Optional Status Badge */}
      {status && STATUS_COLOR_MAP[status] && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-2 ring-white ${STATUS_COLOR_MAP[status]} ${
            size === 'xs' || size === 'sm' ? 'w-2 h-2' : size === 'lg' || size === 'xl' || size === '2xl' ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'
          }`}
        />
      )}
    </div>
  );
}

export { UserAvatar };
