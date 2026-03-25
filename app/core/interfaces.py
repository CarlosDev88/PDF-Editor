from abc import ABC, abstractmethod
from typing import List, Tuple, Dict


class IFileDialog(ABC):
    """Contrato para la selección de archivos del Sistema Operativo."""

    @abstractmethod
    def ask_open_filenames(self, title: str, file_types: List[Tuple[str, str]]) -> List[str]:
        pass

    @abstractmethod
    def ask_save_filename(self, title: str, default_filename: str, file_types: List[Tuple[str, str]]) -> str:
        pass


class IPdfMerger(ABC):
    """Contrato para unir archivos PDF."""

    @abstractmethod
    def merge(self, input_paths: List[str], output_path: str) -> Tuple[str, List[str]]:
        pass


class IPdfEditor(ABC):
    """Contrato para editar un PDF (reordenar, eliminar, insertar páginas)."""

    @abstractmethod
    def get_page_thumbnails(self, pdf_path: str) -> List[Dict]:
        """Retorna lista de dicts con {page_index, thumbnail_base64, width, height}"""
        pass

    @abstractmethod
    def save_edited(self, source_path: str, page_order: List[int], output_path: str) -> str:
        """Guarda un nuevo PDF con las páginas en el orden indicado.
        page_order es una lista de índices (0-based) del PDF original.
        Páginas eliminadas simplemente no aparecen en la lista."""
        pass

    @abstractmethod
    def insert_pages(self, source_path: str, insert_path: str, after_index: int) -> List[Dict]:
        """Inserta las páginas de insert_path después de after_index en source_path.
        Retorna la nueva lista de thumbnails."""
        pass