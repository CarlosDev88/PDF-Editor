import { useState, useCallback, useRef } from 'react'

const DEFAULT_SIG_WIDTH = 150
const DEFAULT_SIG_HEIGHT = 60


export function useSignatures(setStatus) {
    const [signatures, setSignatures] = useState([])
    const [instances, setInstances] = useState([])

    const nextInstId = useRef(1)
    const nextSigId = useRef(1)

    // ── Cargar firma al panel ───────────────────────────────────────────────
    const loadSignature = async () => {
        try {
            const res = await window.eel.api_signer_load_signature()()
            if (res.success) {
                setSignatures(prev => [...prev, {
                    id: nextSigId.current++,
                    src: res.signature_base64,
                    filename: res.filename,
                }])
                setStatus({ type: 'success', message: `Firma cargada: ${res.filename}` })
            } else {
                setStatus({ type: 'error', message: res.error })
            }
        } catch {
            setStatus({ type: 'error', message: 'Error al cargar la firma.' })
        }
    }

    // ── Eliminar firma del panel (y sus instancias) ─────────────────────────
    const deleteSig = useCallback((sigId) => {
        setSignatures(prev => prev.filter(s => s.id !== sigId))
        setInstances(prev => prev.filter(inst => inst.sigId !== sigId))
    }, [])

    // ── Limpiar todas las instancias ────────────────────────────────────────
    const clearInstances = useCallback(() => setInstances([]), [])

    // ── Drag desde panel → PDF ──────────────────────────────────────────────
    const handlePanelDragStart = useCallback((e, sig, pdfContainerRef, pdfInnerRef) => {
        e.preventDefault()

        const ghost = document.createElement('img')
        ghost.src = sig.src
        ghost.style.cssText = [
            'position:fixed',
            `width:${DEFAULT_SIG_WIDTH}px`,
            `height:${DEFAULT_SIG_HEIGHT}px`,
            'object-fit:contain',
            'pointer-events:none',
            'opacity:0.7',
            'z-index:9999',
            `left:${e.clientX - DEFAULT_SIG_WIDTH / 2}px`,
            `top:${e.clientY - DEFAULT_SIG_HEIGHT / 2}px`,
        ].join(';')
        document.body.appendChild(ghost)

        const onMove = (ev) => {
            ghost.style.left = `${ev.clientX - DEFAULT_SIG_WIDTH / 2}px`
            ghost.style.top = `${ev.clientY - DEFAULT_SIG_HEIGHT / 2}px`
        }

        const onUp = (ev) => {
            document.body.removeChild(ghost)
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)

            if (!pdfContainerRef.current || !pdfInnerRef.current) return

            const contRect = pdfContainerRef.current.getBoundingClientRect()
            const innerRect = pdfInnerRef.current.getBoundingClientRect()

            const outsideContainer =
                ev.clientX < contRect.left || ev.clientX > contRect.right ||
                ev.clientY < contRect.top || ev.clientY > contRect.bottom

            if (outsideContainer) return

            const x = ev.clientX - innerRect.left - DEFAULT_SIG_WIDTH / 2
            const y = ev.clientY - innerRect.top - DEFAULT_SIG_HEIGHT / 2

            setInstances(prev => [...prev, {
                id: nextInstId.current++,
                sigId: sig.id,
                src: sig.src,
                x: Math.max(0, x),
                y: Math.max(0, y),
                width: DEFAULT_SIG_WIDTH,
                height: DEFAULT_SIG_HEIGHT,
            }])
        }

        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
    }, [])

    // ── Mutaciones de instancias ────────────────────────────────────────────
    const moveInstance = useCallback((id, pos) => {
        setInstances(prev => prev.map(inst =>
            inst.id === id ? { ...inst, x: pos.x, y: pos.y } : inst
        ))
    }, [])

    const resizeInstance = useCallback((id, size) => {
        setInstances(prev => prev.map(inst =>
            inst.id === id ? { ...inst, ...size } : inst
        ))
    }, [])

    const deleteInstance = useCallback((id) => {
        setInstances(prev => prev.filter(inst => inst.id !== id))
    }, [])

    return {
        signatures,
        instances,
        loadSignature,
        deleteSig,
        clearInstances,
        handlePanelDragStart,
        moveInstance,
        resizeInstance,
        deleteInstance,
    }
}