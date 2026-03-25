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