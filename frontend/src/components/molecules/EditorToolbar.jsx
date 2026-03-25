import { Button } from '../atoms/Button'
import { Badge } from '../atoms/Badge'

export function EditorToolbar({
    filename,
    totalPages,
    selectedCount,
    onDeleteSelected,
    onInsertAfter,
    onSave,
    onReset,
    hasPages,
}) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3">

            {/* Info archivo */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{filename}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="blue">{totalPages} páginas</Badge>
                    {selectedCount > 0 && (
                        <Badge variant="amber">{selectedCount} seleccionadas</Badge>
                    )}
                </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap items-center gap-2">

                {selectedCount > 0 && (
                    <Button onClick={onDeleteSelected} variant="danger">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Eliminar ({selectedCount})
                    </Button>
                )}

                <Button onClick={onInsertAfter} variant="primary">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Insertar páginas
                </Button>

                <Button onClick={onSave} variant="success" disabled={!hasPages}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Guardar
                </Button>

                <Button onClick={onReset} variant="danger">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Resetear
                </Button>
            </div>
        </div>
    )
}