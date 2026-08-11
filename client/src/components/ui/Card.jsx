export default function Card({ children, className = '', padding = true }) {
  return (
    <div className={`bg-white border border-border rounded-card shadow-card ${padding ? 'p-5' : ''} ${className}`}>
      {children}
    </div>
  );
}
