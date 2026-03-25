import { useState } from 'react'
import { Button } from '../atoms/Button'
import { Badge } from '../atoms/Badge'
import { RangeInput } from '../molecules/RangeInput'

const MODES = [
    { id: 'ranges', label: 'Por rango' },
    { id: 'pages', label: 'Por páginas' },
]

export function SplitWorkspace() {
    const [mode, setMode] = useState('ranges')
    const [filename, setFilename] = useState('')
    const [totalPages, setTotalPages] = useState(0)
    const [thumbnails, setThumbnails] = useState([])
    const [selected, setSelected] = useState(new Set())
    const [ranges, setRanges] = useState([{ start: 1, end: 1 }])
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState(null)

    const hasFile = !!filename

    // ── Cargar PDF ──────────────────────────────────────────────────────────────
    const handleLoad = async () => {
        setIsLoading(true)
        setStatus(null)
        try {
            const res = await window.eel.api_splitter_load_pdf()()
            if (res.success) {
                setFilename(res.filename)
                setTotalPages(res.page_count)
                setThumbnails(res.thumbnails)
                setRanges([{ start: 1, end: res.page_count }])
                setSelected(new Set())
                setStatus(null)
            } else {
                setStatus({ type: 'error', message: res.error })
            }
        } catch (e) {
            setStatus({ type: 'error', message: 'Error al cargar el PDF.' })
        } finally {
            setIsLoading(false)
        }
    }

    // ── Selección de páginas ────────────────────────────────────────────────────
    const handleTogglePage = (index) => {
        setSelected(prev => {
            const next = new Set(prev)
            next.has(index) ? next.delete(index) : next.add(index)
            return next
        })
    }

    // ── Dividir ─────────────────────────────────────────────────────────────────
    const handleSplit = async () => {
        setIsLoading(true)
        setStatus(null)
        try {
            let res

            if (mode === 'ranges') {
                // Convertimos a índices 0-based
                const parsed = ranges.map(r => ({
                    start: r.start - 1,
                    end: r.end - 1
                }))
                res = await window.eel.api_splitter_by_ranges(parsed)()
            } else {
                const indices = Array.from(selected).sort((a, b) => a - b)
                res = await window.eel.api_splitter_by_pages(indices)()
            }

            if (res.success) {
                setStatus({
                    type: 'success',
                    message: `✓ ${res.count} PDF(s) generado(s) correctamente.`,
                    files: res.generated
                })
            } else {
                setStatus({ type: 'error', message: res.error })
            }
        } catch (e) {
            setStatus({ type: 'error', message: 'Error al dividir el PDF.' })
        } finally {
            setIsLoading(false)
        }
    }

    // ── Resetear ────────────────────────────────────────────────────────────────
    const handleReset = async () => {
        await window.eel.api_splitter_reset()()
        setFilename('')
        setTotalPages(0)
        setThumbnails([])
        setSelected(new Set())
        setRanges([{ start: 1, end: 1 }])
        setStatus(null)
    }

    const canSplit = mode === 'ranges'
        ? ranges.length > 0
        : selected.size > 0

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
                    <Button onClick={handleLoad} variant="primary">
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
                        <Button onClick={handleReset} variant="danger">
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
                                    onClick={() => { setMode(m.id); setSelected(new Set()) }}
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
                            {/* Modo: Por rango */}
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

                            {/* Modo: Por páginas */}
                            {mode === 'pages' && (
                                <div className="flex flex-col gap-4">
                                    <p className="text-sm text-slate-500">
                                        Selecciona las páginas. Cada página generará un PDF independiente.
                                    </p>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                                        {thumbnails.map((page, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleTogglePage(i)}
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
                                        <li key={i} className="text-xs text-emerald-600 truncate">
                                            • {f}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* Botón dividir */}
                    <Button
                        onClick={handleSplit}
                        variant="success"
                        disabled={!canSplit}
                        className="w-full py-4 text-base"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                        Dividir PDF
                        {mode === 'ranges' && ranges.length > 0 && ` (${ranges.length} archivo${ranges.length > 1 ? 's' : ''})`}
                        {/* {mode === 'pages' && selected.size > 0 && ` (${selected.size} archivo${selected.size > 1 ? 's' : ''})`} */}
                    </Button>
                </>
            )}
        </div>
    )
}