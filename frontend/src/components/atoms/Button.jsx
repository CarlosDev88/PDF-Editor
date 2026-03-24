// Un botón genérico y reutilizable en toda la app
export function Button({ children, onClick, disabled, variant = 'primary', className = '' }) {
  const baseStyle = "px-6 py-3 font-semibold rounded-lg shadow-sm transition-colors duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300",
    danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}