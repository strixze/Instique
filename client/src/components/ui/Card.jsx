export default function Card({ children, className = '', padding = true }) {
  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-xl ${padding ? 'p-5' : ''} ${className}`}>
      {children}
    </div>
  );
}
