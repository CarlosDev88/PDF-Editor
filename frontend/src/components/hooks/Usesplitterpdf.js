import { useState } from 'react'

/**
 * Gestiona el ciclo de vida del PDF en el splitter:
 * cargar, dividir por rangos o por páginas, y resetear.

 * @param {Function} onLoad — callback() invocado tras carga exitosa,
 *                            permite al consumidor limpiar selección
 */
export function useSplitterPdf(onLoad) {
    const [filename, setFilename] = useState('')
    const [totalPages, setTotalPages] = useState(0)
    const [thumbnails, setThumbnails] = useState([])
    const [ranges, setRanges] = useState([{ start: 1, end: 1 }])
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState(null)

    // ── Cargar ──────────────────────────────────────────────────────────────
    const load = async () => {
        setIsLoading(true)
        setStatus(null)
        try {
            const res = await window.eel.api_splitter_load_pdf()()
            if (res.success) {
                setFilename(res.filename)
                setTotalPages(res.page_count)
                setThumbnails(res.thumbnails)
                setRanges([{ start: 1, end: res.page_count }])
                onLoad?.()
            } else {
                setStatus({ type: 'error', message: res.error })
            }
        } catch {
            setStatus({ type: 'error', message: 'Error al cargar el PDF.' })
        } finally {
            setIsLoading(false)
        }
    }

    // ── Split ───────────────────────────────────────────────────────────────
    const splitByRanges = async () => {
        setIsLoading(true)
        setStatus(null)
        try {
            const parsed = ranges.map(r => ({ start: r.start - 1, end: r.end - 1 }))
            const res = await window.eel.api_splitter_by_ranges(parsed)()
            if (res.success) {
                setStatus({ type: 'success', message: `✓ ${res.count} PDF(s) generado(s) correctamente.`, files: res.generated })
            } else {
                setStatus({ type: 'error', message: res.error })
            }
        } catch {
            setStatus({ type: 'error', message: 'Error al dividir el PDF.' })
        } finally {
            setIsLoading(false)
        }
    }

    const splitByPages = async (selected) => {
        setIsLoading(true)
        setStatus(null)
        try {
            const indices = Array.from(selected).sort((a, b) => a - b)
            const res = await window.eel.api_splitter_by_pages(indices)()
            if (res.success) {
                setStatus({ type: 'success', message: `✓ ${res.count} PDF(s) generado(s) correctamente.`, files: res.generated })
            } else {
                setStatus({ type: 'error', message: res.error })
            }
        } catch {
            setStatus({ type: 'error', message: 'Error al dividir el PDF.' })
        } finally {
            setIsLoading(false)
        }
    }

    // ── Reset ───────────────────────────────────────────────────────────────
    const reset = async () => {
        await window.eel.api_splitter_reset()()
        setFilename('')
        setTotalPages(0)
        setThumbnails([])
        setRanges([{ start: 1, end: 1 }])
        setStatus(null)
        onLoad?.()
    }

    return {
        filename,
        totalPages,
        thumbnails,
        ranges,
        setRanges,
        isLoading,
        status,
        load,
        splitByRanges,
        splitByPages,
        reset,
    }
}