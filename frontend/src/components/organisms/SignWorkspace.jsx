import { useRef } from 'react'
import { Button } from '../atoms/Button'
import { Badge } from '../atoms/Badge'
import { PdfPage } from '../molecules/PdfPage'
import { SignatureInstance } from '../molecules/SignatureInstance'
import { SignPanel } from '../molecules/SignPanel'
import { usePdfDocument } from '../hooks/usePdfDocument'
import { useSignatures } from '../hooks/useSignatures'
import { usePdfSave } from '../hooks/usePdfSave'

const SCALE = 1.2


export function SignWorkspace() {
    const pdfContainerRef = useRef(null)
    const pdfInnerRef = useRef(null)

    // ── Lógica ────────────────────────────────────────────────────────────────
    const {
        pdfDoc, filename, numPages,
        isLoading, setIsLoading,
        status, setStatus,
        loadPdf, reset,
    } = usePdfDocument()

    const {
        signatures, instances,
        loadSignature, deleteSig, clearInstances,
        handlePanelDragStart,
        moveInstance, resizeInstance, deleteInstance,
    } = useSignatures(setStatus)

    const { save } = usePdfSave({
        pdfInnerRef,
        instances,
        setIsLoading,
        setStatus,
    })

    const hasFile = !!pdfDoc

    const handleReset = async () => {
        await reset()
        clearInstances()
    }


    return (
        <div className="flex flex-col gap-4">

            {/* Estado vacío */}
            {!hasFile && !isLoading && (
                <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-16 flex flex-col items-center gap-4">
                    <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-slate-500 text-sm">Ningún PDF cargado</p>
                    <Button onClick={loadPdf} variant="primary">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Abrir PDF
                    </Button>
                </div>
            )}

            {/* Loading overlay */}
            {isLoading && (
                <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-8 flex flex-col items-center gap-3 shadow-xl">
                        <svg className="w-10 h-10 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        <p className="text-slate-500 text-sm">Procesando...</p>
                    </div>
                </div>
            )}

            {hasFile && (
                <>
                    {/* Toolbar */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{filename}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <Badge variant="blue">{numPages} páginas</Badge>
                                {instances.length > 0 && (
                                    <Badge variant="amber">
                                        {instances.length} firma{instances.length > 1 ? 's' : ''} en el doc
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button
                                onClick={save}
                                variant="success"
                                disabled={instances.length === 0 || isLoading}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                </svg>
                                Guardar PDF firmado
                            </Button>

                            <Button onClick={handleReset} variant="danger" disabled={isLoading}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Resetear
                            </Button>
                        </div>
                    </div>

                    {/* Mensaje de estado */}
                    {status && (
                        <div className={`text-sm px-4 py-3 rounded-lg border ${status.type === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                            {status.type === 'success' ? '✓' : '✗'} {status.message}
                        </div>
                    )}

                    {/* Layout dos columnas */}
                    <div className="flex gap-4 items-start">

                        {/* Visor PDF */}
                        <div
                            ref={pdfContainerRef}
                            className="flex-1 bg-slate-200 rounded-xl overflow-auto"
                            style={{ height: '75vh' }}
                        >
                            <div
                                ref={pdfInnerRef}
                                className="relative flex flex-col gap-6 items-center py-6 px-6"
                                style={{ minHeight: '100%' }}
                            >
                                {Array.from({ length: numPages }, (_, i) => (
                                    <PdfPage
                                        key={i}
                                        pdfDoc={pdfDoc}
                                        pageNumber={i + 1}
                                        pageIndex={i}
                                        scale={SCALE}
                                    />
                                ))}

                                {instances.map(inst => (
                                    <SignatureInstance
                                        key={inst.id}
                                        id={inst.id}
                                        src={inst.src}
                                        x={inst.x}
                                        y={inst.y}
                                        width={inst.width}
                                        height={inst.height}
                                        onMove={moveInstance}
                                        onResize={resizeInstance}
                                        onDelete={deleteInstance}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Panel de firmas */}
                        <SignPanel
                            signatures={signatures}
                            instanceCount={instances.length}
                            onLoadSignature={loadSignature}
                            onDeleteSig={deleteSig}
                            onClearInstances={clearInstances}
                            onDragStart={(e, sig) => handlePanelDragStart(e, sig, pdfContainerRef, pdfInnerRef)}
                        />
                    </div>
                </>
            )}
        </div>
    )
}