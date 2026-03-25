import { IconButton } from '../atoms/IconButton'

export function PageThumbnail({ page, index, selected, onSelect, onDelete, dragHandleProps, draggableProps, innerRef }) {
    return (
        <div
            ref={innerRef}
            {...draggableProps}
            className={`relative bg-white rounded-lg border-2 transition-all duration-150 shadow-sm group
        ${selected ? 'border-blue-500 shadow-blue-100' : 'border-slate-200 hover:border-slate-300'}`}
        >
            {/* Checkbox selección */}
            <div className="absolute top-2 left-2 z-10">
                <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onSelect(index)}
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
            </div>

            {/* Handle drag */}
            <div
                {...dragHandleProps}
                className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-slate-400"
            >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
                    <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                    <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
                </svg>
            </div>

            {/* Thumbnail imagen */}
            <div className="p-2 pt-6">
                <img
                    src={page.thumbnail_base64}
                    alt={`Página ${index + 1}`}
                    className="w-full rounded shadow-sm"
                    draggable={false}
                />
            </div>

            {/* Footer con número y botón eliminar */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-500">Pág. {index + 1}</span>
                <IconButton onClick={() => onDelete(index)} title="Eliminar página" variant="danger">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </IconButton>
            </div>
        </div>
    )
}