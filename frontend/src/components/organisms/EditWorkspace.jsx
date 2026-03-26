import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { EditorToolbar } from '../molecules/EditorToolbar'
import { PageThumbnail } from '../molecules/PageThumbnail'
import { Button } from '../atoms/Button'
import { useEditorPages } from '../hooks/useEditorPages'
import { usePageSelection } from '../hooks/usePageSelection'

export function EditWorkspace() {
    const { selected, toggle, clear, maxSelected } = usePageSelection()

    const {
        pages, filename, isLoading, status,
        load, reorder, deletePage, deleteSelected,
        insertAfter, save, reset,
    } = useEditorPages(clear) // clear se llama automáticamente tras cada mutación

    const hasPages = pages.length > 0

    const handleDragEnd = ({ source, destination }) => {
        if (!destination) return
        reorder(source.index, destination.index)
    }

    const handleInsert = () => {
        const afterIndex = selected.size > 0 ? maxSelected() : pages.length - 1
        insertAfter(afterIndex)
    }

    const handleReset = async () => {
        await reset()
        clear()
    }

    return (
        <div className="flex flex-col gap-6">

            {!hasPages && !isLoading && (
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

            {isLoading && (
                <div className="bg-white rounded-xl border border-slate-200 p-16 flex flex-col items-center gap-3">
                    <svg className="w-10 h-10 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <p className="text-slate-500 text-sm">Procesando...</p>
                </div>
            )}

            {hasPages && !isLoading && (
                <>
                    <EditorToolbar
                        filename={filename}
                        totalPages={pages.length}
                        selectedCount={selected.size}
                        onDeleteSelected={() => deleteSelected(selected)}
                        onInsertAfter={handleInsert}
                        onSave={save}
                        onReset={handleReset}
                        hasPages={hasPages}
                    />

                    {status && (
                        <div className={`text-sm px-4 py-3 rounded-lg border ${status.type === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                            {status.type === 'success' ? '✓' : '✗'} {status.message}
                        </div>
                    )}

                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="pages-grid" direction="horizontal">
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                                >
                                    {pages.map((page, i) => (
                                        <Draggable
                                            key={`page-${page.page_index}-${i}`}
                                            draggableId={`page-${page.page_index}-${i}`}
                                            index={i}
                                        >
                                            {(provided) => (
                                                <PageThumbnail
                                                    page={page}
                                                    index={i}
                                                    selected={selected.has(i)}
                                                    onSelect={toggle}
                                                    onDelete={deletePage}
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