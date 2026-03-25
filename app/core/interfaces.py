from abc import ABC, abstractmethod
from typing import List, Tuple, Dict


class IFileDialog(ABC):
    @abstractmethod
    def ask_open_filenames(self, title: str, file_types: List[Tuple[str, str]]) -> List[str]:
        pass

    @abstractmethod
    def ask_save_filename(self, title: str, default_filename: str, file_types: List[Tuple[str, str]]) -> str:
        pass


class IPdfMerger(ABC):
    @abstractmethod
    def merge(self, input_paths: List[str], output_path: str) -> Tuple[str, List[str]]:
        pass


class IPdfEditor(ABC):
    @abstractmethod
    def get_page_thumbnails(self, pdf_path: str) -> List[Dict]:
        pass

    @abstractmethod
    def build_pdf_from_order(self, source_path: str, page_order: List[int], output_path: str) -> str:
        pass

    @abstractmethod
    def insert_pages(self, source_path: str, insert_path: str, after_index: int, output_path: str) -> str:
        pass


class IPdfSplitter(ABC):
    @abstractmethod
    def split_by_ranges(self, source_path: str, ranges: List[Tuple[int, int]], output_dir: str, base_name: str) -> List[str]:
        """
        Divide el PDF por rangos. Cada rango genera un PDF.
        ranges = [(0, 2), (4, 6)] — índices 0-based inclusivos.
        Retorna lista de rutas generadas.
        """
        pass

    @abstractmethod
    def split_by_pages(self, source_path: str, page_indices: List[int], output_dir: str, base_name: str) -> List[str]:
        """
        Genera un PDF por cada página en page_indices.
        Retorna lista de rutas generadas.
        """
        pass


class IPdfSigner(ABC):
    @abstractmethod
    def sign(
        self,
        source_path: str,
        signature_path: str,
        placements: list,
        output_path: str
    ) -> str:
        """
        Incrusta la firma en el PDF.
        placements = [
            {
                "page": 0,          # índice 0-based
                "x": 100.0,         # puntos PDF desde esquina inferior izquierda
                "y": 200.0,
                "width": 150.0,
                "height": 50.0
            }
        ]
        """
        pass