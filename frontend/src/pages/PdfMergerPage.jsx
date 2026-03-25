import { useNavigate } from 'react-router-dom'
import { MainLayout } from '../components/templates/MainLayout';
import { MergeWorkspace } from '../components/organisms/MergeWorkspace';

export function PdfMergerPage() {
  const navigate = useNavigate()

  return (
    <MainLayout
      title="OfflinePDF Master"
      subtitle="Herramienta de procesamiento local"
    >
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        Volver al inicio
      </button>
      <MergeWorkspace />
    </MainLayout>
  );
}