/**
 * Encapsula la lógica de guardado del PDF firmado. *
 * Es un hook propio porque el cálculo de coordenadas
 *
 * Recibe referencias al DOM (pdfInnerRef) para leer
 * los offsets reales de cada página en el momento del guardado.
 *
 * @param {object} params
 * @param {React.RefObject} params.pdfInnerRef   — ref del contenedor interno del visor
 * @param {Array}           params.instances     — instancias actuales de firmas
 * @param {Function}        params.setIsLoading
 * @param {Function}        params.setStatus
 */
export function usePdfSave({ pdfInnerRef, instances, setIsLoading, setStatus }) {

    const save = async () => {
        if (instances.length === 0) {
            setStatus({ type: 'error', message: 'Agrega al menos una firma al PDF.' })
            return
        }

        setIsLoading(true)
        setStatus(null)

        try {
            const sizesRes = await window.eel.api_signer_get_page_sizes()()
            const inner = pdfInnerRef.current
            const pageEls = inner.querySelectorAll('[data-page]')

            // Construir tabla de offsets de cada página (estáticos, sin scroll)
            const pageOffsets = Array.from(pageEls).map(el => {
                const idx = parseInt(el.dataset.page)
                return {
                    pageIndex: idx,
                    top: el.offsetTop,
                    left: el.offsetLeft,
                    height: el.offsetHeight,
                    width: el.offsetWidth,
                    pdfHeight: sizesRes.sizes[idx]?.height ?? 842,
                    pdfWidth: sizesRes.sizes[idx]?.width ?? 595,
                }
            })

            // Agrupar instancias por firma original
            const placementsBySig = {}

            instances.forEach(inst => {
                if (!placementsBySig[inst.sigId]) {
                    placementsBySig[inst.sigId] = { src: inst.src, placements: [] }
                }

                // Determinar en qué página cae la instancia por su centro vertical
                const centerY = inst.y + inst.height / 2
                const target = pageOffsets.find(
                    po => centerY >= po.top && centerY <= po.top + po.height
                ) ?? pageOffsets[pageOffsets.length - 1]

                // Coordenadas relativas a la página
                const relX = inst.x - target.left
                const relY = inst.y - target.top

                // Factores de escala píxeles → puntos PDF
                const scaleX = target.pdfWidth / target.width
                const scaleY = target.pdfHeight / target.height

                placementsBySig[inst.sigId].placements.push({
                    page: target.pageIndex,
                    x: Math.max(0, relX * scaleX),
                    y: Math.max(0, relY * scaleY),
                    width: inst.width * scaleX,
                    height: inst.height * scaleY,
                })
            })

            const res = await window.eel.api_signer_save_multi(
                Object.values(placementsBySig).map(s => ({
                    signature_base64: s.src,
                    placements: s.placements,
                }))
            )()

            if (res.success) {
                setStatus({ type: 'success', message: `PDF guardado en: ${res.output_path}` })
            } else {
                setStatus({ type: 'error', message: res.error })
            }
        } catch (e) {
            setStatus({ type: 'error', message: `Error: ${e.message}` })
        } finally {
            setIsLoading(false)
        }
    }

    return { save }
}