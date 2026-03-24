import tkinter as tk
from tkinter import filedialog

root = tk.Tk()
root.withdraw()
root.attributes('-topmost', True)
root.update()

rutas = filedialog.askopenfilenames(title='Test - Selecciona un PDF')
print("Rutas seleccionadas:", rutas)

root.destroy()