import {
  BookOpen, Calculator, Atom, Code2, Globe2, Dumbbell,
  Palette, Sparkles, Music, Coffee, Clock, HelpCircle, Layers
} from 'lucide-react';

export function getSubjectStyle(subjectName = '') {
  const name = String(subjectName).toLowerCase().trim();

  if (name.includes('math') || name.includes('algebra') || name.includes('geometry') || name.includes('calc')) {
    return {
      Icon: Calculator,
      accent: 'emerald',
      iconBox: 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-500/20',
      borderHover: 'hover:border-emerald-500/40 dark:hover:border-emerald-500/40',
      textAccent: 'text-emerald-600 dark:text-emerald-400',
    };
  }
  if (name.includes('computer') || name.includes('code') || name.includes('it') || name.includes('tech') || name.includes('program')) {
    return {
      Icon: Code2,
      accent: 'indigo',
      iconBox: 'bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-400 border border-indigo-500/20',
      borderHover: 'hover:border-indigo-500/40 dark:hover:border-indigo-500/40',
      textAccent: 'text-indigo-600 dark:text-indigo-400',
    };
  }
  if (name.includes('science') || name.includes('physics') || name.includes('chem') || name.includes('bio') || name.includes('lab')) {
    return {
      Icon: Atom,
      accent: 'sky',
      iconBox: 'bg-sky-500/10 text-sky-500 dark:bg-sky-500/15 dark:text-sky-400 border border-sky-500/20',
      borderHover: 'hover:border-sky-500/40 dark:hover:border-sky-500/40',
      textAccent: 'text-sky-600 dark:text-sky-400',
    };
  }
  if (name.includes('art') || name.includes('craft') || name.includes('draw') || name.includes('paint')) {
    return {
      Icon: Palette,
      accent: 'rose',
      iconBox: 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/15 dark:text-rose-400 border border-rose-500/20',
      borderHover: 'hover:border-rose-500/40 dark:hover:border-rose-500/40',
      textAccent: 'text-rose-600 dark:text-rose-400',
    };
  }
  if (name.includes('pe') || name.includes('physical') || name.includes('sport') || name.includes('pt') || name.includes('gym') || name.includes('yoga')) {
    return {
      Icon: Dumbbell,
      accent: 'emerald',
      iconBox: 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-500/20',
      borderHover: 'hover:border-emerald-500/40 dark:hover:border-emerald-500/40',
      textAccent: 'text-emerald-600 dark:text-emerald-400',
    };
  }
  if (name.includes('social') || name.includes('history') || name.includes('geography') || name.includes('civics') || name.includes('sst')) {
    return {
      Icon: Globe2,
      accent: 'purple',
      iconBox: 'bg-purple-500/10 text-purple-500 dark:bg-purple-500/15 dark:text-purple-400 border border-purple-500/20',
      borderHover: 'hover:border-purple-500/40 dark:hover:border-purple-500/40',
      textAccent: 'text-purple-600 dark:text-purple-400',
    };
  }
  if (name.includes('english') || name.includes('hindi') || name.includes('marathi') || name.includes('lang') || name.includes('french') || name.includes('spanish') || name.includes('sanskrit')) {
    return {
      Icon: BookOpen,
      accent: 'amber',
      iconBox: 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-500/20',
      borderHover: 'hover:border-amber-500/40 dark:hover:border-amber-500/40',
      textAccent: 'text-amber-600 dark:text-amber-400',
    };
  }
  if (name.includes('music') || name.includes('singing') || name.includes('dance')) {
    return {
      Icon: Music,
      accent: 'pink',
      iconBox: 'bg-pink-500/10 text-pink-500 dark:bg-pink-500/15 dark:text-pink-400 border border-pink-500/20',
      borderHover: 'hover:border-pink-500/40 dark:hover:border-pink-500/40',
      textAccent: 'text-pink-600 dark:text-pink-400',
    };
  }
  if (name.includes('gk') || name.includes('general knowledge') || name.includes('moral') || name.includes('value')) {
    return {
      Icon: Sparkles,
      accent: 'teal',
      iconBox: 'bg-teal-500/10 text-teal-500 dark:bg-teal-500/15 dark:text-teal-400 border border-teal-500/20',
      borderHover: 'hover:border-teal-500/40 dark:hover:border-teal-500/40',
      textAccent: 'text-teal-600 dark:text-teal-400',
    };
  }

  return {
    Icon: BookOpen,
    accent: 'emerald',
    iconBox: 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-500/20',
    borderHover: 'hover:border-emerald-500/40 dark:hover:border-emerald-500/40',
    textAccent: 'text-emerald-600 dark:text-emerald-400',
  };
}

export const DEFAULT_PERIOD_TIMES = [
  { pNo: 1, start: '08:00', end: '08:45' },
  { pNo: 2, start: '08:45', end: '09:30' },
  { pNo: 3, start: '09:45', end: '10:30' },
  { pNo: 4, start: '10:30', end: '11:15' },
  { pNo: 5, start: '11:30', end: '12:15' },
  { pNo: 6, start: '12:15', end: '01:00' },
  { pNo: 7, start: '02:00', end: '02:45' },
  { pNo: 8, start: '02:45', end: '03:30' },
];
