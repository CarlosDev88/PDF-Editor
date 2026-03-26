import eel
from pypdf import PdfWriter, PdfReader
from app.infrastructure.dialog_manager import TkinterFileDialog
from app.services.pdf_editor import PdfEditorService
from app.services.pdf_splitter import PdfSplitterService

dialog_service   = TkinterFileDialog()
editor_service   = PdfEditorService()
splitter_service = PdfSplitterService()

_splitter_session = {
    "source_path": None,
    "filename":    None,
    "page_count":  0,
    "thumbnails":  [],
}


@eel.expose
def api_splitter_load_pdf() -> dict:
    print("[API] >>> Cargando PDF para dividir")
    try:
        paths = dialog_service.ask_open_filenames(
            title="Selecciona el PDF a dividir",
            file_types=[("Archivos PDF", "*.pdf")]
        )
        if not paths:
            return {"success": False, "error": "Operación cancelada."}

        path       = paths[0]
        thumbnails = editor_service.get_page_thumbnails(path)

        _splitter_session["source_path"] = path
        _splitter_session["filename"]    = path.replace("\\", "/").split("/")[-1]
        _splitter_session["page_count"]  = len(thumbnails)
        _splitter_session["thumbnails"]  = thumbnails

        return {
            "success":    True,
            "filename":   _splitter_session["filename"],
            "page_count": len(thumbnails),
            "thumbnails": thumbnails
        }
    except Exception as e:
        print(f"[API] Error: {str(e)}")
        return {"success": False, "error": str(e)}


@eel.expose
def api_splitter_by_ranges(ranges: list) -> dict:
    print(f"[API] >>> Dividiendo por {len(ranges)} rangos")
    try:
        if not _splitter_session["source_path"]:
            return {"success": False, "error": "No hay PDF cargado."}
        if not ranges:
            return {"success": False, "error": "Define al menos un rango."}

        output_dir = dialog_service.ask_directory(
            title="Selecciona la carpeta donde guardar los PDFs"
        )
        if not output_dir:
            return {"success": False, "error": "Operación cancelada."}

        base_name     = _splitter_session["filename"].replace(".pdf", "")
        parsed_ranges = [(r["start"], r["end"]) for r in ranges]

        generated = splitter_service.split_by_ranges(
            _splitter_session["source_path"],
            parsed_ranges,
            output_dir,
            base_name
        )
        print(f"[API] Generados: {generated}")
        return {"success": True, "generated": generated, "count": len(generated)}
    except Exception as e:
        print(f"[API] Error: {str(e)}")
        return {"success": False, "error": str(e)}


@eel.expose
def api_splitter_by_pages(page_indices: list) -> dict:
    print(f"[API] >>> Extrayendo páginas seleccionadas: {page_indices}")
    try:
        if not _splitter_session["source_path"]:
            return {"success": False, "error": "No hay PDF cargado."}
        if not page_indices:
            return {"success": False, "error": "Selecciona al menos una página."}

        base_name = _splitter_session["filename"].replace(".pdf", "")
        output_path = dialog_service.ask_save_filename(
            title="Guardar páginas extraídas",
            default_filename=f"{base_name}_paginas_extraidas.pdf",
            file_types=[("Archivos PDF", "*.pdf")]
        )
        if not output_path:
            return {"success": False, "error": "Operación cancelada."}
        if not output_path.lower().endswith(".pdf"):
            output_path += ".pdf"

        reader = PdfReader(_splitter_session["source_path"])
        if reader.is_encrypted:
            reader.decrypt("")

        writer = PdfWriter()
        for idx in sorted(page_indices):
            writer.add_page(reader.pages[idx])

        with open(output_path, "wb") as f:
            writer.write(f)
        writer.close()

        return {"success": True, "generated": [output_path], "count": 1}
    except Exception as e:
        print(f"[API] Error: {str(e)}")
        return {"success": False, "error": str(e)}


@eel.expose
def api_splitter_reset() -> dict:
    _splitter_session["source_path"] = None
    _splitter_session["filename"]    = None
    _splitter_session["page_count"]  = 0
    _splitter_session["thumbnails"]  = []
    return {"success": True}