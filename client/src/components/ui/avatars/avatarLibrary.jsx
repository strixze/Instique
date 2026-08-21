import React from 'react';

/**
 * Instique Illustrated Avatar Vector Library
 * Clean, modern, pastel-toned illustrated SVG avatars with consistent geometry and proportions.
 */

// ── Shared SVG Helper Elements ──
const BaseSvg = ({ children, bg = '#E0F2FE', className = '' }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-full h-full rounded-full select-none ${className}`}
  >
    {/* Circular Background */}
    <circle cx="50" cy="50" r="50" fill={bg} />
    {children}
  </svg>
);

/* ─────────────────────────────────────────────────────────────
 * 1. STUDENT MALE AVATARS (Youthful, School Attire)
 * ───────────────────────────────────────────────────────────── */

export const StudentMale01 = ({ className }) => (
  <BaseSvg bg="#E0F2FE" className={className}>
    {/* Shoulders / School Shirt & Tie */}
    <path d="M18 96 C24 76 34 72 50 72 C66 72 76 76 82 96 Z" fill="#FFFFFF" />
    <path d="M18 96 C24 76 34 72 50 72 C66 72 76 76 82 96 Z" stroke="#CBD5E1" strokeWidth="1.5" />
    {/* Collar */}
    <path d="M38 72 L50 82 L42 72 Z" fill="#2D6A4F" />
    <path d="M62 72 L50 82 L58 72 Z" fill="#2D6A4F" />
    {/* Tie */}
    <path d="M47 80 L53 80 L55 96 L45 96 Z" fill="#1B4332" />
    {/* Neck */}
    <rect x="44" y="60" width="12" height="14" rx="4" fill="#FBD5B5" />
    {/* Head & Ears */}
    <circle cx="34" cy="46" r="4.5" fill="#FBD5B5" />
    <circle cx="66" cy="46" r="4.5" fill="#FBD5B5" />
    <rect x="35" y="28" width="30" height="34" rx="14" fill="#FCDDC2" />
    {/* Facial Features */}
    {/* Eyes */}
    <circle cx="43" cy="45" r="2.2" fill="#1E293B" />
    <circle cx="57" cy="45" r="2.2" fill="#1E293B" />
    <circle cx="43.8" cy="44.2" r="0.7" fill="#FFFFFF" />
    <circle cx="57.8" cy="44.2" r="0.7" fill="#FFFFFF" />
    {/* Eyebrows */}
    <path d="M40 40 Q43 38 46 40" stroke="#332211" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M54 40 Q57 38 60 40" stroke="#332211" strokeWidth="1.5" strokeLinecap="round" />
    {/* Smile */}
    <path d="M46 53 Q50 57 54 53" stroke="#C2410C" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Cheeks */}
    <circle cx="40" cy="49" r="2.5" fill="#FCA5A5" fillOpacity="0.4" />
    <circle cx="60" cy="49" r="2.5" fill="#FCA5A5" fillOpacity="0.4" />
    {/* Hair (Neat Side-Parted) */}
    <path d="M33 36 C33 22 42 16 50 16 C62 16 67 24 67 34 C67 36 65 37 63 35 C59 31 52 28 42 30 C37 31 34 34 33 36 Z" fill="#3D2314" />
  </BaseSvg>
);

export const StudentMale02 = ({ className }) => (
  <BaseSvg bg="#FEF3C7" className={className}>
    {/* Shoulders / Sweater Vest over Shirt */}
    <path d="M18 96 C24 76 34 72 50 72 C66 72 76 76 82 96 Z" fill="#1E3A8A" />
    <path d="M40 72 L50 84 L60 72 Z" fill="#FFFFFF" />
    <path d="M47 79 L53 79 L54 96 L46 96 Z" fill="#B91C1C" />
    {/* Neck */}
    <rect x="44" y="60" width="12" height="14" rx="4" fill="#E2A77A" />
    {/* Head & Ears */}
    <circle cx="34" cy="46" r="4.5" fill="#E2A77A" />
    <circle cx="66" cy="46" r="4.5" fill="#E2A77A" />
    <rect x="35" y="28" width="30" height="34" rx="14" fill="#F0B78B" />
    {/* Eyes & Specs (Smart Student) */}
    <circle cx="43" cy="45" r="2.2" fill="#1E293B" />
    <circle cx="57" cy="45" r="2.2" fill="#1E293B" />
    {/* Smile */}
    <path d="M46 54 Q50 58 54 54" stroke="#9A3412" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Hair (Wavy textured mop) */}
    <path d="M32 35 C32 20 40 15 50 15 C60 15 68 20 68 35 C64 30 58 26 50 26 C42 26 36 30 32 35 Z" fill="#1F2937" />
    <path d="M44 19 C48 15 54 16 57 19" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
  </BaseSvg>
);

export const StudentMale03 = ({ className }) => (
  <BaseSvg bg="#DCFCE7" className={className}>
    {/* Shoulders / Polo Uniform */}
    <path d="M18 96 C24 76 34 72 50 72 C66 72 76 76 82 96 Z" fill="#15803D" />
    <path d="M44 72 L50 78 L56 72 Z" fill="#FFFFFF" />
    {/* Neck */}
    <rect x="44" y="60" width="12" height="14" rx="4" fill="#C68642" />
    {/* Head & Ears */}
    <circle cx="34" cy="46" r="4.5" fill="#C68642" />
    <circle cx="66" cy="46" r="4.5" fill="#C68642" />
    <rect x="35" y="28" width="30" height="34" rx="14" fill="#D39353" />
    {/* Eyes */}
    <circle cx="43" cy="45" r="2.2" fill="#111827" />
    <circle cx="57" cy="45" r="2.2" fill="#111827" />
    {/* Smile */}
    <path d="M45 53 Q50 58 55 53" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Hair (Neat Short Crop) */}
    <path d="M33 34 C33 22 41 17 50 17 C59 17 67 22 67 34 C63 32 57 30 50 30 C43 30 37 32 33 34 Z" fill="#1C1917" />
  </BaseSvg>
);

export const StudentMale04 = ({ className }) => (
  <BaseSvg bg="#F3E8FF" className={className}>
    {/* Shoulders / School Cardigan */}
    <path d="M18 96 C24 76 34 72 50 72 C66 72 76 76 82 96 Z" fill="#6B21A8" />
    <path d="M42 72 L50 82 L58 72 Z" fill="#E9D5FF" />
    {/* Neck */}
    <rect x="44" y="60" width="12" height="14" rx="4" fill="#FBD5B5" />
    {/* Head & Ears */}
    <circle cx="34" cy="46" r="4.5" fill="#FBD5B5" />
    <circle cx="66" cy="46" r="4.5" fill="#FBD5B5" />
    <rect x="35" y="28" width="30" height="34" rx="14" fill="#FCDDC2" />
    {/* Student Glasses */}
    <rect x="38" y="40" width="10" height="9" rx="3" fill="none" stroke="#581C87" strokeWidth="1.6" />
    <rect x="52" y="40" width="10" height="9" rx="3" fill="none" stroke="#581C87" strokeWidth="1.6" />
    <path d="M48 44 L52 44" stroke="#581C87" strokeWidth="1.6" />
    {/* Eyes */}
    <circle cx="43" cy="44.5" r="1.8" fill="#1E293B" />
    <circle cx="57" cy="44.5" r="1.8" fill="#1E293B" />
    {/* Smile */}
    <path d="M46 54 Q50 57 54 54" stroke="#C2410C" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Curly Hairstyle */}
    <circle cx="36" cy="25" r="7" fill="#451A03" />
    <circle cx="50" cy="20" r="8" fill="#451A03" />
    <circle cx="64" cy="25" r="7" fill="#451A03" />
    <circle cx="42" cy="21" r="7" fill="#451A03" />
    <circle cx="58" cy="21" r="7" fill="#451A03" />
  </BaseSvg>
);

export const StudentMale05 = ({ className }) => (
  <BaseSvg bg="#FFE4E6" className={className}>
    {/* Shoulders / School Uniform with Red Stripe */}
    <path d="M18 96 C24 76 34 72 50 72 C66 72 76 76 82 96 Z" fill="#0F172A" />
    <path d="M40 72 L50 82 L60 72 Z" fill="#FFFFFF" />
    <path d="M48 80 L52 80 L53 96 L47 96 Z" fill="#E11D48" />
    {/* Neck */}
    <rect x="44" y="60" width="12" height="14" rx="4" fill="#ECC5A8" />
    {/* Head & Ears */}
    <circle cx="34" cy="46" r="4.5" fill="#ECC5A8" />
    <circle cx="66" cy="46" r="4.5" fill="#ECC5A8" />
    <rect x="35" y="28" width="30" height="34" rx="14" fill="#F5D0B5" />
    {/* Eyes */}
    <circle cx="43" cy="45" r="2.2" fill="#0F172A" />
    <circle cx="57" cy="45" r="2.2" fill="#0F172A" />
    <circle cx="43.8" cy="44.2" r="0.7" fill="#FFFFFF" />
    <circle cx="57.8" cy="44.2" r="0.7" fill="#FFFFFF" />
    {/* Smile */}
    <path d="M45 53 Q50 58 55 53" stroke="#BE123C" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Hair (Sleek Fringe) */}
    <path d="M33 34 C33 21 41 16 50 16 C60 16 67 21 67 34 C63 29 55 26 44 28 C38 29 35 32 33 34 Z" fill="#292524" />
  </BaseSvg>
);

export const StudentMale06 = ({ className }) => (
  <BaseSvg bg="#CCFBF1" className={className}>
    {/* Shoulders / Sporty School Track Jacket */}
    <path d="M18 96 C24 76 34 72 50 72 C66 72 76 76 82 96 Z" fill="#0D9488" />
    <path d="M48 72 L48 96 L52 96 L52 72 Z" fill="#F0FDFA" />
    {/* Neck */}
    <rect x="44" y="60" width="12" height="14" rx="4" fill="#A26B3E" />
    {/* Head & Ears */}
    <circle cx="34" cy="46" r="4.5" fill="#A26B3E" />
    <circle cx="66" cy="46" r="4.5" fill="#A26B3E" />
    <rect x="35" y="28" width="30" height="34" rx="14" fill="#B37B4D" />
    {/* Eyes */}
    <circle cx="43" cy="45" r="2.2" fill="#134E4A" />
    <circle cx="57" cy="45" r="2.2" fill="#134E4A" />
    {/* Smile */}
    <path d="M45 54 Q50 58 55 54" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Athletic Short Fade */}
    <path d="M33 32 C34 22 41 18 50 18 C59 18 66 22 67 32 C65 29 58 27 50 27 C42 27 35 29 33 32 Z" fill="#18181B" />
  </BaseSvg>
);

/* ─────────────────────────────────────────────────────────────
 * 2. STUDENT FEMALE AVATARS (Youthful, School Attire)
 * ───────────────────────────────────────────────────────────── */

export const StudentFemale01 = ({ className }) => (
  <BaseSvg bg="#FCE7F3" className={className}>
    {/* Twin Ponytails / Ribbons (Behind) */}
    <circle cx="28" cy="38" r="8" fill="#582F0E" />
    <circle cx="72" cy="38" r="8" fill="#582F0E" />
    <circle cx="32" cy="36" r="3.5" fill="#EC4899" />
    <circle cx="68" cy="36" r="3.5" fill="#EC4899" />
    {/* Shoulders / School Blouse with Ribbon */}
    <path d="M18 96 C24 76 34 72 50 72 C66 72 76 76 82 96 Z" fill="#FFFFFF" />
    <path d="M18 96 C24 76 34 72 50 72 C66 72 76 76 82 96 Z" stroke="#E2E8F0" strokeWidth="1.5" />
    {/* Bow Tie / Ribbon */}
    <path d="M44 76 L56 76 L50 82 Z" fill="#DB2777" />
    {/* Neck */}
    <rect x="44" y="60" width="12" height="14" rx="4" fill="#FBD5B5" />
    {/* Head & Ears */}
    <circle cx="34" cy="46" r="4" fill="#FBD5B5" />
    <circle cx="66" cy="46" r="4" fill="#FBD5B5" />
    <rect x="35" y="28" width="30" height="34" rx="14" fill="#FCDDC2" />
    {/* Eyes with subtle sparkle */}
    <circle cx="43" cy="45" r="2.2" fill="#1E293B" />
    <circle cx="57" cy="45" r="2.2" fill="#1E293B" />
    <circle cx="43.8" cy="44.2" r="0.8" fill="#FFFFFF" />
    <circle cx="57.8" cy="44.2" r="0.8" fill="#FFFFFF" />
    {/* Smile */}
    <path d="M45 53 Q50 57 55 53" stroke="#E11D48" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Cheeks */}
    <circle cx="39" cy="49" r="2.8" fill="#FDA4AF" fillOpacity="0.5" />
    <circle cx="61" cy="49" r="2.8" fill="#FDA4AF" fillOpacity="0.5" />
    {/* Hair (Front Bangs) */}
    <path d="M33 36 C33 22 41 16 50 16 C59 16 67 22 67 36 C63 32 57 30 50 30 C43 30 37 32 33 36 Z" fill="#582F0E" />
  </BaseSvg>
);

export const StudentFemale02 = ({ className }) => (
  <BaseSvg bg="#EDE9FE" className={className}>
    {/* Chic Bob Hair (Behind) */}
    <path d="M28 42 C28 22 36 14 50 14 C64 14 72 22 72 42 C72 56 68 62 66 64 L34 64 C32 62 28 56 28 42 Z" fill="#1E1B4B" />
    {/* Shoulders / School V-Neck Uniform */}
    <path d="M18 96 C24 76 34 72 50 72 C66 72 76 76 82 96 Z" fill="#4338CA" />
    <path d="M41 72 L50 83 L59 72 Z" fill="#FFFFFF" />
    {/* Neck */}
    <rect x="44" y="60" width="12" height="14" rx="4" fill="#E2A77A" />
    {/* Head & Ears */}
    <circle cx="34" cy="46" r="4" fill="#E2A77A" />
    <circle cx="66" cy="46" r="4" fill="#E2A77A" />
    <rect x="35" y="28" width="30" height="34" rx="14" fill="#F0B78B" />
    {/* Eyes */}
    <circle cx="43" cy="45" r="2.2" fill="#1E1B4B" />
    <circle cx="57" cy="45" r="2.2" fill="#1E1B4B" />
    <circle cx="43.8" cy="44.2" r="0.8" fill="#FFFFFF" />
    <circle cx="57.8" cy="44.2" r="0.8" fill="#FFFFFF" />
    {/* Smile */}
    <path d="M45 54 Q50 58 55 54" stroke="#9A3412" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Hair (Front Frame) */}
    <path d="M31 38 C32 24 40 18 50 18 C60 18 68 24 69 38 C64 34 58 31 50 31 C42 31 36 34 31 38 Z" fill="#1E1B4B" />
  </BaseSvg>
);

export const StudentFemale03 = ({ className }) => (
  <BaseSvg bg="#E0F2FE" className={className}>
    {/* Long Hair (Behind) */}
    <path d="M28 44 C28 20 37 14 50 14 C63 14 72 20 72 44 C72 65 67 76 65 80 L35 80 C33 76 28 65 28 44 Z" fill="#3B2314" />
    {/* Headband */}
    <path d="M31 36 C34 22 42 18 50 18 C58 18 66 22 69 36" stroke="#0284C7" strokeWidth="4" strokeLinecap="round" fill="none" />
    {/* Shoulders / School Blazer */}
    <path d="M18 96 C24 76 34 72 50 72 C66 72 76 76 82 96 Z" fill="#0369A1" />
    <path d="M43 72 L50 82 L57 72 Z" fill="#FFFFFF" />
    {/* Neck */}
    <rect x="44" y="60" width="12" height="14" rx="4" fill="#FCDDC2" />
    {/* Head & Ears */}
    <circle cx="34" cy="46" r="4" fill="#FCDDC2" />
    <circle cx="66" cy="46" r="4" fill="#FCDDC2" />
    <rect x="35" y="28" width="30" height="34" rx="14" fill="#FDE7D4" />
    {/* Eyes */}
    <circle cx="43" cy="45" r="2.2" fill="#0C4A6E" />
    <circle cx="57" cy="45" r="2.2" fill="#0C4A6E" />
    {/* Smile */}
    <path d="M46 53 Q50 57 54 53" stroke="#BE123C" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Cheeks */}
    <circle cx="40" cy="49" r="2.5" fill="#FDA4AF" fillOpacity="0.4" />
    <circle cx="60" cy="49" r="2.5" fill="#FDA4AF" fillOpacity="0.4" />
  </BaseSvg>
);

export const StudentFemale04 = ({ className }) => (
  <BaseSvg bg="#FEF08A" className={className}>
    {/* High Ponytail (Top Left) */}
    <circle cx="62" cy="18" r="8" fill="#1C1917" />
    <circle cx="58" cy="20" r="3" fill="#CA8A04" />
    {/* Shoulders / School Polo */}
    <path d="M18 96 C24 76 34 72 50 72 C66 72 76 76 82 96 Z" fill="#854D0E" />
    <path d="M44 72 L50 78 L56 72 Z" fill="#FEF9C3" />
    {/* Neck */}
    <rect x="44" y="60" width="12" height="14" rx="4" fill="#C68642" />
    {/* Head & Ears */}
    <circle cx="34" cy="46" r="4" fill="#C68642" />
    <circle cx="66" cy="46" r="4" fill="#C68642" />
    <rect x="35" y="28" width="30" height="34" rx="14" fill="#D39353" />
    {/* Cute Round Glasses */}
    <circle cx="43" cy="44" r="5.5" fill="none" stroke="#713F12" strokeWidth="1.5" />
    <circle cx="57" cy="44" r="5.5" fill="none" stroke="#713F12" strokeWidth="1.5" />
    <path d="M48.5 44 L51.5 44" stroke="#713F12" strokeWidth="1.5" />
    {/* Eyes */}
    <circle cx="43" cy="44" r="1.8" fill="#1C1917" />
    <circle cx="57" cy="44" r="1.8" fill="#1C1917" />
    {/* Smile */}
    <path d="M46 54 Q50 57 54 54" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Hair (Sleek pulled back) */}
    <path d="M33 34 C33 20 42 16 50 16 C58 16 67 20 67 34 C63 30 57 28 50 28 C43 28 37 30 33 34 Z" fill="#1C1917" />
  </BaseSvg>
);

export const StudentFemale05 = ({ className }) => (
  <BaseSvg bg="#DCFCE7" className={className}>
    {/* Braid (Over Shoulder) */}
    <path d="M64 45 C66 55 64 65 60 78 C59 82 57 84 55 86" stroke="#451A03" strokeWidth="6" strokeLinecap="round" fill="none" />
    <circle cx="55" cy="85" r="2.5" fill="#16A34A" />
    {/* Shoulders / School Sweater */}
    <path d="M18 96 C24 76 34 72 50 72 C66 72 76 76 82 96 Z" fill="#15803D" />
    <path d="M42 72 L50 82 L58 72 Z" fill="#FFFFFF" />
    {/* Neck */}
    <rect x="44" y="60" width="12" height="14" rx="4" fill="#FBD5B5" />
    {/* Head & Ears */}
    <circle cx="34" cy="46" r="4" fill="#FBD5B5" />
    <circle cx="66" cy="46" r="4" fill="#FBD5B5" />
    <rect x="35" y="28" width="30" height="34" rx="14" fill="#FCDDC2" />
    {/* Eyes */}
    <circle cx="43" cy="45" r="2.2" fill="#14532D" />
    <circle cx="57" cy="45" r="2.2" fill="#14532D" />
    <circle cx="43.8" cy="44.2" r="0.7" fill="#FFFFFF" />
    <circle cx="57.8" cy="44.2" r="0.7" fill="#FFFFFF" />
    {/* Smile */}
    <path d="M45 53 Q50 57 55 53" stroke="#C2410C" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Cheeks */}
    <circle cx="39" cy="49" r="2.5" fill="#FDA4AF" fillOpacity="0.4" />
    <circle cx="61" cy="49" r="2.5" fill="#FDA4AF" fillOpacity="0.4" />
    {/* Hair (Side Parted Waves) */}
    <path d="M32 38 C32 22 41 16 50 16 C61 16 68 22 68 38 C64 32 56 29 48 30 C40 31 35 34 32 38 Z" fill="#451A03" />
  </BaseSvg>
);

export const StudentFemale06 = ({ className }) => (
  <BaseSvg bg="#FFEDD5" className={className}>
    {/* Shoulder-length Wavy Hair (Behind) */}
    <path d="M28 42 C28 20 37 14 50 14 C63 14 72 20 72 42 C72 60 68 70 66 74 L34 74 C32 70 28 60 28 42 Z" fill="#1C1917" />
    {/* Shoulders / School Uniform */}
    <path d="M18 96 C24 76 34 72 50 72 C66 72 76 76 82 96 Z" fill="#C2410C" />
    <path d="M42 72 L50 82 L58 72 Z" fill="#FFFFFF" />
    {/* Neck */}
    <rect x="44" y="60" width="12" height="14" rx="4" fill="#ECC5A8" />
    {/* Head & Ears */}
    <circle cx="34" cy="46" r="4" fill="#ECC5A8" />
    <circle cx="66" cy="46" r="4" fill="#ECC5A8" />
    <rect x="35" y="28" width="30" height="34" rx="14" fill="#F5D0B5" />
    {/* Eyes */}
    <circle cx="43" cy="45" r="2.2" fill="#1C1917" />
    <circle cx="57" cy="45" r="2.2" fill="#1C1917" />
    {/* Smile */}
    <path d="M45 53 Q50 57 55 53" stroke="#9A3412" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Cheeks */}
    <circle cx="39" cy="49" r="2.5" fill="#FDA4AF" fillOpacity="0.4" />
    <circle cx="61" cy="49" r="2.5" fill="#FDA4AF" fillOpacity="0.4" />
    {/* Hair (Front Frame) */}
    <path d="M31 36 C32 23 40 18 50 18 C60 18 68 23 69 36 C64 32 58 30 50 30 C42 30 36 32 31 36 Z" fill="#1C1917" />
  </BaseSvg>
);

/* ─────────────────────────────────────────────────────────────
 * 3. STUDENT NEUTRAL AVATAR
 * ───────────────────────────────────────────────────────────── */

export const StudentNeutral01 = ({ className }) => (
  <BaseSvg bg="#F1F5F9" className={className}>
    {/* Shoulders / School Sweater */}
    <path d="M18 96 C24 76 34 72 50 72 C66 72 76 76 82 96 Z" fill="#334155" />
    <path d="M42 72 L50 82 L58 72 Z" fill="#F8FAFC" />
    {/* Neck */}
    <rect x="44" y="60" width="12" height="14" rx="4" fill="#FBD5B5" />
    {/* Head & Ears */}
    <circle cx="34" cy="46" r="4.5" fill="#FBD5B5" />
    <circle cx="66" cy="46" r="4.5" fill="#FBD5B5" />
    <rect x="35" y="28" width="30" height="34" rx="14" fill="#FCDDC2" />
    {/* Eyes */}
    <circle cx="43" cy="45" r="2.2" fill="#0F172A" />
    <circle cx="57" cy="45" r="2.2" fill="#0F172A" />
    {/* Smile */}
    <path d="M46 53 Q50 57 54 53" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Hair (Neutral Crop) */}
    <path d="M33 34 C33 22 41 16 50 16 C59 16 67 22 67 34 C63 31 57 29 50 29 C43 29 37 31 33 34 Z" fill="#334155" />
  </BaseSvg>
);

/* ─────────────────────────────────────────────────────────────
 * 4. TEACHER MALE AVATARS (Mature, Professional Attire)
 * ───────────────────────────────────────────────────────────── */

export const TeacherMale01 = ({ className }) => (
  <BaseSvg bg="#E2E8F0" className={className}>
    {/* Professional Blazer & Tie */}
    <path d="M16 96 C22 74 32 70 50 70 C68 70 78 74 84 96 Z" fill="#1E293B" />
    {/* Shirt & Tie */}
    <path d="M40 70 L50 84 L60 70 Z" fill="#FFFFFF" />
    <path d="M47 79 L53 79 L55 96 L45 96 Z" fill="#2563EB" />
    {/* Lapels */}
    <path d="M32 72 L45 96 L35 96 Z" fill="#0F172A" />
    <path d="M68 72 L55 96 L65 96 Z" fill="#0F172A" />
    {/* Neck */}
    <rect x="44" y="58" width="12" height="15" rx="3" fill="#E2A77A" />
    {/* Mature Head Shape & Ears */}
    <circle cx="33" cy="45" r="4.5" fill="#E2A77A" />
    <circle cx="67" cy="45" r="4.5" fill="#E2A77A" />
    <path d="M35 27 C35 27 34 50 38 58 C42 63 58 63 62 58 C66 50 65 27 65 27 Z" fill="#F0B78B" />
    {/* Eyes & Eyebrows (Focused, Mature) */}
    <path d="M39 39 Q43 36 47 39" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M53 39 Q57 36 61 39" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="43" cy="44" r="2.2" fill="#0F172A" />
    <circle cx="57" cy="44" r="2.2" fill="#0F172A" />
    {/* Gentle Smile */}
    <path d="M46 54 Q50 57 54 54" stroke="#9A3412" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Mature Side-Parted Hair with styled volume */}
    <path d="M32 30 C32 16 42 12 50 12 C62 12 68 18 68 30 C64 26 56 22 45 24 C38 25 34 28 32 30 Z" fill="#334155" />
  </BaseSvg>
);

export const TeacherMale02 = ({ className }) => (
  <BaseSvg bg="#DCFCE7" className={className}>
    {/* Knit Sweater over Collared Shirt */}
    <path d="M16 96 C22 74 32 70 50 70 C68 70 78 74 84 96 Z" fill="#166534" />
    <path d="M42 70 L50 80 L58 70 Z" fill="#FFFFFF" />
    {/* Neck */}
    <rect x="44" y="58" width="12" height="15" rx="3" fill="#FBD5B5" />
    {/* Head & Ears */}
    <circle cx="33" cy="45" r="4.5" fill="#FBD5B5" />
    <circle cx="67" cy="45" r="4.5" fill="#FBD5B5" />
    <path d="M35 27 C35 27 34 50 38 58 C42 63 58 63 62 58 C66 50 65 27 65 27 Z" fill="#FCDDC2" />
    {/* Teacher Glasses */}
    <rect x="37" y="38" width="11" height="9" rx="2" fill="none" stroke="#1E293B" strokeWidth="1.7" />
    <rect x="52" y="38" width="11" height="9" rx="2" fill="none" stroke="#1E293B" strokeWidth="1.7" />
    <path d="M48 42 L52 42" stroke="#1E293B" strokeWidth="1.7" />
    {/* Eyes */}
    <circle cx="42.5" cy="42.5" r="1.8" fill="#1E293B" />
    <circle cx="57.5" cy="42.5" r="1.8" fill="#1E293B" />
    {/* Smile */}
    <path d="M46 54 Q50 57 54 54" stroke="#C2410C" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Hair (Wavy Mature Dark Brown) */}
    <path d="M32 29 C32 16 41 13 50 13 C60 13 68 17 68 29 C63 24 55 22 47 23 C39 24 34 27 32 29 Z" fill="#451A03" />
  </BaseSvg>
);

export const TeacherMale03 = ({ className }) => (
  <BaseSvg bg="#FEF3C7" className={className}>
    {/* Formal Mandarin / Nehru Vest (Senior Teacher) */}
    <path d="M16 96 C22 74 32 70 50 70 C68 70 78 74 84 96 Z" fill="#78350F" />
    <path d="M46 70 L46 96 L54 96 L54 70 Z" fill="#92400E" />
    <circle cx="50" cy="76" r="1.5" fill="#FEF3C7" />
    <circle cx="50" cy="84" r="1.5" fill="#FEF3C7" />
    <circle cx="50" cy="92" r="1.5" fill="#FEF3C7" />
    {/* Neck */}
    <rect x="44" y="58" width="12" height="15" rx="3" fill="#C68642" />
    {/* Head & Ears */}
    <circle cx="33" cy="45" r="4.5" fill="#C68642" />
    <circle cx="67" cy="45" r="4.5" fill="#C68642" />
    <path d="M35 27 C35 27 34 50 38 58 C42 63 58 63 62 58 C66 50 65 27 65 27 Z" fill="#D39353" />
    {/* Eyes & Eyebrows */}
    <path d="M39 39 Q43 36 47 39" stroke="#1C1917" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M53 39 Q57 36 61 39" stroke="#1C1917" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="43" cy="44" r="2.2" fill="#1C1917" />
    <circle cx="57" cy="44" r="2.2" fill="#1C1917" />
    {/* Smile */}
    <path d="M46 54 Q50 57 54 54" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Silver Temples / Senior Hair */}
    <path d="M32 29 C32 15 41 12 50 12 C60 12 68 16 68 29 C63 24 55 22 47 23 C39 24 34 27 32 29 Z" fill="#4B5563" />
    <path d="M33 32 C33 26 36 24 39 23" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" />
  </BaseSvg>
);

export const TeacherMale04 = ({ className }) => (
  <BaseSvg bg="#EFF6FF" className={className}>
    {/* Formal Shirt with Burgundy Tie */}
    <path d="M16 96 C22 74 32 70 50 70 C68 70 78 74 84 96 Z" fill="#F8FAFC" />
    <path d="M16 96 C22 74 32 70 50 70 C68 70 78 74 84 96 Z" stroke="#CBD5E1" strokeWidth="1.5" />
    <path d="M46 76 L54 76 L56 96 L44 96 Z" fill="#881337" />
    {/* Neck */}
    <rect x="44" y="58" width="12" height="15" rx="3" fill="#A26B3E" />
    {/* Head & Ears */}
    <circle cx="33" cy="45" r="4.5" fill="#A26B3E" />
    <circle cx="67" cy="45" r="4.5" fill="#A26B3E" />
    <path d="M35 27 C35 27 34 50 38 58 C42 63 58 63 62 58 C66 50 65 27 65 27 Z" fill="#B37B4D" />
    {/* Round Glasses */}
    <circle cx="42.5" cy="42.5" r="5.5" fill="none" stroke="#0F172A" strokeWidth="1.5" />
    <circle cx="57.5" cy="42.5" r="5.5" fill="none" stroke="#0F172A" strokeWidth="1.5" />
    <path d="M48 42.5 L52 42.5" stroke="#0F172A" strokeWidth="1.5" />
    {/* Eyes */}
    <circle cx="42.5" cy="42.5" r="1.8" fill="#0F172A" />
    <circle cx="57.5" cy="42.5" r="1.8" fill="#0F172A" />
    {/* Smile */}
    <path d="M46 54 Q50 57 54 54" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Short Professional Cut */}
    <path d="M32 29 C32 17 41 14 50 14 C59 14 68 17 68 29 C64 26 56 24 48 24 C40 24 35 26 32 29 Z" fill="#18181B" />
  </BaseSvg>
);

export const TeacherMale05 = ({ className }) => (
  <BaseSvg bg="#FCE7F3" className={className}>
    {/* Formal Dark Blazer */}
    <path d="M16 96 C22 74 32 70 50 70 C68 70 78 74 84 96 Z" fill="#3B0764" />
    <path d="M42 70 L50 82 L58 70 Z" fill="#FAF5FF" />
    {/* Neck */}
    <rect x="44" y="58" width="12" height="15" rx="3" fill="#ECC5A8" />
    {/* Head & Ears */}
    <circle cx="33" cy="45" r="4.5" fill="#ECC5A8" />
    <circle cx="67" cy="45" r="4.5" fill="#ECC5A8" />
    <path d="M35 27 C35 27 34 50 38 58 C42 63 58 63 62 58 C66 50 65 27 65 27 Z" fill="#F5D0B5" />
    {/* Trim Professional Beard */}
    <path d="M38 52 C38 60 44 64 50 64 C56 64 62 60 62 52 C62 56 57 60 50 60 C43 60 38 56 38 52 Z" fill="#27272A" />
    {/* Eyes & Eyebrows */}
    <path d="M39 39 Q43 36 47 39" stroke="#18181B" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M53 39 Q57 36 61 39" stroke="#18181B" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="43" cy="44" r="2.2" fill="#18181B" />
    <circle cx="57" cy="44" r="2.2" fill="#18181B" />
    {/* Smile */}
    <path d="M46 53 Q50 56 54 53" stroke="#9A3412" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Hair (Sleek Style) */}
    <path d="M32 28 C32 16 41 12 50 12 C60 12 68 16 68 28 C64 24 56 22 47 23 C39 24 34 26 32 28 Z" fill="#27272A" />
  </BaseSvg>
);

/* ─────────────────────────────────────────────────────────────
 * 5. TEACHER FEMALE AVATARS (Mature, Saree / Blazer / Kurta)
 * ───────────────────────────────────────────────────────────── */

export const TeacherFemale01 = ({ className }) => (
  <BaseSvg bg="#FFE4E6" className={className}>
    {/* Elegant Teacher Bun (Top) */}
    <circle cx="50" cy="15" r="9" fill="#1C1917" />
    {/* Traditional Saree with Elegant Pallu */}
    <path d="M16 96 C22 74 32 70 50 70 C68 70 78 74 84 96 Z" fill="#9F1239" />
    {/* Saree Pallu Diagonal Drape */}
    <path d="M30 70 L65 96 L45 96 L20 75 Z" fill="#BE123C" />
    <path d="M30 70 L65 96" stroke="#FDE047" strokeWidth="1.5" />
    {/* Neck */}
    <rect x="44" y="58" width="12" height="15" rx="3" fill="#E2A77A" />
    {/* Head & Ears */}
    <circle cx="33" cy="45" r="4.5" fill="#E2A77A" />
    <circle cx="67" cy="45" r="4.5" fill="#E2A77A" />
    {/* Earrings */}
    <circle cx="33" cy="50" r="1.5" fill="#FACC15" />
    <circle cx="67" cy="50" r="1.5" fill="#FACC15" />
    <path d="M35 27 C35 27 34 50 38 58 C42 63 58 63 62 58 C66 50 65 27 65 27 Z" fill="#F0B78B" />
    {/* Subtle Bindi */}
    <circle cx="50" cy="38" r="1.3" fill="#BE123C" />
    {/* Eyes & Eyebrows */}
    <path d="M39 39 Q43 36 47 39" stroke="#1C1917" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M53 39 Q57 36 61 39" stroke="#1C1917" strokeWidth="1.7" strokeLinecap="round" />
    <circle cx="43" cy="44" r="2.2" fill="#1C1917" />
    <circle cx="57" cy="44" r="2.2" fill="#1C1917" />
    <circle cx="43.8" cy="43.2" r="0.7" fill="#FFFFFF" />
    <circle cx="57.8" cy="43.2" r="0.7" fill="#FFFFFF" />
    {/* Gentle Smile */}
    <path d="M45 54 Q50 58 55 54" stroke="#9F1239" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Hair (Sleek side parting leading to bun) */}
    <path d="M32 30 C32 18 41 15 50 15 C60 15 68 18 68 30 C64 26 56 24 48 25 C40 26 35 28 32 30 Z" fill="#1C1917" />
  </BaseSvg>
);

export const TeacherFemale02 = ({ className }) => (
  <BaseSvg bg="#E0E7FF" className={className}>
    {/* Professional Short Haircut (Behind) */}
    <path d="M28 42 C28 20 37 14 50 14 C63 14 72 20 72 42 C72 58 68 64 66 66 L34 66 C32 64 28 58 28 42 Z" fill="#1E1B4B" />
    {/* Formal Blazer over Blouse */}
    <path d="M16 96 C22 74 32 70 50 70 C68 70 78 74 84 96 Z" fill="#312E81" />
    <path d="M42 70 L50 82 L58 70 Z" fill="#EEF2FF" />
    {/* Neck */}
    <rect x="44" y="58" width="12" height="15" rx="3" fill="#FBD5B5" />
    {/* Head & Ears */}
    <circle cx="33" cy="45" r="4.5" fill="#FBD5B5" />
    <circle cx="67" cy="45" r="4.5" fill="#FBD5B5" />
    <path d="M35 27 C35 27 34 50 38 58 C42 63 58 63 62 58 C66 50 65 27 65 27 Z" fill="#FCDDC2" />
    {/* Elegant Spectacles */}
    <rect x="37" y="38" width="11" height="9" rx="2" fill="none" stroke="#312E81" strokeWidth="1.6" />
    <rect x="52" y="38" width="11" height="9" rx="2" fill="none" stroke="#312E81" strokeWidth="1.6" />
    <path d="M48 42 L52 42" stroke="#312E81" strokeWidth="1.6" />
    {/* Eyes */}
    <circle cx="42.5" cy="42.5" r="1.8" fill="#1E1B4B" />
    <circle cx="57.5" cy="42.5" r="1.8" fill="#1E1B4B" />
    {/* Smile */}
    <path d="M46 54 Q50 57 54 54" stroke="#BE123C" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Hair (Front Style) */}
    <path d="M31 34 C32 22 41 17 50 17 C60 17 68 22 69 34 C64 30 58 28 50 28 C42 28 36 30 31 34 Z" fill="#1E1B4B" />
  </BaseSvg>
);

export const TeacherFemale03 = ({ className }) => (
  <BaseSvg bg="#D1FAE5" className={className}>
    {/* Styled Shoulder-Length Hair (Behind) */}
    <path d="M26 44 C26 20 36 14 50 14 C64 14 74 20 74 44 C74 65 69 76 66 80 L34 80 C31 76 26 65 26 44 Z" fill="#451A03" />
    {/* Formal Embroidered Kurta */}
    <path d="M16 96 C22 74 32 70 50 70 C68 70 78 74 84 96 Z" fill="#065F46" />
    <path d="M48 70 L48 96 L52 96 L52 70 Z" fill="#FDE047" />
    {/* Neck */}
    <rect x="44" y="58" width="12" height="15" rx="3" fill="#C68642" />
    {/* Head & Ears */}
    <circle cx="33" cy="45" r="4.5" fill="#C68642" />
    <circle cx="67" cy="45" r="4.5" fill="#C68642" />
    {/* Earrings */}
    <circle cx="33" cy="50" r="1.5" fill="#FACC15" />
    <circle cx="67" cy="50" r="1.5" fill="#FACC15" />
    <path d="M35 27 C35 27 34 50 38 58 C42 63 58 63 62 58 C66 50 65 27 65 27 Z" fill="#D39353" />
    {/* Eyes & Eyebrows */}
    <path d="M39 39 Q43 36 47 39" stroke="#1C1917" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M53 39 Q57 36 61 39" stroke="#1C1917" strokeWidth="1.7" strokeLinecap="round" />
    <circle cx="43" cy="44" r="2.2" fill="#1C1917" />
    <circle cx="57" cy="44" r="2.2" fill="#1C1917" />
    {/* Smile */}
    <path d="M45 54 Q50 58 55 54" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Hair (Wavy side bangs) */}
    <path d="M31 36 C32 23 41 17 50 17 C61 17 68 23 69 36 C64 31 56 28 48 29 C40 30 35 33 31 36 Z" fill="#451A03" />
  </BaseSvg>
);

export const TeacherFemale04 = ({ className }) => (
  <BaseSvg bg="#F3E8FF" className={className}>
    {/* Cardigan / Brooch (Senior Teacher) */}
    <path d="M16 96 C22 74 32 70 50 70 C68 70 78 74 84 96 Z" fill="#581C87" />
    <path d="M42 70 L50 82 L58 70 Z" fill="#FAF5FF" />
    <circle cx="34" cy="78" r="2.2" fill="#FACC15" />
    {/* Neck */}
    <rect x="44" y="58" width="12" height="15" rx="3" fill="#ECC5A8" />
    {/* Head & Ears */}
    <circle cx="33" cy="45" r="4.5" fill="#ECC5A8" />
    <circle cx="67" cy="45" r="4.5" fill="#ECC5A8" />
    <path d="M35 27 C35 27 34 50 38 58 C42 63 58 63 62 58 C66 50 65 27 65 27 Z" fill="#F5D0B5" />
    {/* Eyeglasses */}
    <rect x="37" y="38" width="11" height="9" rx="2" fill="none" stroke="#581C87" strokeWidth="1.6" />
    <rect x="52" y="38" width="11" height="9" rx="2" fill="none" stroke="#581C87" strokeWidth="1.6" />
    <path d="M48 42 L52 42" stroke="#581C87" strokeWidth="1.6" />
    {/* Eyes */}
    <circle cx="42.5" cy="42.5" r="1.8" fill="#18181B" />
    <circle cx="57.5" cy="42.5" r="1.8" fill="#18181B" />
    {/* Smile */}
    <path d="M46 54 Q50 57 54 54" stroke="#9A3412" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Silver-Streaked Bob */}
    <path d="M31 35 C31 20 40 14 50 14 C60 14 69 20 69 35 C64 30 58 27 50 27 C42 27 36 30 31 35 Z" fill="#4B5563" />
    <path d="M35 25 C40 21 46 20 50 20" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" />
  </BaseSvg>
);

export const TeacherFemale05 = ({ className }) => (
  <BaseSvg bg="#CCFBF1" className={className}>
    {/* Pastel Saree with Gold Border */}
    <path d="M16 96 C22 74 32 70 50 70 C68 70 78 74 84 96 Z" fill="#0F766E" />
    <path d="M30 70 L65 96 L45 96 L20 75 Z" fill="#14B8A6" />
    <path d="M30 70 L65 96" stroke="#FDE047" strokeWidth="1.5" />
    {/* Neck */}
    <rect x="44" y="58" width="12" height="15" rx="3" fill="#A26B3E" />
    {/* Head & Ears */}
    <circle cx="33" cy="45" r="4.5" fill="#A26B3E" />
    <circle cx="67" cy="45" r="4.5" fill="#A26B3E" />
    <path d="M35 27 C35 27 34 50 38 58 C42 63 58 63 62 58 C66 50 65 27 65 27 Z" fill="#B37B4D" />
    {/* Eyes & Eyebrows */}
    <path d="M39 39 Q43 36 47 39" stroke="#134E4A" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M53 39 Q57 36 61 39" stroke="#134E4A" strokeWidth="1.7" strokeLinecap="round" />
    <circle cx="43" cy="44" r="2.2" fill="#134E4A" />
    <circle cx="57" cy="44" r="2.2" fill="#134E4A" />
    {/* Smile */}
    <path d="M45 54 Q50 58 55 54" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Sleek Long Styled Hair */}
    <path d="M30 38 C31 22 40 16 50 16 C60 16 69 22 70 38 C65 32 58 29 50 29 C42 29 35 32 30 38 Z" fill="#1C1917" />
  </BaseSvg>
);

/* ─────────────────────────────────────────────────────────────
 * 6. TEACHER NEUTRAL AVATAR
 * ───────────────────────────────────────────────────────────── */

export const TeacherNeutral01 = ({ className }) => (
  <BaseSvg bg="#F1F5F9" className={className}>
    {/* Professional Blazer */}
    <path d="M16 96 C22 74 32 70 50 70 C68 70 78 74 84 96 Z" fill="#334155" />
    <path d="M42 70 L50 82 L58 70 Z" fill="#F8FAFC" />
    {/* Neck */}
    <rect x="44" y="58" width="12" height="15" rx="3" fill="#FBD5B5" />
    {/* Head & Ears */}
    <circle cx="33" cy="45" r="4.5" fill="#FBD5B5" />
    <circle cx="67" cy="45" r="4.5" fill="#FBD5B5" />
    <path d="M35 27 C35 27 34 50 38 58 C42 63 58 63 62 58 C66 50 65 27 65 27 Z" fill="#FCDDC2" />
    {/* Professional Spectacles */}
    <rect x="37" y="38" width="11" height="9" rx="2" fill="none" stroke="#334155" strokeWidth="1.6" />
    <rect x="52" y="38" width="11" height="9" rx="2" fill="none" stroke="#334155" strokeWidth="1.6" />
    <path d="M48 42 L52 42" stroke="#334155" strokeWidth="1.6" />
    {/* Eyes */}
    <circle cx="42.5" cy="42.5" r="1.8" fill="#0F172A" />
    <circle cx="57.5" cy="42.5" r="1.8" fill="#0F172A" />
    {/* Smile */}
    <path d="M46 54 Q50 57 54 54" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Hair (Smart Professional Crop) */}
    <path d="M32 29 C32 16 41 13 50 13 C60 13 68 17 68 29 C63 24 55 22 47 23 C39 24 34 26 32 29 Z" fill="#334155" />
  </BaseSvg>
);

/* ─────────────────────────────────────────────────────────────
 * 7. GENERIC NEUTRAL FALLBACK (Admins, Parents, Unknowns)
 * ───────────────────────────────────────────────────────────── */

export const GenericNeutral = ({ className }) => (
  <BaseSvg bg="#E2E8F0" className={className}>
    {/* Shoulders */}
    <path d="M18 96 C24 76 34 72 50 72 C66 72 76 76 82 96 Z" fill="#475569" />
    {/* Neck */}
    <rect x="44" y="60" width="12" height="14" rx="4" fill="#E2E8F0" />
    {/* Head & Ears */}
    <circle cx="34" cy="46" r="4.5" fill="#E2E8F0" />
    <circle cx="66" cy="46" r="4.5" fill="#E2E8F0" />
    <rect x="35" y="28" width="30" height="34" rx="14" fill="#CBD5E1" />
    {/* Eyes */}
    <circle cx="43" cy="45" r="2.2" fill="#1E293B" />
    <circle cx="57" cy="45" r="2.2" fill="#1E293B" />
    {/* Smile */}
    <path d="M46 53 Q50 57 54 53" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Minimal Hair Silhouette */}
    <path d="M33 34 C33 22 41 16 50 16 C59 16 67 22 67 34 C63 30 57 28 50 28 C43 28 37 30 33 34 Z" fill="#475569" />
  </BaseSvg>
);

/* ─────────────────────────────────────────────────────────────
 * 8. Avatar Collections Map
 * ───────────────────────────────────────────────────────────── */

export const AVATAR_MAP = {
  student: {
    male: [StudentMale01, StudentMale02, StudentMale03, StudentMale04, StudentMale05, StudentMale06],
    female: [StudentFemale01, StudentFemale02, StudentFemale03, StudentFemale04, StudentFemale05, StudentFemale06],
    neutral: [StudentNeutral01],
  },
  teacher: {
    male: [TeacherMale01, TeacherMale02, TeacherMale03, TeacherMale04, TeacherMale05],
    female: [TeacherFemale01, TeacherFemale02, TeacherFemale03, TeacherFemale04, TeacherFemale05],
    neutral: [TeacherNeutral01],
  },
  admin: {
    male: [TeacherMale01, TeacherMale02, TeacherMale05],
    female: [TeacherFemale02, TeacherFemale04, TeacherFemale05],
    neutral: [TeacherNeutral01, GenericNeutral],
  },
  parent: {
    male: [TeacherMale01, TeacherMale02, TeacherMale03],
    female: [TeacherFemale01, TeacherFemale03, TeacherFemale05],
    neutral: [GenericNeutral],
  },
  staff: {
    male: [TeacherMale01, TeacherMale02, StudentMale03],
    female: [TeacherFemale02, TeacherFemale03, StudentFemale02],
    neutral: [GenericNeutral],
  },
  default: [GenericNeutral],
};
