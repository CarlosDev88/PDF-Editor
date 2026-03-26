/**
 * Grilla de thumbnails con selección múltiple.
 *
 * @param {object}   props
 * @param {Array}    props.thumbnails   — [{ thumbnail_base64 }]
 * @param {Set}      props.selected     — Set de índices seleccionados
 * @param {Function} props.onToggle     — (index) => void
 */
export function PagePickerGrid({ thumbnails, selected, onToggle }) {
    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {thumbnails.map((page, i) => (
                <button
                    key={i}
                    onClick={() => onToggle(i)}
                    className={`relative rounded-lg border-2 transition-all duration-150 overflow-hidden
                        ${selected.has(i)
                            ? 'border-blue-500 shadow-md shadow-blue-100'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                >
                    {selected.has(i) && (
                        <div className="absolute top-1.5 right-1.5 z-10 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                            </svg>
                        </div>
                    )}
                    <img
                        src={page.thumbnail_base64}
                        alt={`Página ${i + 1}`}
                        className="w-full"
                        draggable={false}
                    />
                    <div className="py-1 text-center text-xs font-medium text-slate-500 border-t border-slate-100">
                        {i + 1}
                    </div>
                </button>
            ))}
        </div>
    )
}