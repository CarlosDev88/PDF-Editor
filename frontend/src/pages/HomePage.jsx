import { useNavigate } from 'react-router-dom'

const TOOLS = [
    {
        path: '/merge',
        title: 'Unir PDFs',
        description: 'Combina varios archivos PDF en uno solo. Arrastra para reordenar.',
        icon: (
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                    d="M17 16v4m0 0l-3-3m3 3l3-3M3 8h10M3 12h7M3 16h4M13 4v4m0 0L10 5m3 3l3-3" />
            </svg>
        ),
        color: 'text-blue-600',
        border: 'hover:border-blue-300',
        bg: 'hover:bg-blue-50',
    },
    {
        path: '/edit',
        title: 'Editar PDF',
        description: 'Reordena, elimina o inserta páginas en un PDF existente.',
        icon: (
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
        ),
        color: 'text-emerald-600',
        border: 'hover:border-emerald-300',
        bg: 'hover:bg-emerald-50',
    },
    {
        path: '/split',
        title: 'Dividir PDF',
        description: 'Divide un PDF por rangos de páginas o extrae páginas individuales.',
        icon: (
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                    d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
        ),
        color: 'text-violet-600',
        border: 'hover:border-violet-300',
        bg: 'hover:bg-violet-50',
    },
    {
        path: '/sign',
        title: 'Firmar PDF',
        description: 'Coloca tu firma digital en cualquier página y posición del PDF.',
        icon: (
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
        ),
        color: 'text-rose-600',
        border: 'hover:border-rose-300',
        bg: 'hover:bg-rose-50',
    },
]

export function HomePage() {
    const navigate = useNavigate()

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <h2 className="text-xl font-bold text-slate-800">¿Qué deseas hacer?</h2>
                <p className="text-sm text-slate-500">Selecciona una herramienta para comenzar.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {TOOLS.map((tool) => (
                    <button
                        key={tool.path}
                        onClick={() => navigate(tool.path)}
                        className={`bg-white text-left p-8 rounded-xl border-2 border-slate-200 shadow-sm transition-all duration-200 ${tool.border} ${tool.bg} group`}
                    >
                        <div className={`mb-4 ${tool.color} transition-transform duration-200 group-hover:scale-110`}>
                            {tool.icon}
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-1">{tool.title}</h3>
                        <p className="text-sm text-slate-500">{tool.description}</p>
                    </button>
                ))}
            </div>
        </div>
    )
}