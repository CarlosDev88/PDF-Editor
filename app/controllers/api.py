import eel
import io
import os
import tempfile
import shutil
from pypdf import PdfWriter, PdfReader
from app.infrastructure.dialog_manager import TkinterFileDialog
from app.services.pdf_merger import PdfMergerService
from app.services.pdf_editor import PdfEditorService

dialog_service = TkinterFileDialog()
merger_service = PdfMergerService()
editor_service = PdfEditorService()

# ── SESIÓN DEL EDITOR ──────────────────────────────────────────────────────────
_editor_session = {
    "original_path": None,
    "temp_path": None,      # único temporal activo
    "page_count": 0,
}

def _new_temp_path() -> str:
    """Genera una ruta para un nuevo archivo temporal."""
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    tmp.close()
    return tmp.name

def _update_temp(new_path: str):
    """Actualiza el temporal activo, borrando el anterior."""
    old = _editor_session["temp_path"]
    if old and old != _editor_session["original_path"] and os.path.exists(old):
        try:
            os.unlink(old)
            print(f"[Session] Temporal anterior borrado: {old}")
        except Exception as e:
            print(f"[Session] No se pudo borrar temporal: {e}")
    _editor_session["temp_path"] = new_path
    print(f"[Session] Nuevo temporal activo: {new_path}")

def _current_path() -> str:
    """Retorna el archivo activo (temporal si existe, original si no)."""
    return _editor_session["temp_path"] or _editor_session["original_path"]


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
    print("[API] >>> Cargando PDF para editar")
    try:
        paths = dialog_service.ask_open_filenames(
            title="Selecciona el PDF a editar",
            file_types=[("Archivos PDF", "*.pdf")]
        )
        if not paths:
            return {"success": False, "error": "Operación cancelada."}

        path = paths[0]

        # Limpiamos sesión anterior si existe
        _update_temp(None)
        _editor_session["original_path"] = path
        _editor_session["temp_path"] = None

        thumbnails = editor_service.get_page_thumbnails(path)
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
def api_editor_apply_order(page_order: list) -> dict:
    """
    Recibe el orden actual de páginas desde React y genera un nuevo temporal.
    Se llama en cada reordenamiento o eliminación.
    page_order = [2, 0, 1, ...] índices de las páginas en el orden visual actual.
    """
    print(f"[API] >>> Aplicando orden: {page_order}")
    try:
        source = _current_path()
        if not source:
            return {"success": False, "error": "No hay PDF cargado."}

        new_temp = _new_temp_path()
        editor_service.build_pdf_from_order(source, page_order, new_temp)
        _update_temp(new_temp)

        # Generamos thumbnails frescos del nuevo temporal
        thumbnails = editor_service.get_page_thumbnails(new_temp)
        _editor_session["page_count"] = len(thumbnails)

        return {"success": True, "thumbnails": thumbnails}
    except Exception as e:
        print(f"[API] Error al aplicar orden: {str(e)}")
        return {"success": False, "error": str(e)}


@eel.expose
def api_editor_insert_pages(after_index: int) -> dict:
    """Inserta páginas después de after_index en el temporal activo."""
    print(f"[API] >>> Insertando páginas después del índice {after_index}")
    try:
        source = _current_path()
        if not source:
            return {"success": False, "error": "No hay PDF cargado."}

        paths = dialog_service.ask_open_filenames(
            title="Selecciona PDF(s) a insertar",
            file_types=[("Archivos PDF", "*.pdf")]
        )
        if not paths:
            return {"success": False, "error": "Operación cancelada."}

        # Si seleccionaron varios PDFs, los combinamos en un temporal intermedio
        if len(paths) > 1:
            combined_writer = PdfWriter()
            for p in paths:
                reader = PdfReader(p)
                if reader.is_encrypted:
                    reader.decrypt("")
                for page in reader.pages:
                    combined_writer.add_page(page)
            combined_tmp = _new_temp_path()
            with open(combined_tmp, "wb") as f:
                combined_writer.write(f)
            combined_writer.close()
            insert_source = combined_tmp
        else:
            insert_source = paths[0]
            combined_tmp = None

        new_temp = _new_temp_path()
        editor_service.insert_pages(source, insert_source, after_index, new_temp)

        # Limpiamos el temporal intermedio si lo creamos
        if combined_tmp and os.path.exists(combined_tmp):
            os.unlink(combined_tmp)

        _update_temp(new_temp)

        thumbnails = editor_service.get_page_thumbnails(new_temp)
        _editor_session["page_count"] = len(thumbnails)

        print(f"[API] Páginas insertadas. Total: {len(thumbnails)}")
        return {"success": True, "thumbnails": thumbnails}
    except Exception as e:
        print(f"[API] Error al insertar: {str(e)}")
        return {"success": False, "error": str(e)}


@eel.expose
def api_editor_save() -> dict:
    """Guarda el temporal activo en la ruta que elija el usuario."""
    print("[API] >>> Guardando PDF editado")
    try:
        source = _current_path()
        if not source:
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

        shutil.copy2(source, output_path)
        print(f"[API] PDF guardado en: {output_path}")
        return {"success": True, "output_path": output_path}
    except Exception as e:
        print(f"[API] Error al guardar: {str(e)}")
        return {"success": False, "error": str(e)}


@eel.expose
def api_editor_reset() -> dict:
    """Limpia la sesión del editor."""
    try:
        _update_temp(None)
        _editor_session["original_path"] = None
        _editor_session["temp_path"] = None
        _editor_session["page_count"] = 0
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}