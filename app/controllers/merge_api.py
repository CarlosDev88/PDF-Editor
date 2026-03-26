import eel
from app.infrastructure.dialog_manager import TkinterFileDialog
from app.services.pdf_merger import PdfMergerService

dialog_service = TkinterFileDialog()
merger_service = PdfMergerService()


@eel.expose
def api_select_pdfs() -> list:
    print("[API] >>> Seleccionando PDFs")
    try:
        routes = dialog_service.ask_open_filenames(
            title="Selecciona los PDFs a cargar",
            file_types=[("Archivos PDF", "*.pdf")]
        )
        print(f"[API] Archivos seleccionados: {len(routes)}")
        return routes
    except Exception as e:
        print(f"[API] Error: {str(e)}")
        return []


@eel.expose
def api_merge_pdfs(input_paths: list, output_filename: str = "resultado.pdf") -> dict:
    print(f"[API] >>> Uniendo {len(input_paths)} PDFs")
    try:
        if not input_paths or len(input_paths) < 2:
            return {"success": False, "error": "Se necesitan al menos 2 archivos PDF."}

        output_path = dialog_service.ask_save_filename(
            title="Guardar PDF unido",
            default_filename=output_filename,
            file_types=[("Archivos PDF", "*.pdf")]
        )
        if not output_path:
            return {"success": False, "error": "Operación cancelada."}
        if not output_path.lower().endswith(".pdf"):
            output_path += ".pdf"

        result_path, omitidos = merger_service.merge(input_paths, output_path)
        respuesta = {"success": True, "output_path": result_path, "omitidos": omitidos}
        if omitidos:
            respuesta["warning"] = f"Se omitieron {len(omitidos)} archivo(s) con contraseña: {', '.join(omitidos)}"
        return respuesta
    except ValueError as e:
        return {"success": False, "error": str(e)}
    except Exception as e:
        print(f"[API] Error al unir: {str(e)}")
        return {"success": False, "error": str(e)}