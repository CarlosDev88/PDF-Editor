import { useState } from 'react'

/**
 * Gestiona el ciclo de vida del PDF en el editor de páginas:
 * cargar, reordenar, eliminar, insertar y guardar.
 *
 * Recibe `onPagesChange` para notificar al consumidor cuando
 * las páginas cambian, lo que le permite limpiar la selección
 * sin que este hook necesite saber que existe una selección.
 *
 * @param {Function} onPagesChange — callback() invocado tras cualquier
 *                                   mutación exitosa de páginas
 */
export function useEditorPages(onPagesChange) {
    const [pages, setPages] = useState([])
    const [filename, setFilename] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState(null)

    // Helper para ejecutar una operación async con el patrón común
    const run = async (operation) => {
        setIsLoading(true)
        setStatus(null)
        try {
            await operation()
        } finally {
            setIsLoading(false)
        }
    }

    // Helper para aplicar un nuevo orden de páginas al backend
    const applyOrder = async (newOrder) => {
        const res = await window.eel.api_editor_apply_order(newOrder)()
        if (res.success) {
            setPages(res.thumbnails)
            onPagesChange?.()
        } else {
            setStatus({ type: 'error', message: res.error })
        }
    }

    // ── Cargar ──────────────────────────────────────────────────────────────
    const load = () => run(async () => {
        try {
            const res = await window.eel.api_editor_load_pdf()()
            if (res.success) {
                setPages(res.thumbnails)
                setFilename(res.filename)
                onPagesChange?.()
            } else {
                setStatus({ type: 'error', message: res.error })
            }
        } catch {
            setStatus({ type: 'error', message: 'Error al cargar el PDF.' })
        }
    })

    // ── Reordenar (drag & drop) ─────────────────────────────────────────────
    const reorder = (sourceIndex, destinationIndex) => {
        if (sourceIndex === destinationIndex) return

        // Actualización optimista: refleja el cambio visualmente de inmediato
        const reordenado = Array.from(pages)
        const [movido] = reordenado.splice(sourceIndex, 1)
        reordenado.splice(destinationIndex, 0, movido)
        setPages(reordenado)
        onPagesChange?.()

        run(async () => {
            try {
                await applyOrder(reordenado.map(p => p.page_index))
            } catch {
                setStatus({ type: 'error', message: 'Error al reordenar.' })
            }
        })
    }

    // ── Eliminar una página por índice visual ───────────────────────────────
    const deletePage = (index) => run(async () => {
        try {
            const newOrder = pages.filter((_, i) => i !== index).map(p => p.page_index)
            await applyOrder(newOrder)
        } catch {
            setStatus({ type: 'error', message: 'Error al eliminar.' })
        }
    })

    // ── Eliminar páginas seleccionadas ──────────────────────────────────────
    const deleteSelected = (selected) => run(async () => {
        try {
            const newOrder = pages.filter((_, i) => !selected.has(i)).map(p => p.page_index)
            await applyOrder(newOrder)
        } catch {
            setStatus({ type: 'error', message: 'Error al eliminar.' })
        }
    })

    // ── Insertar páginas después de un índice ───────────────────────────────
    const insertAfter = (afterIndex) => run(async () => {
        try {
            const res = await window.eel.api_editor_insert_pages(afterIndex)()
            if (res.success) {
                setPages(res.thumbnails)
                onPagesChange?.()
                setStatus({ type: 'success', message: 'Páginas insertadas correctamente.' })
            } else {
                setStatus({ type: 'error', message: res.error })
            }
        } catch {
            setStatus({ type: 'error', message: 'Error al insertar.' })
        }
    })

    // ── Guardar ─────────────────────────────────────────────────────────────
    const save = () => run(async () => {
        try {
            const res = await window.eel.api_editor_save()()
            if (res.success) {
                setStatus({ type: 'success', message: `PDF guardado en: ${res.output_path}` })
            } else {
                setStatus({ type: 'error', message: res.error })
            }
        } catch {
            setStatus({ type: 'error', message: 'Error al guardar.' })
        }
    })

    // ── Reset ────────────────────────────────────────────────────────────────
    const reset = async () => {
        await window.eel.api_editor_reset()()
        setPages([])
        setFilename('')
        setStatus(null)
        onPagesChange?.()
    }

    return {
        pages,
        filename,
        isLoading,
        status,
        load,
        reorder,
        deletePage,
        deleteSelected,
        insertAfter,
        save,
        reset,
    }
}