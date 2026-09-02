import React from 'react';

export default function CampusIllustration({ className = '' }) {
  return (
    <svg
      viewBox="0 0 600 450"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-auto select-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Gradients */}
        <linearGradient id="skyGradLight" x1="300" y1="0" x2="300" y2="300" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ECFDF5" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#F8FAFC" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="skyGradDark" x1="300" y1="0" x2="300" y2="300" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#064E3B" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#07090B" stopOpacity="0" />
        </linearGradient>
        
        <linearGradient id="pathGrad" x1="300" y1="200" x2="300" y2="420" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>
        <linearGradient id="pathGradDark" x1="300" y1="200" x2="300" y2="420" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        <linearGradient id="primarySign" x1="0" y1="0" x2="140" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>

        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0F172A" floodOpacity="0.08" />
        </filter>
      </defs>

      {/* Sky backdrop */}
      <rect x="0" y="0" width="600" height="450" fill="url(#skyGradLight)" className="dark:hidden" />
      <rect x="0" y="0" width="600" height="450" fill="url(#skyGradDark)" className="hidden dark:block" />

      {/* Soft Clouds */}
      <g opacity="0.6" className="text-emerald-100 dark:text-emerald-950/30">
        <path d="M70 90C70 73.4 83.4 60 100 60C112.5 60 123.2 67.7 127.6 78.6C131.6 75.7 136.6 74 142 74C155.3 74 166 84.7 166 98C166 99.4 165.9 100.7 165.6 102C171.7 104.4 176 110.4 176 117.5C176 126.6 168.6 134 159.5 134H70C53.4 134 40 120.6 40 104C40 88.3 52 75.4 67.3 74.1C68.1 79.5 70 85 70 90Z" fill="currentColor" />
        <path d="M440 70C440 56.7 450.7 46 464 46C474 46 482.6 52.1 486.1 60.9C489.3 58.5 493.3 57.1 497.6 57.1C508.3 57.1 516.9 65.7 516.9 76.4C516.9 77.5 516.8 78.6 516.6 79.6C521.5 81.5 525 86.3 525 92C525 99.2 519.2 105 512 105H440C426.7 105 416 94.3 416 81C416 68.4 425.6 58.1 437.9 57.1C438.5 61.4 440 65.8 440 70Z" fill="currentColor" />
      </g>

      {/* Campus Ground / Grass */}
      <path d="M0 240Q150 220 300 230T600 235V450H0V240Z" fill="#F0FDF4" className="dark:hidden" />
      <path d="M0 240Q150 220 300 230T600 235V450H0V240Z" fill="#062C22" opacity="0.5" className="hidden dark:block" />

      {/* Campus Winding Pathway */}
      <path d="M220 450 C230 380 270 320 290 280 C305 250 320 235 340 225 L380 225 C355 240 340 260 330 290 C310 340 290 395 280 450 Z" fill="url(#pathGrad)" className="dark:hidden" />
      <path d="M220 450 C230 380 270 320 290 280 C305 250 320 235 340 225 L380 225 C355 240 340 260 330 290 C310 340 290 395 280 450 Z" fill="url(#pathGradDark)" className="hidden dark:block" />

      {/* School Main Building (Background) */}
      <g transform="translate(320, 90)">
        {/* Main Wall */}
        <rect x="30" y="70" width="220" height="110" rx="4" fill="#FFFFFF" className="dark:hidden" stroke="#CBD5E1" strokeWidth="2" />
        <rect x="30" y="70" width="220" height="110" rx="4" fill="#0F172A" className="hidden dark:block" stroke="#1E293B" strokeWidth="2" />
        
        {/* Roof Gable */}
        <path d="M20 70 L140 15 L260 70 Z" fill="#065F46" />
        <path d="M35 70 L140 26 L245 70 Z" fill="#047857" />

        {/* Central Entrance Steps & Pillars */}
        <rect x="115" y="130" width="50" height="50" fill="#E2E8F0" className="dark:hidden" />
        <rect x="115" y="130" width="50" height="50" fill="#1E293B" className="hidden dark:block" />
        <rect x="125" y="140" width="30" height="40" rx="15" fill="#064E3B" />

        {/* Pillars */}
        <rect x="105" y="95" width="8" height="40" fill="#E2E8F0" />
        <rect x="167" y="95" width="8" height="40" fill="#E2E8F0" />

        {/* Instique Shield Logo on Roof Gable */}
        <circle cx="140" cy="50" r="14" fill="#FFFFFF" className="dark:hidden" />
        <circle cx="140" cy="50" r="14" fill="#0F172A" className="hidden dark:block" />
        <path d="M134 46C134 46 137 44 140 46C143 44 146 46 146 46V54C146 54 143 52 140 54C137 52 134 54 134 54V46Z" fill="#10B981" />

        {/* Windows */}
        <g fill="#38BDF8" opacity="0.7">
          <rect x="50" y="90" width="18" height="24" rx="2" />
          <rect x="76" y="90" width="18" height="24" rx="2" />
          <rect x="186" y="90" width="18" height="24" rx="2" />
          <rect x="212" y="90" width="18" height="24" rx="2" />
          <rect x="50" y="130" width="18" height="24" rx="2" />
          <rect x="76" y="130" width="18" height="24" rx="2" />
          <rect x="186" y="130" width="18" height="24" rx="2" />
          <rect x="212" y="130" width="18" height="24" rx="2" />
        </g>
      </g>

      {/* Trees */}
      <g>
        {/* Left Big Tree */}
        <rect x="42" y="170" width="16" height="80" rx="3" fill="#78350F" />
        <circle cx="50" cy="140" r="42" fill="#047857" />
        <circle cx="35" cy="155" r="32" fill="#059669" />
        <circle cx="65" cy="150" r="30" fill="#10B981" />

        {/* Right Tree behind building */}
        <rect x="548" y="150" width="12" height="70" rx="2" fill="#78350F" />
        <circle cx="554" cy="130" r="35" fill="#047857" />
        <circle cx="538" cy="142" r="25" fill="#059669" />
      </g>

      {/* Directional Signpost (Center Visual Element) */}
      <g transform="translate(340, 110)" filter="url(#shadow)">
        {/* Wooden Pole */}
        <rect x="26" y="50" width="12" height="220" rx="4" fill="#334155" className="dark:hidden" />
        <rect x="26" y="50" width="12" height="220" rx="4" fill="#64748B" className="hidden dark:block" />
        <circle cx="32" cy="48" r="8" fill="#0F172A" className="dark:hidden" />
        <circle cx="32" cy="48" r="8" fill="#F8FAFC" className="hidden dark:block" />

        {/* Sign 1: Dashboard (Pointing Right - Highlighted Emerald) */}
        <g transform="translate(20, 60)">
          <path d="M0 0 H130 L150 16 L130 32 H0 Z" fill="url(#primarySign)" />
          {/* Dashboard Icon */}
          <rect x="14" y="9" width="6" height="6" rx="1" fill="#FFFFFF" />
          <rect x="22" y="9" width="6" height="6" rx="1" fill="#FFFFFF" />
          <rect x="14" y="17" width="6" height="6" rx="1" fill="#FFFFFF" />
          <rect x="22" y="17" width="6" height="6" rx="1" fill="#FFFFFF" />
          <text x="36" y="21" fill="#FFFFFF" fontSize="13" fontWeight="700" fontFamily="Inter, sans-serif">
            Dashboard
          </text>
        </g>

        {/* Sign 2: Classes (Pointing Left) */}
        <g transform="translate(-110, 102)">
          <path d="M130 0 H10 L-10 16 L10 32 H130 Z" fill="#FFFFFF" className="dark:hidden" stroke="#CBD5E1" strokeWidth="1.5" />
          <path d="M130 0 H10 L-10 16 L10 32 H130 Z" fill="#1E293B" className="hidden dark:block" stroke="#334155" strokeWidth="1.5" />
          {/* Book Icon */}
          <path d="M12 10C12 10 16 9 20 11V23C16 21 12 22 12 22V10Z" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M28 10C28 10 24 9 20 11V23C24 21 28 22 28 22V10Z" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <text x="36" y="21" fill="#0F172A" className="dark:hidden" fontSize="12" fontWeight="600" fontFamily="Inter, sans-serif">
            Classes
          </text>
          <text x="36" y="21" fill="#F8FAFC" className="hidden dark:block" fontSize="12" fontWeight="600" fontFamily="Inter, sans-serif">
            Classes
          </text>
        </g>

        {/* Sign 3: Assignments (Pointing Right) */}
        <g transform="translate(20, 144)">
          <path d="M0 0 H120 L140 16 L120 32 H0 Z" fill="#FFFFFF" className="dark:hidden" stroke="#CBD5E1" strokeWidth="1.5" />
          <path d="M0 0 H120 L140 16 L120 32 H0 Z" fill="#1E293B" className="hidden dark:block" stroke="#334155" strokeWidth="1.5" />
          {/* Clipboard Icon */}
          <rect x="14" y="9" width="12" height="14" rx="2" stroke="#2563EB" strokeWidth="1.8" fill="none" />
          <path d="M17 9V7H23V9" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" />
          <text x="34" y="21" fill="#0F172A" className="dark:hidden" fontSize="12" fontWeight="600" fontFamily="Inter, sans-serif">
            Assignments
          </text>
          <text x="34" y="21" fill="#F8FAFC" className="hidden dark:block" fontSize="12" fontWeight="600" fontFamily="Inter, sans-serif">
            Assignments
          </text>
        </g>

        {/* Sign 4: Exams (Pointing Left) */}
        <g transform="translate(-100, 186)">
          <path d="M120 0 H10 L-10 16 L10 32 H120 Z" fill="#FFFFFF" className="dark:hidden" stroke="#CBD5E1" strokeWidth="1.5" />
          <path d="M120 0 H10 L-10 16 L10 32 H120 Z" fill="#1E293B" className="hidden dark:block" stroke="#334155" strokeWidth="1.5" />
          {/* Cap Icon */}
          <path d="M12 14L20 10L28 14L20 18L12 14Z" stroke="#7C3AED" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
          <path d="M15 15.5V20.5C15 20.5 17.5 22 20 22C22.5 22 25 20.5 25 20.5V15.5" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" />
          <text x="34" y="21" fill="#0F172A" className="dark:hidden" fontSize="12" fontWeight="600" fontFamily="Inter, sans-serif">
            Exams
          </text>
          <text x="34" y="21" fill="#F8FAFC" className="hidden dark:block" fontSize="12" fontWeight="600" fontFamily="Inter, sans-serif">
            Exams
          </text>
        </g>
      </g>

      {/* Student Figure Looking Lost */}
      <g transform="translate(280, 190)" filter="url(#shadow)">
        {/* Shadow on Ground */}
        <ellipse cx="35" cy="188" rx="28" ry="6" fill="#0F172A" opacity="0.15" />

        {/* Legs / Shoes */}
        <rect x="22" y="130" width="10" height="50" rx="3" fill="#1E293B" />
        <rect x="38" y="130" width="10" height="50" rx="3" fill="#1E293B" />
        <ellipse cx="27" cy="180" rx="9" ry="5" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
        <ellipse cx="43" cy="180" rx="9" ry="5" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />

        {/* Body / Jacket (Green Hoodie matching Instique) */}
        <path d="M12 75 C12 60 20 50 35 50 C50 50 58 60 58 75 L56 135 H14 Z" fill="#047857" />

        {/* Backpack */}
        <rect x="18" y="58" width="34" height="46" rx="8" fill="#0F172A" />
        {/* Instique Logo Emblem on Backpack */}
        <circle cx="35" cy="80" r="9" fill="#059669" />
        <path d="M31 77C31 77 33 76 35 77C37 76 39 77 39 77V83C39 83 37 82 35 83C33 82 31 83 31 83V77Z" fill="#FFFFFF" />

        {/* Raised Arm (Hand to forehead looking up) */}
        <path d="M52 65 Q68 55 60 42 Q52 40 45 46" fill="none" stroke="#047857" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="44" cy="44" r="5" fill="#FDBA74" />

        {/* Head / Dark Hair */}
        <circle cx="35" cy="38" r="14" fill="#0F172A" />
        <path d="M25 32 Q35 20 45 32 Q35 24 25 32 Z" fill="#1E293B" />

        {/* Floating Question Mark Above Head */}
        <g transform="translate(32, 2)">
          <circle cx="3" cy="3" r="13" fill="#10B981" />
          <text x="3" y="8" fill="#FFFFFF" fontSize="15" fontWeight="900" textAnchor="middle" fontFamily="Inter, sans-serif">
            ?
          </text>
        </g>
      </g>

      {/* Foreground Accessories: Books & Coffee Cup on Grass */}
      <g transform="translate(420, 310)">
        {/* Stack of Textbooks */}
        <rect x="0" y="32" width="75" height="14" rx="2" fill="#2563EB" />
        <rect x="4" y="34" width="67" height="10" rx="1" fill="#EFF6FF" />

        <rect x="5" y="18" width="70" height="14" rx="2" fill="#059669" />
        <rect x="9" y="20" width="62" height="10" rx="1" fill="#ECFDF5" />

        <rect x="2" y="4" width="72" height="14" rx="2" fill="#7C3AED" />
        <rect x="6" y="6" width="64" height="10" rx="1" fill="#F5F3FF" />

        {/* Coffee Cup */}
        <g transform="translate(85, 10)">
          <path d="M0 8 L4 36 H24 L28 8 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
          <rect x="-2" y="4" width="32" height="6" rx="2" fill="#047857" />
          <circle cx="14" cy="22" r="5" fill="#10B981" />
          {/* Steam */}
          <path d="M8 -2 C8 -6 12 -6 12 -10" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
          <path d="M18 -2 C18 -6 22 -6 22 -10" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
        </g>

        {/* Potted Plant */}
        <g transform="translate(125, 0)">
          <path d="M6 24 L10 44 H30 L34 24 Z" fill="#94A3B8" />
          <path d="M20 24 C10 14 4 10 2 0 C14 4 18 12 20 24 Z" fill="#059669" />
          <path d="M20 24 C30 14 36 10 38 0 C26 4 22 12 20 24 Z" fill="#10B981" />
        </g>
      </g>
    </svg>
  );
}
