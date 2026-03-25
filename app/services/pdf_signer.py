import fitz
from typing import List, Dict
from app.core.interfaces import IPdfSigner


class PdfSignerService(IPdfSigner):

    def sign(
        self,
        source_path: str,
        signature_path: str,
        placements: List[Dict],
        output_path: str
    ) -> str:
        doc = fitz.open(source_path)

        for placement in placements:
            page_idx = placement["page"]
            x = placement["x"]
            y = placement["y"]
            width = placement["width"]
            height = placement["height"]

            if page_idx < 0 or page_idx >= len(doc):
                continue

            page = doc[page_idx]

            # fitz usa coordenadas desde esquina superior izquierda
            rect = fitz.Rect(x, y, x + width, y + height)
            page.insert_image(rect, filename=signature_path)

        doc.save(output_path)
        doc.close()
        return output_path