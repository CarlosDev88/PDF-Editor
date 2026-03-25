export function IconButton({ onClick, title, children, variant = 'default', className = '' }) {
    const variants = {
        default: 'text-slate-400 hover:text-slate-700 hover:bg-slate-100',
        danger: 'text-slate-400 hover:text-red-500 hover:bg-red-50',
        success: 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50',
    }
    return (
        <button
            onClick={onClick}
            title={title}
            className={`p-1.5 rounded transition-colors duration-150 ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    )
}