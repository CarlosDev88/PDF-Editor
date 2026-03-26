import { Button } from '../atoms/Button'

export function SignPanel({
    signatures,
    instanceCount,
    onLoadSignature,
    onDeleteSig,
    onClearInstances,
    onDragStart,
}) {
    return (
        <div className="w-52 flex-shrink-0 bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-4">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Firmas</p>
            <p className="text-xs text-slate-400">Arrastra una firma al PDF para colocarla.</p>

            {signatures.map(sig => (
                <div key={sig.id} className="flex flex-col gap-2">
                    <div
                        className="bg-slate-50 rounded-lg p-2 border-2 border-dashed border-slate-300 hover:border-blue-400 cursor-grab active:cursor-grabbing transition-colors select-none"
                        onMouseDown={(e) => onDragStart(e, sig)}
                    >
                        <img
                            src={sig.src}
                            alt="Firma"
                            className="w-full object-contain max-h-16 pointer-events-none"
                            draggable={false}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400 truncate flex-1">{sig.filename}</p>
                        <button
                            onClick={() => onDeleteSig(sig.id)}
                            className="text-red-400 hover:text-red-600 ml-2 flex-shrink-0"
                            title="Eliminar firma"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            ))}

            <Button onClick={onLoadSignature} variant="primary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                {signatures.length === 0 ? 'Cargar firma' : 'Agregar otra firma'}
            </Button>

            {instanceCount > 0 && (
                <button
                    onClick={onClearInstances}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors text-left"
                >
                    Eliminar todas del PDF
                </button>
            )}
        </div>
    )
}