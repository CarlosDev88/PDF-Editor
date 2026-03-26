
import eel
import sys
import app.controllers.api 

def start_app():
    print("Iniciando el motor de Python para OfflinePDF Master...")
    eel.init('frontend/dist')  # carpeta del build
    
    try:
        print("Abriendo la aplicación...")
        eel.start(
            'index.html',        # <-- archivo, no diccionario con puerto
            host='localhost', 
            port=8888,
            size=(1200, 800),
            cmdline_args=['--start-maximized'], 
            disable_cache=True,
        )
    except (SystemExit, MemoryError, KeyboardInterrupt):
        print("Aplicación cerrada limpiamente.")

if __name__ == '__main__':
    start_app()