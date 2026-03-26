import { useState } from 'react'
import { Button } from '../atoms/Button'
import { Badge } from '../atoms/Badge'
import { RangeInput } from '../molecules/RangeInput'
import { PagePickerGrid } from '../molecules/PagePickerGrid'
import { useSplitterPdf } from '../hooks/useSplitterPdf'
import { usePageSelection } from '../hooks/usePageSelection'

const MODES = [
    { id: 'ranges', label: 'Por rango' },
    { id: 'pages', label: 'Por páginas' },
]

export function SplitWorkspace() {
    const [mode, setMode] = useState('ranges')

    const { selected, toggle, clear } = usePageSelection()

    const {
        filename, totalPages, thumbnails,
        ranges, setRanges,
        isLoading, status,
        load, splitByRanges, splitByPages, reset,
    } = useSplitterPdf(clear) // clear al cargar nuevo PDF

    const hasFile = !!filename

    const handleModeChange = (newMode) => {
        setMode(newMode)
        clear()
    }

    const handleSplit = () => {
        mode === 'ranges' ? splitByRanges() : splitByPages(selected)
    }

    const canSplit = mode === 'ranges' ? ranges.length > 0 : selected.size > 0

    return (
        <div className="flex flex-col gap-6">

            {/* Sin PDF cargado */}
            {!hasFile && !isLoading && (
                <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-16 flex flex-col items-center gap-4">
                    <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-slate-500 text-sm">Ningún PDF cargado</p>
                    <Button onClick={load} variant="primary">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Abrir PDF
                    </Button>
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div className="bg-white rounded-xl border border-slate-200 p-16 flex flex-col items-center gap-3">
                    <svg className="w-10 h-10 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <p className="text-slate-500 text-sm">Procesando...</p>
                </div>
            )}

            {/* Contenido principal */}
            {hasFile && !isLoading && (
                <>
                    {/* Header */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{filename}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="blue">{totalPages} páginas</Badge>
                                {mode === 'pages' && selected.size > 0 && (
                                    <Badge variant="amber">{selected.size} seleccionadas</Badge>
                                )}
                            </div>
                        </div>
                        <Button onClick={reset} variant="danger">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Resetear
                        </Button>
                    </div>

                    {/* Tabs de modo */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="flex border-b border-slate-200">
                            {MODES.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => handleModeChange(m.id)}
                                    className={`flex-1 py-3 text-sm font-semibold transition-colors duration-150
                                        ${mode === m.id
                                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>

                        <div className="p-6">
                            {mode === 'ranges' && (
                                <div className="flex flex-col gap-4">
                                    <p className="text-sm text-slate-500">
                                        Cada rango generará un PDF independiente.
                                    </p>
                                    <RangeInput
                                        ranges={ranges}
                                        totalPages={totalPages}
                                        onChange={setRanges}
                                    />
                                </div>
                            )}

                            {mode === 'pages' && (
                                <div className="flex flex-col gap-4">
                                    <p className="text-sm text-slate-500">
                                        Selecciona las páginas. Cada página generará un PDF independiente.
                                    </p>
                                    <PagePickerGrid
                                        thumbnails={thumbnails}
                                        selected={selected}
                                        onToggle={toggle}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status */}
                    {status && (
                        <div className={`text-sm px-4 py-3 rounded-lg border ${status.type === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                            <p>{status.message}</p>
                            {status.files && (
                                <ul className="mt-2 space-y-1">
                                    {status.files.map((f, i) => (
                                        <li key={i} className="text-xs text-emerald-600 truncate">• {f}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* Acción principal */}
                    <Button onClick={handleSplit} variant="success" disabled={!canSplit} className="w-full py-4 text-base">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                        Dividir PDF
                        {mode === 'ranges' && ranges.length > 0 && ` (${ranges.length} archivo${ranges.length > 1 ? 's' : ''})`}
                    </Button>
                </>
            )}
        </div>
    )
}