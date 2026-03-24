export function FileListItem({ ruta, index, onRemove, dragHandleProps }) {
    const filename = ruta.split(/[\\/]/).pop(); // solo el nombre del archivo

    return (
        <li className="text-slate-600 bg-white p-3 rounded border border-slate-200 shadow-sm text-sm flex items-center gap-3 group">

            {/* Handle de drag */}
            <span
                {...dragHandleProps}
                className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing flex-shrink-0"
                title="Arrastrar para reordenar"
            >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
                    <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                    <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
                </svg>
            </span>

            {/* Número */}
            <span className="font-bold text-blue-600 flex-shrink-0">{index + 1}.</span>

            {/* Nombre del archivo con tooltip de ruta completa */}
            <span className="truncate flex-1" title={ruta}>{filename}</span>

            {/* Botón eliminar */}
            <button
                onClick={() => onRemove(index)}
                className="flex-shrink-0 text-slate-300 hover:text-red-500 transition-colors duration-150 opacity-0 group-hover:opacity-100"
                title="Eliminar"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </li>
    );
}