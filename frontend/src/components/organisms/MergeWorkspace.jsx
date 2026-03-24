import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { UploadAction } from '../molecules/UploadAction';
import { MergeAction } from '../molecules/MergeAction';
import { FileListItem } from '../molecules/FileListItem';

export function MergeWorkspace() {
    const [files, setFiles] = useState([]);

    const handleAddFiles = (nuevas) => {
        setFiles(prev => [...prev, ...nuevas]);
    };

    const handleRemove = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleClearAll = () => {
        setFiles([]);
    };

    const handleDragEnd = (result) => {
        if (!result.destination) return;
        const reordenado = Array.from(files);
        const [movido] = reordenado.splice(result.source.index, 1);
        reordenado.splice(result.destination.index, 0, movido);
        setFiles(reordenado);
    };

    return (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 w-full max-w-3xl mx-auto">
            <div className="border-b border-slate-100 pb-4 mb-6">
                <h2 className="text-xl font-bold text-slate-800">Unir Documentos PDF</h2>
                <p className="text-sm text-slate-500">Selecciona y ordena los archivos que deseas combinar.</p>
            </div>

            <div className="mb-6">
                <UploadAction onFilesSelected={handleAddFiles} />
            </div>

            <div className="bg-slate-50 rounded-lg p-4 min-h-[150px] border border-slate-100">

                {/* Header de la lista */}
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">
                        Archivos en cola ({files.length})
                    </h3>
                    {files.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="text-xs text-slate-400 hover:text-red-500 transition-colors duration-150 flex items-center gap-1"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Limpiar todo
                        </button>
                    )}
                </div>

                {/* Lista vacía */}
                {files.length === 0 ? (
                    <p className="text-sm text-slate-400 italic text-center py-8">
                        El espacio de trabajo está vacío. Sube algunos archivos para empezar.
                    </p>
                ) : (
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="pdf-list">
                            {(provided) => (
                                <ul
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="space-y-2"
                                >
                                    {files.map((ruta, i) => (
                                        <Draggable key={ruta + i} draggableId={ruta + i} index={i}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                >
                                                    <FileListItem
                                                        index={i}
                                                        ruta={ruta}
                                                        onRemove={handleRemove}
                                                        dragHandleProps={provided.dragHandleProps}
                                                    />
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </ul>
                            )}
                        </Droppable>
                    </DragDropContext>
                )}
            </div>

            {/* Botón unir */}
            <div className="mt-4">
                <MergeAction files={files} />
            </div>
        </div>
    );
}