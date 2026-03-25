import fitz
import base64
from typing import List, Dict
from pypdf import PdfWriter, PdfReader
from app.core.interfaces import IPdfEditor


class PdfEditorService(IPdfEditor):
    THUMBNAIL_WIDTH = 180

    def get_page_thumbnails(self, pdf_path: str) -> List[Dict]:
        thumbnails = []
        doc = fitz.open(pdf_path)
        try:
            for i, page in enumerate(doc):
                zoom = self.THUMBNAIL_WIDTH / page.rect.width
                pixmap = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
                b64 = base64.b64encode(pixmap.tobytes("png")).decode("utf-8")
                thumbnails.append({
                    "page_index": i,
                    "thumbnail_base64": f"data:image/png;base64,{b64}",
                    "width": pixmap.width,
                    "height": pixmap.height,
                })
        finally:
            doc.close()
        return thumbnails

    def build_pdf_from_order(self, source_path: str, page_order: List[int], output_path: str) -> str:
        """Construye un PDF con las páginas de source_path en el orden indicado."""
        reader = PdfReader(source_path)
        if reader.is_encrypted:
            reader.decrypt("")
        writer = PdfWriter()
        for idx in page_order:
            writer.add_page(reader.pages[idx])
        with open(output_path, "wb") as f:
            writer.write(f)
        writer.close()
        return output_path

    def insert_pages(self, source_path: str, insert_path: str, after_index: int, output_path: str) -> str:
        """Inserta páginas de insert_path en source_path después de after_index."""
        main_reader = PdfReader(source_path)
        insert_reader = PdfReader(insert_path)
        if main_reader.is_encrypted:
            main_reader.decrypt("")
        if insert_reader.is_encrypted:
            insert_reader.decrypt("")

        writer = PdfWriter()
        main_pages = list(main_reader.pages)
        insert_pages = list(insert_reader.pages)

        for page in main_pages[:after_index + 1]:
            writer.add_page(page)
        for page in insert_pages:
            writer.add_page(page)
        for page in main_pages[after_index + 1:]:
            writer.add_page(page)

        with open(output_path, "wb") as f:
            writer.write(f)
        writer.close()
        return output_path

    def save(self, source_path: str, output_path: str) -> str:
        pass  # IPdfEditor requiere implementarlo