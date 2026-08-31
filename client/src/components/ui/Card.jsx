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
      className={`bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl shadow-2xs ${
        hover ? 'hover:shadow-card hover:border-slate-300 dark:hover:border-dark-border-strong transition-all duration-150 cursor-pointer' : ''
      } ${padding ? 'p-4 sm:p-5' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
