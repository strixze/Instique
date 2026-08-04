const colors = {
  success: 'bg-green-900/50 text-green-300 border-green-700',
  warning: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
  danger: 'bg-red-900/50 text-red-300 border-red-700',
  info: 'bg-blue-900/50 text-blue-300 border-blue-700',
  primary: 'bg-indigo-900/50 text-indigo-300 border-indigo-700',
  gray: 'bg-gray-700 text-gray-300 border-gray-600',
};

export default function Badge({ children, color = 'gray', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[color]} ${className}`}>
      {children}
    </span>
  );
}
