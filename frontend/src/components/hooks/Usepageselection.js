import { useState } from 'react'

/**
 * Gestiona la selección múltiple de páginas con un Set de índices.

 * Expone:
 *   selected        — Set<number> con los índices seleccionados
 *   toggle(index)   — agrega o quita un índice
 *   clear()         — vacía la selección
 *   maxSelected()   — índice máximo del Set (-Infinity si vacío)
 */
export function usePageSelection() {
    const [selected, setSelected] = useState(new Set())

    const toggle = (index) => {
        setSelected(prev => {
            const next = new Set(prev)
            next.has(index) ? next.delete(index) : next.add(index)
            return next
        })
    }

    const clear = () => setSelected(new Set())

    const maxSelected = () => selected.size > 0 ? Math.max(...selected) : -Infinity

    return { selected, toggle, clear, maxSelected }
}