import { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { EditorToolbar } from '../molecules/EditorToolbar'
import { PageThumbnail } from '../molecules/PageThumbnail'
import { Button } from '../atoms/Button'

export function EditWorkspace() {
    const [pages, setPages] = useState([])
    const [selected, setSelected] = useState(new Set())
    const [filename, setFilename] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState(null) // { type: 'success'|'error', message }

    const hasPages = pages.length > 0

    // ── Cargar PDF ──────────────────────────────────────────────────────────────
    const handleLoad = async () => {
        setIsLoading(true)
        setStatus(null)
        try {
            const result = await window.eel.api_editor_load_pdf()()
            if (result.success) {
                setPages(result.thumbnails)
                setFilename(result.filename)
                setSelected(new Set())
            } else {
                setStatus({ type: 'error', message: result.error })
            }
        } catch (e) {
            setStatus({ type: 'error', message: 'Error al cargar el PDF.' })
        } finally {
            setIsLoading(false)
        }
    }

    // ── Drag & drop ─────────────────────────────────────────────────────────────
    const handleDragEnd = (result) => {
        if (!result.destination) return
        const reordenado = Array.from(pages)
        const [movido] = reordenado.splice(result.source.index, 1)
        reordenado.splice(result.destination.index, 0, movido)
        setPages(reordenado)
        setSelected(new Set()) // limpiamos selección al reordenar
    }

    // ── Selección ───────────────────────────────────────────────────────────────
    const handleSelect = (index) => {
        setSelected(prev => {
            const next = new Set(prev)
            next.has(index) ? next.delete(index) : next.add(index)
            return next
        })
    }

    // ── Eliminar una página ─────────────────────────────────────────────────────
    const handleDelete = (index) => {
        setPages(prev => prev.filter((_, i) => i !== index))
        setSelected(prev => {
            const next = new Set()
            prev.forEach(i => { if (i !== index) next.add(i > index ? i - 1 : i) })
            return next
        })
    }

    // ── Eliminar seleccionadas ──────────────────────────────────────────────────
    const handleDeleteSelected = () => {
        setPages(prev => prev.filter((_, i) => !selected.has(i)))
        setSelected(new Set())
    }

    // ── Insertar páginas ────────────────────────────────────────────────────────
    const handleInsert = async () => {
        setIsLoading(true)
        setStatus(null)
        // Insertamos después de la última seleccionada, o al final si no hay selección
        const afterIndex = selected.size > 0
            ? Math.max(...selected)
            : pages.length - 1
        try {
            const result = await window.eel.api_editor_insert_pages(pages, afterIndex)()
            if (result.success) {
                setPages(result.thumbnails)
                setSelected(new Set())
                setStatus({ type: 'success', message: 'Páginas insertadas correctamente.' })
            } else {
                setStatus({ type: 'error', message: result.error })
            }
        } catch (e) {
            setStatus({ type: 'error', message: 'Error al insertar páginas.' })
        } finally {
            setIsLoading(false)
        }
    }

    // ── Guardar ─────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        setIsLoading(true)
        setStatus(null)
        try {
            const result = await window.eel.api_editor_save(pages)()
            if (result.success) {
                setStatus({ type: 'success', message: `PDF guardado en: ${result.output_path}` })
            } else {
                setStatus({ type: 'error', message: result.error })
            }
        } catch (e) {
            setStatus({ type: 'error', message: 'Error al guardar.' })
        } finally {
            setIsLoading(false)
        }
    }

    // ── Resetear ────────────────────────────────────────────────────────────────
    const handleReset = async () => {
        await window.eel.api_editor_reset()()
        setPages([])
        setSelected(new Set())
        setFilename('')
        setStatus(null)
    }

    // ── Render ──────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-6">

            {/* Estado: sin PDF cargado */}
            {!hasPages && !isLoading && (
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

            {/* Toolbar + grid de páginas */}
            {hasPages && !isLoading && (
                <>
                    <EditorToolbar
                        filename={filename}
                        totalPages={pages.length}
                        selectedCount={selected.size}
                        onDeleteSelected={handleDeleteSelected}
                        onInsertAfter={handleInsert}
                        onSave={handleSave}
                        onReset={handleReset}
                        hasPages={hasPages}
                    />

                    {/* Mensaje de estado */}
                    {status && (
                        <div className={`text-sm px-4 py-3 rounded-lg border ${status.type === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                            {status.type === 'success' ? '✓' : '✗'} {status.message}
                        </div>
                    )}

                    {/* Grid drag & drop */}
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="pages-grid" direction="horizontal">
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                                >
                                    {pages.map((page, i) => (
                                        <Draggable key={`page-${page.page_index}-${i}`} draggableId={`page-${page.page_index}-${i}`} index={i}>
                                            {(provided) => (
                                                <PageThumbnail
                                                    page={page}
                                                    index={i}
                                                    selected={selected.has(i)}
                                                    onSelect={handleSelect}
                                                    onDelete={handleDelete}
                                                    dragHandleProps={provided.dragHandleProps}
                                                    draggableProps={provided.draggableProps}
                                                    innerRef={provided.innerRef}
                                                />
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </>
            )}
        </div>
    )
}