import { MainLayout } from '../components/templates/MainLayout';
import { MergeWorkspace } from '../components/organisms/MergeWorkspace';

export function PdfMergerPage() {
  return (
    <MainLayout 
      title="OfflinePDF Master" 
      subtitle="Herramienta de procesamiento local"
    >
      <MergeWorkspace />
    </MainLayout>
  );
}