import os
from typing import List, Tuple
from pypdf import PdfWriter, PdfReader
from app.core.interfaces import IPdfSplitter


class PdfSplitterService(IPdfSplitter):

    def split_by_ranges(
        self,
        source_path: str,
        ranges: List[Tuple[int, int]],
        output_dir: str,
        base_name: str
    ) -> List[str]:
        reader = PdfReader(source_path)
        if reader.is_encrypted:
            reader.decrypt("")

        total = len(reader.pages)
        generated = []

        for i, (start, end) in enumerate(ranges):
            # Validamos que el rango sea válido
            start = max(0, start)
            end = min(total - 1, end)
            if start > end:
                continue

            writer = PdfWriter()
            for page_idx in range(start, end + 1):
                writer.add_page(reader.pages[page_idx])

            # Nombre: base_name_rango_1.pdf, base_name_rango_2.pdf...
            output_path = os.path.join(
                output_dir,
                f"{base_name}_rango_{i + 1}_pags_{start + 1}-{end + 1}.pdf"
            )
            with open(output_path, "wb") as f:
                writer.write(f)
            writer.close()
            generated.append(output_path)

        return generated

    def split_by_pages(
        self,
        source_path: str,
        page_indices: List[int],
        output_dir: str,
        base_name: str
    ) -> List[str]:
        reader = PdfReader(source_path)
        if reader.is_encrypted:
            reader.decrypt("")

        total = len(reader.pages)
        generated = []

        for page_idx in page_indices:
            if page_idx < 0 or page_idx >= total:
                continue

            writer = PdfWriter()
            writer.add_page(reader.pages[page_idx])

            output_path = os.path.join(
                output_dir,
                f"{base_name}_pag_{page_idx + 1}.pdf"
            )
            with open(output_path, "wb") as f:
                writer.write(f)
            writer.close()
            generated.append(output_path)

        return generated