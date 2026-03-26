import { useRef } from 'react'

export function SignatureInstance({ id, src, x, y, width, height, onMove, onResize, onDelete }) {
    const isDragging = useRef(false)
    const isResizing = useRef(false)
    const dragStart = useRef({ mouseX: 0, mouseY: 0, x: 0, y: 0 })
    const resizeStart = useRef({ mouseX: 0, mouseY: 0, width: 0, height: 0, x: 0 })

    // ── Drag ──────────────────────────────────────────────────────────────────
    const handleMouseDownDrag = (e) => {
        if (e.target.closest('.resize-handle')) return
        e.preventDefault()
        e.stopPropagation()
        isDragging.current = true
        dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, x, y }

        const onMoveHandler = (ev) => {
            if (!isDragging.current) return
            onMove(id, {
                x: dragStart.current.x + (ev.clientX - dragStart.current.mouseX),
                y: dragStart.current.y + (ev.clientY - dragStart.current.mouseY),
            })
        }
        const onUp = () => {
            isDragging.current = false
            window.removeEventListener('mousemove', onMoveHandler)
            window.removeEventListener('mouseup', onUp)
        }
        window.addEventListener('mousemove', onMoveHandler)
        window.addEventListener('mouseup', onUp)
    }

    // ── Resize esquina inferior derecha ───────────────────────────────────────
    const handleMouseDownResizeSE = (e) => {
        e.preventDefault()
        e.stopPropagation()
        isResizing.current = true
        resizeStart.current = { mouseX: e.clientX, mouseY: e.clientY, width, height }

        const onResizeHandler = (ev) => {
            if (!isResizing.current) return
            onResize(id, {
                width: Math.max(40, resizeStart.current.width + (ev.clientX - resizeStart.current.mouseX)),
                height: Math.max(20, resizeStart.current.height + (ev.clientY - resizeStart.current.mouseY)),
            })
        }
        const onUp = () => {
            isResizing.current = false
            window.removeEventListener('mousemove', onResizeHandler)
            window.removeEventListener('mouseup', onUp)
        }
        window.addEventListener('mousemove', onResizeHandler)
        window.addEventListener('mouseup', onUp)
    }

    // ── Resize esquina inferior izquierda ─────────────────────────────────────
    const handleMouseDownResizeSW = (e) => {
        e.preventDefault()
        e.stopPropagation()
        isResizing.current = true
        resizeStart.current = { mouseX: e.clientX, mouseY: e.clientY, width, height, x }

        const onResizeHandler = (ev) => {
            if (!isResizing.current) return
            const dw = -(ev.clientX - resizeStart.current.mouseX)
            const newW = Math.max(40, resizeStart.current.width + dw)
            const newH = Math.max(20, resizeStart.current.height + (ev.clientY - resizeStart.current.mouseY))
            onMove(id, { x: resizeStart.current.x + (resizeStart.current.width - newW), y })
            onResize(id, { width: newW, height: newH })
        }
        const onUp = () => {
            isResizing.current = false
            window.removeEventListener('mousemove', onResizeHandler)
            window.removeEventListener('mouseup', onUp)
        }
        window.addEventListener('mousemove', onResizeHandler)
        window.addEventListener('mouseup', onUp)
    }

    return (
        <div
            style={{ position: 'absolute', left: x, top: y, width, height, zIndex: 50, cursor: 'move', userSelect: 'none' }}
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

            {/* Handle SE */}
            <div
                className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-100 z-20"
                style={{ background: 'rgba(59,130,246,0.7)', borderRadius: '2px 0 2px 0' }}
                onMouseDown={handleMouseDownResizeSE}
            />

            {/* Handle SW */}
            <div
                className="resize-handle absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize opacity-0 group-hover:opacity-100 z-20"
                style={{ background: 'rgba(59,130,246,0.7)', borderRadius: '0 2px 0 2px' }}
                onMouseDown={handleMouseDownResizeSW}
            />
        </div>
    )
}