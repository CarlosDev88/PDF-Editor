import { useState } from 'react';
import { Button } from '../atoms/Button';

export function UploadAction({ onFilesSelected, text = "Cargar PDFs" }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectFiles = async () => {
    setIsLoading(true);
    try {
      // Llamada al backend en Python
      const routes = await window.eel.api_select_pdfs()();
      if (routes && routes.length > 0) {
        onFilesSelected(routes);
      }
    } catch (error) {
      console.error("Error al cargar:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleSelectFiles} disabled={isLoading} variant="primary">
      {isLoading ? (
        <span>Abriendo...</span>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          {text}
        </>
      )}
    </Button>
  );
}