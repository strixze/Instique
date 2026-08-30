export default function Card({
  children,
  className = '',
  padding = true,
  hover = false,
  onClick,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-border rounded-xl shadow-2xs ${
        hover ? 'hover:shadow-card hover:border-slate-300 transition-all duration-150 cursor-pointer' : ''
      } ${padding ? 'p-4 sm:p-5' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
