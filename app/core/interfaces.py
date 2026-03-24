from abc import ABC, abstractmethod
from typing import List, Tuple

class IFileDialog(ABC):
    """Contrato para la selección de archivos del Sistema Operativo."""
    
    @abstractmethod
    def ask_open_filenames(self, title: str, file_types: List[Tuple[str, str]]) -> List[str]:
        """Debe abrir un diálogo y retornar una lista de rutas de archivos seleccionados."""
        pass


class IPdfMerger(ABC):
    """Contrato para unir archivos PDF."""
    
    @abstractmethod
    def merge(self, input_paths: List[str], output_path: str) -> str:
        """Une los PDFs en input_paths y guarda el resultado en output_path.
        Retorna la ruta del archivo generado."""
        pass    