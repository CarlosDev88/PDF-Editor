import base64
import io
from typing import List, Dict, Tuple
from pypdf import PdfWriter, PdfReader
import fitz  # pymupdf
from app.core.interfaces import IPdfEditor


class PdfEditorService(IPdfEditor):

    # Tamaño del thumbnail en píxeles de ancho (alto se calcula proporcional)
    THUMBNAIL_WIDTH = 180

    def get_page_thumbnails(self, pdf_path: str) -> List[Dict]:
        """Renderiza cada página como thumbnail base64 usando pymupdf."""
        thumbnails = []
        doc = fitz.open(pdf_path)

        try:
            for i, page in enumerate(doc):
                # Calculamos el zoom para obtener el ancho deseado
                zoom = self.THUMBNAIL_WIDTH / page.rect.width
                matrix = fitz.Matrix(zoom, zoom)

                # Renderizamos la página como imagen
                pixmap = page.get_pixmap(matrix=matrix, alpha=False)

                # Convertimos a base64
                img_bytes = pixmap.tobytes("png")
                b64 = base64.b64encode(img_bytes).decode("utf-8")

                thumbnails.append({
                    "page_index": i,
                    "thumbnail_base64": f"data:image/png;base64,{b64}",
                    "width": pixmap.width,
                    "height": pixmap.height,
                    "original_page": i  # referencia a la página original
                })
        finally:
            doc.close()

        return thumbnails

    def save_edited(self, source_path: str, page_order: List[int], output_path: str) -> str:
        """
        Guarda el PDF con las páginas en el orden indicado.
        page_order = [2, 0, 1] significa: primero página 3, luego 1, luego 2.
        Páginas no incluidas en page_order quedan eliminadas.
        """
        reader = PdfReader(source_path)
        writer = PdfWriter()

        for page_index in page_order:
            writer.add_page(reader.pages[page_index])

        with open(output_path, "wb") as f:
            writer.write(f)

        writer.close()
        return output_path

    def insert_pages(self, source_path: str, insert_path: str, after_index: int) -> List[Dict]:
        """
        Inserta páginas de insert_path después de after_index.
        after_index = -1 inserta al principio.
        Retorna thumbnails del PDF resultante en memoria (sin guardar aún).
        """
        # Construimos el orden combinado en memoria
        main_reader = PdfReader(source_path)
        insert_reader = PdfReader(insert_path)

        writer = PdfWriter()

        main_pages = list(range(len(main_reader.pages)))
        insert_pages = list(range(len(insert_reader.pages)))

        # Páginas antes del punto de inserción
        for i in main_pages[:after_index + 1]:
            writer.add_page(main_reader.pages[i])

        # Páginas insertadas
        for i in insert_pages:
            writer.add_page(insert_reader.pages[i])

        # Páginas después del punto de inserción
        for i in main_pages[after_index + 1:]:
            writer.add_page(main_reader.pages[i])

        # Guardamos temporalmente en memoria para renderizar thumbnails
        tmp_buffer = io.BytesIO()
        writer.write(tmp_buffer)
        writer.close()
        tmp_buffer.seek(0)

        # Renderizamos thumbnails del resultado
        doc = fitz.open(stream=tmp_buffer, filetype="pdf")
        thumbnails = []
        try:
            for i, page in enumerate(doc):
                zoom = self.THUMBNAIL_WIDTH / page.rect.width
                matrix = fitz.Matrix(zoom, zoom)
                pixmap = page.get_pixmap(matrix=matrix, alpha=False)
                img_bytes = pixmap.tobytes("png")
                b64 = base64.b64encode(img_bytes).decode("utf-8")
                thumbnails.append({
                    "page_index": i,
                    "thumbnail_base64": f"data:image/png;base64,{b64}",
                    "width": pixmap.width,
                    "height": pixmap.height,
                    "original_page": i
                })
        finally:
            doc.close()

        return thumbnails