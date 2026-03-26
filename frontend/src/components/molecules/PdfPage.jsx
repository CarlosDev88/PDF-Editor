import { useRef, useEffect } from 'react'

export function PdfPage({ pdfDoc, pageNumber, pageIndex, scale }) {
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