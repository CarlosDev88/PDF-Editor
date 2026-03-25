export function Badge({ children, variant = 'default' }) {
    const variants = {
        default: 'bg-slate-100 text-slate-600',
        blue: 'bg-blue-100 text-blue-700',
        amber: 'bg-amber-100 text-amber-700',
        red: 'bg-red-100 text-red-700',
    }
    return (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${variants[variant]}`}>
            {children}
        </span>
    )
}