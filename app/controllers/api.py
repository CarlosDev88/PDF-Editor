import eel
import io
import os
import tempfile
from pypdf import PdfWriter, PdfReader
from app.infrastructure.dialog_manager import TkinterFileDialog
from app.services.pdf_merger import PdfMergerService
from app.services.pdf_editor import PdfEditorService

dialog_service = TkinterFileDialog()
merger_service = PdfMergerService()
editor_service = PdfEditorService()

# ── SESIÓN DEL EDITOR ──────────────────────────────────────────────────────────
# _session_path apunta siempre al estado actual del PDF en edición (archivo temporal)
_editor_session = {
    "original_path": None,   # PDF que el usuario abrió
    "working_path": None,    # archivo temporal con el estado actual
    "page_count": 0,
}

def _update_working_file(pages_data: list) -> str:
    """
    Recibe la lista de páginas actual desde el frontend
    [{page_index, thumbnail_base64, ...}] y construye un nuevo
    archivo temporal con ese orden. Retorna la ruta del temporal.
    """
    reader = PdfReader(_editor_session["working_path"])
    writer = PdfWriter()
    for page in pages_data:
        writer.add_page(reader.pages[page["page_index"]])

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    writer.write(tmp)
    writer.close()
    tmp.close()

    # Borramos el temporal anterior
    old = _editor_session["working_path"]
    if old and old != _editor_session["original_path"] and os.path.exists(old):
        try:
            os.unlink(old)
        except Exception:
            pass

    _editor_session["working_path"] = tmp.name
    return tmp.name


# ── MERGE ──────────────────────────────────────────────────────────────────────

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


# ── EDITOR ─────────────────────────────────────────────────────────────────────

@eel.expose
def api_editor_load_pdf() -> dict:
    """Carga un PDF, genera thumbnails y prepara la sesión de edición."""
    print("[API] >>> Cargando PDF para editar")
    try:
        paths = dialog_service.ask_open_filenames(
            title="Selecciona el PDF a editar",
            file_types=[("Archivos PDF", "*.pdf")]
        )
        if not paths:
            return {"success": False, "error": "Operación cancelada."}

        path = paths[0]
        thumbnails = editor_service.get_page_thumbnails(path)

        _editor_session["original_path"] = path
        _editor_session["working_path"] = path  # al inicio working = original
        _editor_session["page_count"] = len(thumbnails)

        print(f"[API] PDF cargado: {path} ({len(thumbnails)} páginas)")
        return {
            "success": True,
            "path": path,
            "filename": path.replace("\\", "/").split("/")[-1],
            "thumbnails": thumbnails
        }
    except Exception as e:
        print(f"[API] Error: {str(e)}")
        return {"success": False, "error": str(e)}


@eel.expose
def api_editor_insert_pages(current_pages: list, after_index: int) -> dict:
    """
    Inserta páginas de un PDF nuevo después de after_index.
    current_pages = estado actual de páginas desde el frontend.
    after_index = -1 para insertar al principio.
    """
    print(f"[API] >>> Insertando páginas después del índice {after_index}")
    try:
        if not _editor_session["working_path"]:
            return {"success": False, "error": "No hay PDF cargado."}

        paths = dialog_service.ask_open_filenames(
            title="Selecciona PDF(s) a insertar",
            file_types=[("Archivos PDF", "*.pdf")]
        )
        if not paths:
            return {"success": False, "error": "Operación cancelada."}

        # Primero sincronizamos el working file con el estado actual del frontend
        _update_working_file(current_pages)

        # Unimos todos los PDFs a insertar en uno temporal
        insert_writer = PdfWriter()
        for p in paths:
            reader = PdfReader(p)
            for page in reader.pages:
                insert_writer.add_page(page)
        insert_buffer = io.BytesIO()
        insert_writer.write(insert_buffer)
        insert_writer.close()
        insert_buffer.seek(0)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_insert:
            tmp_insert.write(insert_buffer.read())
            tmp_insert_path = tmp_insert.name

        # Insertamos en el working file
        thumbnails = editor_service.insert_pages(
            _editor_session["working_path"], tmp_insert_path, after_index
        )
        os.unlink(tmp_insert_path)

        # Guardamos el resultado como nuevo working file
        # (insert_pages retorna thumbnails del resultado en memoria,
        #  necesitamos también guardar ese resultado)
        _editor_session["page_count"] = len(thumbnails)

        print(f"[API] Páginas insertadas. Total: {len(thumbnails)}")
        return {"success": True, "thumbnails": thumbnails}
    except Exception as e:
        print(f"[API] Error al insertar: {str(e)}")
        return {"success": False, "error": str(e)}


@eel.expose
def api_editor_save(current_pages: list) -> dict:
    """
    Guarda el PDF con el orden actual de páginas.
    current_pages = [{page_index, ...}] desde el frontend.
    """
    print(f"[API] >>> Guardando PDF editado ({len(current_pages)} páginas)")
    try:
        if not _editor_session["working_path"]:
            return {"success": False, "error": "No hay PDF cargado."}

        output_path = dialog_service.ask_save_filename(
            title="Guardar PDF editado",
            default_filename="editado.pdf",
            file_types=[("Archivos PDF", "*.pdf")]
        )
        if not output_path:
            return {"success": False, "error": "Operación cancelada."}
        if not output_path.lower().endswith(".pdf"):
            output_path += ".pdf"

        # Sincronizamos estado actual y guardamos definitivamente
        working = _update_working_file(current_pages)
        import shutil
        shutil.copy2(working, output_path)

        print(f"[API] PDF guardado en: {output_path}")
        return {"success": True, "output_path": output_path}
    except Exception as e:
        print(f"[API] Error al guardar: {str(e)}")
        return {"success": False, "error": str(e)}


@eel.expose
def api_editor_reset() -> dict:
    """Limpia la sesión del editor."""
    try:
        old = _editor_session["working_path"]
        if old and old != _editor_session["original_path"] and os.path.exists(old):
            os.unlink(old)
        _editor_session["original_path"] = None
        _editor_session["working_path"] = None
        _editor_session["page_count"] = 0
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}