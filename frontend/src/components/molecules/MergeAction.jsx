// src/components/molecules/MergeAction.jsx
import { useState } from 'react';
import { Button } from '../atoms/Button';

export function MergeAction({ files, onMergeComplete }) {
    const [isLoading, setIsLoading] = useState(false);
    const [resultado, setResultado] = useState(null); // null | { success, output_path, error }

    const handleMerge = async () => {
        setIsLoading(true);
        setResultado(null);
        try {
            const result = await window.eel.api_merge_pdfs(files)();
            setResultado(result);
            if (result.success && onMergeComplete) {
                onMergeComplete(result.output_path);
            }
        } catch (error) {
            setResultado({ success: false, error: "Error inesperado al unir los PDFs." });
        } finally {
            setIsLoading(false);
        }
    };

    const canMerge = files.length >= 2 && !isLoading;

    return (
        <div className="flex flex-col gap-2">
            <Button
                onClick={handleMerge}
                disabled={!canMerge}
                variant="success"
            >
                {isLoading ? (
                    <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Uniendo PDFs...
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M17 16v4m0 0l-3-3m3 3l3-3M3 8h10M3 12h7M3 16h4M13 4v4m0 0L10 5m3 3l3-3" />
                        </svg>
                        Unir {files.length} PDFs
                    </>
                )}
            </Button>

            {/* Mensaje de resultado */}
            {resultado && (
                <div className={`text-sm px-4 py-2 rounded-lg ${resultado.success
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                    }`}>
                    {resultado.success ? (
                        <div className="flex flex-col gap-1">
                            <span>✓ PDF guardado en: {resultado.output_path}</span>
                            {resultado.warning && (
                                <span className="text-amber-600 text-xs">
                                    ⚠ {resultado.warning}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span>✗ {resultado.error}</span>
                    )}
                </div>
            )}
        </div>
    );
}