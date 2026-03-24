from typing import List, Tuple
from pypdf import PdfWriter, PdfReader
from app.core.interfaces import IPdfMerger


class PdfMergerService(IPdfMerger):

    def merge(self, input_paths: List[str], output_path: str) -> Tuple[str, List[str]]:
        """
        Retorna (output_path, lista de archivos omitidos por contraseña).
        """
        writer = PdfWriter()
        omitidos = []

        for path in input_paths:
            filename = path.replace("\\", "/").split("/")[-1]
            try:
                reader = PdfReader(path)

                if reader.is_encrypted:
                    resultado = reader.decrypt("")
                    if resultado == 0:
                        # Tiene contraseña real — omitir
                        omitidos.append(filename)
                        continue

                writer.append(reader)

            except Exception as e:
                omitidos.append(filename)
                continue

        if len(writer.pages) == 0:
            raise ValueError("Ningún archivo pudo procesarse. Todos están protegidos con contraseña.")

        with open(output_path, "wb") as f:
            writer.write(f)

        writer.close()
        return output_path, omitidos