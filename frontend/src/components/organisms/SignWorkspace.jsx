import { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from '../atoms/Button'
import { Badge } from '../atoms/Badge'

const DEFAULT_SIG_WIDTH = 150
const DEFAULT_SIG_HEIGHT = 60

// ── Página PDF en canvas ───────────────────────────────────────────────────────
function PdfPage({ pdfDoc, pageNumber, pageIndex, scale }) {
    const canvasRef = useRef(null)

    useEffect(() => {
        if (!pdfDoc) return
        let cancelled = false
        const render = async () => {
            const page = await pdfDoc.getPage(pageNumber)
            const viewport = page.getViewport({ scale })
            const canvas = canvasRef.current
            if (!canvas || cancelled) return
            canvas.width = viewport.width
            canvas.height = viewport.height
            await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
        }
        render()
        return () => { cancelled = true }
    }, [pdfDoc, pageNumber, scale])

    return (
        <div className="relative bg-white shadow-lg" data-page={pageIndex}>
            <canvas ref={canvasRef} />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full pointer-events-none">
                {pageNumber}
            </div>
        </div>
    )
}

// ── Instancia de firma con drag y resize nativos ───────────────────────────────
function SignatureInstance({ id, src, x, y, width, height, onMove, onResize, onDelete }) {
    const nodeRef = useRef(null)
    const isDragging = useRef(false)
    const isResizing = useRef(false)
    const dragStart = useRef({ mouseX: 0, mouseY: 0, x: 0, y: 0 })
    const resizeStart = useRef({ mouseX: 0, mouseY: 0, width: 0, height: 0 })

    // ── Drag ──────────────────────────────────────────────────────────────────
    const handleMouseDownDrag = (e) => {
        if (e.target.closest('.resize-handle')) return
        e.preventDefault()
        e.stopPropagation()
        isDragging.current = true
        dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, x, y }

        const onMove_ = (ev) => {
            if (!isDragging.current) return
            const dx = ev.clientX - dragStart.current.mouseX
            const dy = ev.clientY - dragStart.current.mouseY
            onMove(id, { x: dragStart.current.x + dx, y: dragStart.current.y + dy })
        }
        const onUp = () => {
            isDragging.current = false
            window.removeEventListener('mousemove', onMove_)
            window.removeEventListener('mouseup', onUp)
        }
        window.addEventListener('mousemove', onMove_)
        window.addEventListener('mouseup', onUp)
    }

    // ── Resize ────────────────────────────────────────────────────────────────
    const handleMouseDownResize = (e) => {
        e.preventDefault()
        e.stopPropagation()
        isResizing.current = true
        resizeStart.current = { mouseX: e.clientX, mouseY: e.clientY, width, height }

        const onResize_ = (ev) => {
            if (!isResizing.current) return
            const dw = ev.clientX - resizeStart.current.mouseX
            const dh = ev.clientY - resizeStart.current.mouseY
            onResize(id, {
                width: Math.max(40, resizeStart.current.width + dw),
                height: Math.max(20, resizeStart.current.height + dh)
            })
        }
        const onUp = () => {
            isResizing.current = false
            window.removeEventListener('mousemove', onResize_)
            window.removeEventListener('mouseup', onUp)
        }
        window.addEventListener('mousemove', onResize_)
        window.addEventListener('mouseup', onUp)
    }

    return (
        <div
            ref={nodeRef}
            style={{
                position: 'absolute',
                left: x,
                top: y,
                width,
                height,
                zIndex: 50,
                cursor: 'move',
                userSelect: 'none',
            }}
            onMouseDown={handleMouseDownDrag}
            className="group"
        >
            <img
                src={src}
                alt="Firma"
                style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
                draggable={false}
            />

            {/* Borde al hover */}
            <div className="absolute inset-0 border-2 border-dashed border-blue-400 opacity-0 group-hover:opacity-100 rounded pointer-events-none" />

            {/* Botón eliminar */}
            <button
                onMouseDown={e => e.stopPropagation()}
                onClick={() => onDelete(id)}
                className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-md z-20 cursor-pointer"
            >✕</button>

            {/* Handle resize (esquina inferior derecha) */}
            <div
                className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-100 z-20"
                style={{ background: 'rgba(59,130,246,0.7)', borderRadius: '2px 0 2px 0' }}
                onMouseDown={handleMouseDownResize}
            />
            {/* Handle resize esquina inferior izquierda */}
            <div
                className="resize-handle absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize opacity-0 group-hover:opacity-100 z-20"
                style={{ background: 'rgba(59,130,246,0.7)', borderRadius: '0 2px 0 2px' }}
                onMouseDown={(e) => {
                    e.preventDefault(); e.stopPropagation()
                    isResizing.current = true
                    resizeStart.current = { mouseX: e.clientX, mouseY: e.clientY, width, height, x }
                    const onR = (ev) => {
                        if (!isResizing.current) return
                        const dw = -(ev.clientX - resizeStart.current.mouseX)
                        const dh = ev.clientY - resizeStart.current.mouseY
                        const newW = Math.max(40, resizeStart.current.width + dw)
                        const newH = Math.max(20, resizeStart.current.height + dh)
                        onMove(id, { x: resizeStart.current.x + (resizeStart.current.width - newW), y })
                        onResize(id, { width: newW, height: newH })
                    }
                    const onU = () => { isResizing.current = false; window.removeEventListener('mousemove', onR); window.removeEventListener('mouseup', onU) }
                    window.addEventListener('mousemove', onR)
                    window.addEventListener('mouseup', onU)
                }}
            />
        </div>
    )
}

// ── Workspace principal ────────────────────────────────────────────────────────
export function SignWorkspace() {
    const [pdfDoc, setPdfDoc] = useState(null)
    const [filename, setFilename] = useState('')
    const [numPages, setNumPages] = useState(0)
    const [scale] = useState(1.2)
    // signatures: [{ id, src, filename }]
    const [signatures, setSignatures] = useState([])
    // instances: [{ id, sigId, x, y, width, height }]
    const [instances, setInstances] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState(null)
    const pdfContainerRef = useRef(null)
    const pdfInnerRef = useRef(null)
    const nextInstId = useRef(1)
    const nextSigId = useRef(1)

    const hasFile = !!pdfDoc

    const getPdfjsLib = async () => {
        const lib = await import('pdfjs-dist')
        lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
        return lib
    }

    // ── Cargar PDF ──────────────────────────────────────────────────────────────
    const handleLoadPdf = async () => {
        setIsLoading(true); setStatus(null)
        try {
            const res = await window.eel.api_signer_load_pdf()()
            if (!res.success) { setStatus({ type: 'error', message: res.error }); return }
            const b64res = await window.eel.api_signer_get_pdf_base64()()
            if (!b64res.success) { setStatus({ type: 'error', message: b64res.error }); return }
            const base64 = b64res.pdf_base64.split(',')[1]
            const binary = atob(base64)
            const bytes = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
            const lib = await getPdfjsLib()
            const doc = await lib.getDocument({ data: bytes }).promise
            setPdfDoc(doc); setNumPages(doc.numPages); setFilename(res.filename)
            setInstances([]); setStatus(null)
        } catch (e) {
            setStatus({ type: 'error', message: `Error: ${e.message}` })
        } finally { setIsLoading(false) }
    }

    // ── Cargar firma (agrega a la lista) ────────────────────────────────────────
    const handleLoadSignature = async () => {
        try {
            const res = await window.eel.api_signer_load_signature()()
            if (res.success) {
                setSignatures(prev => [...prev, {
                    id: nextSigId.current++,
                    src: res.signature_base64,
                    filename: res.filename
                }])
                setStatus({ type: 'success', message: `Firma cargada: ${res.filename}` })
            } else {
                setStatus({ type: 'error', message: res.error })
            }
        } catch (e) {
            setStatus({ type: 'error', message: 'Error al cargar la firma.' })
        }
    }

    // ── Arrastrar firma del panel al PDF ────────────────────────────────────────
    const handlePanelSigDragStart = (e, sig) => {
        e.preventDefault()
        const startX = e.clientX
        const startY = e.clientY

        const ghost = document.createElement('img')
        ghost.src = sig.src
        ghost.style.cssText = `position:fixed;width:${DEFAULT_SIG_WIDTH}px;height:${DEFAULT_SIG_HEIGHT}px;object-fit:contain;pointer-events:none;opacity:0.7;z-index:9999;left:${startX - DEFAULT_SIG_WIDTH / 2}px;top:${startY - DEFAULT_SIG_HEIGHT / 2}px;`
        document.body.appendChild(ghost)

        const onMove = (ev) => {
            ghost.style.left = `${ev.clientX - DEFAULT_SIG_WIDTH / 2}px`
            ghost.style.top = `${ev.clientY - DEFAULT_SIG_HEIGHT / 2}px`
        }

        const onUp = (ev) => {
            document.body.removeChild(ghost)
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)

            // Usamos los refs directamente sin redeclarar
            if (!pdfContainerRef.current || !pdfInnerRef.current) return

            const contRect = pdfContainerRef.current.getBoundingClientRect()
            const innerRect = pdfInnerRef.current.getBoundingClientRect()

            if (ev.clientX < contRect.left || ev.clientX > contRect.right ||
                ev.clientY < contRect.top || ev.clientY > contRect.bottom) return

            const x = ev.clientX - innerRect.left - DEFAULT_SIG_WIDTH / 2
            const y = ev.clientY - innerRect.top - DEFAULT_SIG_HEIGHT / 2

            console.log('Insertando firma en:', { x: Math.max(0, x), y: Math.max(0, y) })
            console.log('scroll:', { scrollTop: pdfContainerRef.current.scrollTop, scrollLeft: pdfContainerRef.current.scrollLeft })

            setInstances(prev => [...prev, {
                id: nextInstId.current++,
                sigId: sig.id,
                src: sig.src,
                x: Math.max(0, x),
                y: Math.max(0, y),
                width: DEFAULT_SIG_WIDTH,
                height: DEFAULT_SIG_HEIGHT
            }])
        }

        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
    }

    // ── Mover instancia ─────────────────────────────────────────────────────────
    const handleMove = useCallback((id, pos) => {
        setInstances(prev => prev.map(inst =>
            inst.id === id ? { ...inst, x: pos.x, y: pos.y } : inst
        ))
    }, [])

    // ── Resize instancia ────────────────────────────────────────────────────────
    const handleResize = useCallback((id, size) => {
        setInstances(prev => prev.map(inst =>
            inst.id === id ? { ...inst, ...size } : inst
        ))
    }, [])

    // ── Eliminar instancia ──────────────────────────────────────────────────────
    const handleDelete = useCallback((id) => {
        setInstances(prev => prev.filter(inst => inst.id !== id))
    }, [])

    // ── Eliminar firma del panel ────────────────────────────────────────────────
    const handleDeleteSig = (sigId) => {
        setSignatures(prev => prev.filter(s => s.id !== sigId))
        setInstances(prev => prev.filter(inst => inst.sigId !== sigId))
    }

    // ── Guardar ─────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (instances.length === 0) {
            setStatus({ type: 'error', message: 'Agrega al menos una firma al PDF.' })
            return
        }
        setIsLoading(true)
        setStatus(null)
        try {
            const sizesRes = await window.eel.api_signer_get_page_sizes()()
            const inner = pdfInnerRef.current
            const pageEls = inner.querySelectorAll('[data-page]')
            const innerRect = inner.getBoundingClientRect()
            const pageOffsets = []

            for (const el of pageEls) {
                const idx = parseInt(el.dataset.page)
                pageOffsets.push({
                    pageIndex: idx,
                    top: el.offsetTop,    // relativo al inner, estático
                    left: el.offsetLeft,   // relativo al inner, estático
                    height: el.offsetHeight,
                    width: el.offsetWidth,
                    pdfHeight: sizesRes.sizes[idx]?.height || 842,
                    pdfWidth: sizesRes.sizes[idx]?.width || 595,
                })
            }

            console.log('innerRect.top:', innerRect.top)
            console.log('gap entre páginas:', pageOffsets[1]?.top - pageOffsets[0]?.top - pageOffsets[0]?.height)
            console.log('pageOffsets[0]:', pageOffsets[0])
            console.log('pageOffsets[2]:', pageOffsets[2])

            const placementsBySig = {}
            instances.forEach(inst => {
                if (!placementsBySig[inst.sigId]) {
                    placementsBySig[inst.sigId] = { src: inst.src, placements: [] }
                }

                const centerY = inst.y + inst.height / 2
                let target = pageOffsets[pageOffsets.length - 1]
                for (const po of pageOffsets) {
                    if (centerY >= po.top && centerY <= po.top + po.height) {
                        target = po; break
                    }
                }

                console.log(`Instancia ${inst.id}: x=${inst.x}, y=${inst.y}`)
                console.log(`Página target: top=${target.top}, left=${target.left}, h=${target.height}, w=${target.width}`)
                console.log(`PDF size: ${target.pdfWidth}x${target.pdfHeight}`)

                const relX = inst.x - target.left
                const relY = inst.y - target.top

                console.log(`relX=${relX}, relY=${relY}`)

                // Factor de escala píxeles → puntos PDF
                const scaleX = target.pdfWidth / target.width
                const scaleY = target.pdfHeight / target.height

                const pdfX = relX * scaleX
                // PDF: origen abajo-izquierda, CSS: origen arriba-izquierda
                const pdfY = relY * scaleY

                console.log(`pdfX=${pdfX}, pdfY=${pdfY}, pdfW=${inst.width * scaleX}, pdfH=${inst.height * scaleY}`)

                placementsBySig[inst.sigId].placements.push({
                    page: target.pageIndex,
                    x: Math.max(0, pdfX),
                    y: Math.max(0, pdfY),
                    width: inst.width * scaleX,
                    height: inst.height * scaleY
                })
            })

            const res = await window.eel.api_signer_save_multi(
                Object.values(placementsBySig).map(s => ({
                    signature_base64: s.src,
                    placements: s.placements
                }))
            )()

            if (res.success) {
                setStatus({ type: 'success', message: `PDF guardado en: ${res.output_path}` })
            } else {
                setStatus({ type: 'error', message: res.error })
            }
        } catch (e) {
            console.error(e)
            setStatus({ type: 'error', message: `Error: ${e.message}` })
        } finally {
            setIsLoading(false)
        }
    }
    // ── Reset ───────────────────────────────────────────────────────────────────
    const handleReset = async () => {
        await window.eel.api_signer_reset()()
        setPdfDoc(null); setFilename(''); setNumPages(0)
        setSignatures([]); setInstances([]); setStatus(null)
    }

    return (
        <div className="flex flex-col gap-4">

            {!hasFile && !isLoading && (
                <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-16 flex flex-col items-center gap-4">
                    <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-slate-500 text-sm">Ningún PDF cargado</p>
                    <Button onClick={handleLoadPdf} variant="primary">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Abrir PDF
                    </Button>
                </div>
            )}

            {/* {isLoading && (
                <div className="bg-white rounded-xl border border-slate-200 p-16 flex flex-col items-center gap-3">
                    <svg className="w-10 h-10 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <p className="text-slate-500 text-sm">Procesando...</p>
                </div>
            )} */}

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
                                    <Badge variant="amber">{instances.length} firma{instances.length > 1 ? 's' : ''} en el doc</Badge>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button onClick={handleSave} variant="success" disabled={instances.length === 0 || isLoading}>
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
                                        scale={scale}
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
                                        onMove={handleMove}
                                        onResize={handleResize}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Panel derecho */}
                        <div className="w-52 flex-shrink-0 bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-4">
                            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Firmas</p>
                            <p className="text-xs text-slate-400">Arrastra una firma al PDF para colocarla.</p>

                            {signatures.map(sig => (
                                <div key={sig.id} className="flex flex-col gap-2">
                                    <div
                                        className="bg-slate-50 rounded-lg p-2 border-2 border-dashed border-slate-300 hover:border-blue-400 cursor-grab active:cursor-grabbing transition-colors select-none"
                                        onMouseDown={(e) => handlePanelSigDragStart(e, sig)}
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
                                            onClick={() => handleDeleteSig(sig.id)}
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

                            <Button onClick={handleLoadSignature} variant="primary">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                {signatures.length === 0 ? 'Cargar firma' : 'Agregar otra firma'}
                            </Button>

                            {instances.length > 0 && (
                                <button
                                    onClick={() => setInstances([])}
                                    className="text-xs text-red-400 hover:text-red-600 transition-colors text-left"
                                >
                                    Eliminar todas del PDF
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}