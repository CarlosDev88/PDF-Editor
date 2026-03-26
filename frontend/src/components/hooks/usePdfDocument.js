import { useState } from 'react'

const getPdfjsLib = async () => {
    const lib = await import('pdfjs-dist')
    lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
    return lib
}

/**
 * Gestiona la carga, estado y reset del documento PDF.
 *
 * Expone:
 *   pdfDoc       — instancia pdfjs (null si no hay doc cargado)
 *   filename     — nombre del archivo
 *   numPages     — total de páginas
 *   isLoading    — flag de operación en curso (compartido con usePdfSave)
 *   setIsLoading — setter para que usePdfSave pueda usarlo
 *   status       — { type: 'success'|'error', message } | null
 *   setStatus    — setter para que usePdfSave pueda reportar estado
 *   loadPdf()    — abre diálogo y carga el doc
 *   reset()      — limpia todo el estado
 */
export function usePdfDocument() {
    const [pdfDoc, setPdfDoc] = useState(null)
    const [filename, setFilename] = useState('')
    const [numPages, setNumPages] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState(null)

    const loadPdf = async () => {
        setIsLoading(true)
        setStatus(null)
        try {
            const res = await window.eel.api_signer_load_pdf()()
            if (!res.success) {
                setStatus({ type: 'error', message: res.error })
                return
            }

            const b64res = await window.eel.api_signer_get_pdf_base64()()
            if (!b64res.success) {
                setStatus({ type: 'error', message: b64res.error })
                return
            }

            const base64 = b64res.pdf_base64.split(',')[1]
            const binary = atob(base64)
            const bytes = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

            const lib = await getPdfjsLib()
            const doc = await lib.getDocument({ data: bytes }).promise

            setPdfDoc(doc)
            setNumPages(doc.numPages)
            setFilename(res.filename)
            setStatus(null)
        } catch (e) {
            setStatus({ type: 'error', message: `Error: ${e.message}` })
        } finally {
            setIsLoading(false)
        }
    }

    const reset = async () => {
        await window.eel.api_signer_reset()()
        setPdfDoc(null)
        setFilename('')
        setNumPages(0)
        setStatus(null)
    }

    return {
        pdfDoc,
        filename,
        numPages,
        isLoading,
        setIsLoading,
        status,
        setStatus,
        loadPdf,
        reset,
    }
}