import { IconButton } from '../atoms/IconButton'

export function RangeInput({ ranges, totalPages, onChange }) {

    const addRange = () => {
        onChange([...ranges, { start: 1, end: totalPages }])
    }

    const removeRange = (index) => {
        onChange(ranges.filter((_, i) => i !== index))
    }

    const updateRange = (index, field, value) => {
        // Permitimos string vacío mientras escribe, validamos al salir
        const updated = ranges.map((r, i) => {
            if (i !== index) return r
            return { ...r, [field]: value }
        })
        onChange(updated)
    }

    const validateRange = (index, field, value) => {
        let num = parseInt(value)
        if (isNaN(num) || num < 1) num = 1
        if (num > totalPages) num = totalPages
        const updated = ranges.map((r, i) => {
            if (i !== index) return r
            return { ...r, [field]: num }
        })
        onChange(updated)
    }

    return (
        <div className="flex flex-col gap-3">
            {ranges.map((range, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <span className="text-xs font-semibold text-slate-500 w-16 flex-shrink-0">
                        Rango {i + 1}
                    </span>
                    <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs text-slate-500">de pág.</span>
                        <input
                            type="number"
                            min={1}
                            max={totalPages}
                            value={range.start}
                            onChange={e => updateRange(i, 'start', e.target.value)}
                            onBlur={e => validateRange(i, 'start', e.target.value)}
                            className="w-16 text-center text-sm border border-slate-300 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                        />
                        <span className="text-xs text-slate-500">a pág.</span>
                        <input
                            type="number"
                            min={1}
                            max={totalPages}
                            value={range.end}
                            onChange={e => updateRange(i, 'end', e.target.value)}
                            onBlur={e => validateRange(i, 'end', e.target.value)}
                            className="w-16 text-center text-sm border border-slate-300 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                        />
                    </div>
                    {ranges.length > 1 && (
                        <IconButton onClick={() => removeRange(i)} variant="danger" title="Eliminar rango">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </IconButton>
                    )}
                </div>
            ))}
            <button
                onClick={addRange}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Añadir rango
            </button>
        </div>
    )
}