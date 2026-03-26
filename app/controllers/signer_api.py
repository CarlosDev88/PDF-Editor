import eel
import base64
import tempfile
import os
import fitz
from app.infrastructure.dialog_manager import TkinterFileDialog
from app.services.pdf_editor import PdfEditorService

dialog_service = TkinterFileDialog()
editor_service = PdfEditorService()

_signer_session = {
    "source_path":    None,
    "filename":       None,
    "signature_path": None,
    "page_count":     0,
    "thumbnails":     [],
}


@eel.expose
def api_signer_load_pdf() -> dict:
    print("[API] >>> Cargando PDF para firmar")
    try:
        paths = dialog_service.ask_open_filenames(
            title="Selecciona el PDF a firmar",
            file_types=[("Archivos PDF", "*.pdf")]
        )
        if not paths:
            return {"success": False, "error": "Operación cancelada."}

        path       = paths[0]
        thumbnails = editor_service.get_page_thumbnails(path)

        _signer_session["source_path"]    = path
        _signer_session["filename"]       = path.replace("\\", "/").split("/")[-1]
        _signer_session["page_count"]     = len(thumbnails)
        _signer_session["thumbnails"]     = thumbnails
        _signer_session["signature_path"] = None

        return {
            "success":    True,
            "filename":   _signer_session["filename"],
            "page_count": len(thumbnails),
            "thumbnails": thumbnails
        }
    except Exception as e:
        print(f"[API] Error: {str(e)}")
        return {"success": False, "error": str(e)}


@eel.expose
def api_signer_load_signature() -> dict:
    print("[API] >>> Cargando imagen de firma")
    try:
        paths = dialog_service.ask_open_filenames(
            title="Selecciona la imagen de tu firma",
            file_types=[
                ("Imágenes PNG",        "*.png"),
                ("Imágenes JPG",        "*.jpg"),
                ("Todas las imágenes",  "*.png;*.jpg;*.jpeg")
            ]
        )
        if not paths:
            return {"success": False, "error": "Operación cancelada."}

        path = paths[0]
        with open(path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("utf-8")

        ext  = path.split(".")[-1].lower()
        mime = "image/png" if ext == "png" else "image/jpeg"
        _signer_session["signature_path"] = path

        return {
            "success":           True,
            "signature_base64":  f"data:{mime};base64,{b64}",
            "filename":          path.replace("\\", "/").split("/")[-1]
        }
    except Exception as e:
        print(f"[API] Error: {str(e)}")
        return {"success": False, "error": str(e)}


@eel.expose
def api_signer_get_pdf_base64() -> dict:
    try:
        if not _signer_session["source_path"]:
            return {"success": False, "error": "No hay PDF cargado."}
        with open(_signer_session["source_path"], "rb") as f:
            b64 = base64.b64encode(f.read()).decode("utf-8")
        return {"success": True, "pdf_base64": f"data:application/pdf;base64,{b64}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@eel.expose
def api_signer_get_page_sizes() -> dict:
    try:
        if not _signer_session["source_path"]:
            return {"success": False, "error": "No hay PDF cargado."}
        doc   = fitz.open(_signer_session["source_path"])
        sizes = [{"width": p.rect.width, "height": p.rect.height} for p in doc]
        doc.close()
        return {"success": True, "sizes": sizes}
    except Exception as e:
        return {"success": False, "error": str(e)}


@eel.expose
def api_signer_save_multi(signatures_data: list) -> dict:
    print(f"[API] >>> Guardando PDF con {len(signatures_data)} firma(s)")
    try:
        if not _signer_session["source_path"]:
            return {"success": False, "error": "No hay PDF cargado."}

        output_path = dialog_service.ask_save_filename(
            title="Guardar PDF firmado",
            default_filename=f"{_signer_session['filename'].replace('.pdf', '')}_firmado.pdf",
            file_types=[("Archivos PDF", "*.pdf")]
        )
        if not output_path:
            return {"success": False, "error": "Operación cancelada."}
        if not output_path.lower().endswith(".pdf"):
            output_path += ".pdf"

        doc = fitz.open(_signer_session["source_path"])

        for sig_data in signatures_data:
            img_bytes = base64.b64decode(sig_data["signature_base64"].split(",")[1])
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
            tmp.write(img_bytes)
            tmp.close()
            try:
                for placement in sig_data["placements"]:
                    page_idx = placement["page"]
                    if page_idx < 0 or page_idx >= len(doc):
                        continue
                    page = doc[page_idx]
                    rect = fitz.Rect(
                        placement["x"],
                        placement["y"],
                        placement["x"] + placement["width"],
                        placement["y"] + placement["height"]
                    )
                    page.insert_image(rect, filename=tmp.name)
            finally:
                os.unlink(tmp.name)

        doc.save(output_path)
        doc.close()
        return {"success": True, "output_path": output_path}
    except Exception as e:
        print(f"[API] Error: {str(e)}")
        return {"success": False, "error": str(e)}


@eel.expose
def api_signer_reset() -> dict:
    _signer_session["source_path"]    = None
    _signer_session["filename"]       = None
    _signer_session["signature_path"] = None
    _signer_session["page_count"]     = 0
    _signer_session["thumbnails"]     = []
    return {"success": True}