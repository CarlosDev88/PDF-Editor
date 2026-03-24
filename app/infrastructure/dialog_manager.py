import ctypes
import ctypes.wintypes
import threading
from typing import List, Tuple
from app.core.interfaces import IFileDialog


class TkinterFileDialog(IFileDialog):

    def ask_open_filenames(
        self,
        title: str = "Seleccionar archivos",
        file_types: List[Tuple[str, str]] = None,
    ) -> List[str]:
        if file_types is None:
            file_types = [("Archivos PDF", "*.pdf")]

        resultado = []
        evento = threading.Event()

        def _abrir_dialogo():
            import tkinter as tk
            from tkinter import filedialog

            # Crear un intérprete Tk completamente nuevo en este hilo
            root = tk.Tk()
            root.withdraw()
            root.attributes("-topmost", True)
            root.lift()
            root.focus_force()
            root.update()

            rutas = filedialog.askopenfilenames(
                parent=root,
                title=title,
                filetypes=file_types
            )

            resultado.extend(list(rutas))
            root.destroy()
            evento.set()  # Señalamos que terminamos

        # Lanzar en hilo separado
        hilo = threading.Thread(target=_abrir_dialogo, daemon=True)
        hilo.start()

        # Esperar a que el usuario termine (máximo 5 minutos)
        evento.wait(timeout=300)

        print(f"[Dialog] Archivos seleccionados: {resultado}")
        return resultado
    
    

    def ask_save_filename(
        self,
        title: str = "Guardar archivo",
        default_filename: str = "resultado.pdf",
        file_types: List[Tuple[str, str]] = None,
    ) -> str:
        if file_types is None:
            file_types = [("Archivos PDF", "*.pdf")]

        resultado = []
        evento = threading.Event()

        def _abrir_dialogo():
            import tkinter as tk
            from tkinter import filedialog

            root = tk.Tk()
            root.withdraw()
            root.attributes("-topmost", True)
            root.lift()
            root.focus_force()
            root.update()

            ruta = filedialog.asksaveasfilename(
                parent=root,
                title=title,
                initialfile=default_filename,
                defaultextension=".pdf",
                filetypes=file_types
            )

            resultado.append(ruta)
            root.destroy()
            evento.set()

        hilo = threading.Thread(target=_abrir_dialogo, daemon=True)
        hilo.start()

        evento.wait(timeout=300)

        print(f"[Dialog] Archivo guardado en: {resultado[0] if resultado else 'Cancelado'}")
        return resultado[0] if resultado else ""