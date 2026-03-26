# OfflinePDF Master

> A fully offline, local PDF processing tool built with Python + React. No internet required. No data leaves your machine.

![OfflinePDF Master](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-blue) ![Python](https://img.shields.io/badge/Python-3.12-yellow) ![React](https://img.shields.io/badge/React-19-61DAFB) ![License](https://img.shields.io/badge/License-MIT-green)

---

## Overview

**OfflinePDF Master** is a desktop application for Windows that lets you work with PDF files entirely offline. It combines a Python backend (powered by `pymupdf`, `pypdf`, and `eel`) with a React frontend, packaged into a standalone executable that requires no installation of Python, Node.js, or any other dependency.

---

## Features

### 📄 Merge PDFs
Combine multiple PDF files into a single document.
- Select and queue multiple PDF files
- Drag and drop to reorder files before merging
- Remove individual files from the queue
- Automatically skips password-protected files and reports them
- Save the merged result anywhere on your system

### ✏️ Edit PDF
Reorganize, delete, or insert pages within an existing PDF.
- Visual thumbnail grid of all pages
- Drag and drop pages to reorder them
- Select and delete one or multiple pages at once
- Insert pages from other PDF files at any position
- Every action generates a working temp file — the original is never modified
- Save the edited result when satisfied, or reset to start over

### ✂️ Split PDF
Divide a PDF into smaller files.
- **By range**: Define one or more page ranges (e.g., pages 1–3, pages 5–7) — each range generates an independent PDF file saved to a folder you choose
- **By pages**: Select specific pages visually — all selected pages are merged into a single extracted PDF saved where you choose

### 🖊️ Sign PDF
Place one or more signature images on any page of a PDF.
- Load any PNG or JPG image as a signature (works best with transparent-background PNGs)
- Render the full PDF in a scrollable viewer
- Drag signatures from the side panel onto any page
- Move and resize each signature instance freely
- Place multiple instances of the same signature, or load different signatures
- Remove individual signatures with the ✕ button
- Save the signed PDF with all signatures permanently embedded

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12, pypdf, pymupdf (fitz), Pillow, eel |
| Frontend | React 19, Vite, Tailwind CSS, @hello-pangea/dnd, @dnd-kit/core |
| Bridge | [Eel](https://github.com/python-eel/Eel) — WebSocket bridge between Python and the browser |
| Packaging | PyInstaller 6 |

---

## Architecture

```
PDF-Editor/
├── app/
│   ├── controllers/
│   │   ├── api.py              # Entry point — registers all endpoints
│   │   ├── merge_api.py        # Merge endpoints
│   │   ├── editor_api.py       # Editor endpoints + session management
│   │   ├── splitter_api.py     # Splitter endpoints
│   │   └── signer_api.py       # Signer endpoints
│   ├── core/
│   │   └── interfaces.py       # Abstract base classes (contracts)
│   ├── infrastructure/
│   │   └── dialog_manager.py   # Native OS file/folder dialogs via Tkinter
│   └── services/
│       ├── pdf_merger.py       # Merge logic
│       ├── pdf_editor.py       # Edit/reorder/insert logic
│       ├── pdf_splitter.py     # Split by range / by pages logic
│       └── pdf_signer.py       # Signature embedding logic
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── atoms/          # Button, Badge, IconButton
│   │   │   ├── molecules/      # FileListItem, MergeAction, RangeInput, etc.
│   │   │   ├── organisms/      # MergeWorkspace, EditWorkspace, SplitWorkspace, SignWorkspace
│   │   │   └── templates/      # MainLayout
│   │   └── pages/              # HomePage, MergePage, EditPage, SplitPage, SignPage
│   └── dist/                   # Production build (served by Eel)
└── main.py                     # Application entry point
```

---

## Development Setup

### Prerequisites
- Python 3.12
- Node.js 18+
- Google Chrome (used by Eel as the app window)

### Backend
```bash
# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Frontend
```bash
cd frontend
npm install
npm run build
```

### Run in development
```bash
# Terminal 1 — watch frontend changes
cd frontend
npm run build -- --watch

# Terminal 2 — run the app
python main.py
```

---

## Building the Executable

### 1. Build the frontend
```bash
cd frontend
npm run build
# Copy the PDF worker (required for the PDF viewer)
Copy-Item "node_modules\pdfjs-dist\build\pdf.worker.min.mjs" "dist\pdf.worker.min.js" -Force
cd ..
```

### 2. Generate the app icon (first time only)
```bash
python -c "
from PIL import Image, ImageDraw
img = Image.new('RGBA', (256, 256), (0,0,0,0))
draw = ImageDraw.Draw(img)
draw.ellipse([20,20,236,236], fill=(59,130,246,255))
img.save('app_icon.ico', format='ICO', sizes=[(256,256),(128,128),(64,64),(32,32),(16,16)])
"
```

### 3. Run PyInstaller
```bash
pyinstaller PDF-Editor.spec --clean
```

The output will be in:
```
dist/
└── OfflinePDF Master/
    ├── _internal/
    └── OfflinePDF Master.exe   ← run this
```

> **Note:** Copy the entire `OfflinePDF Master` folder to the target machine. The `.exe` will not work without the `_internal` folder next to it.

---

## Key Design Decisions

**Why Eel instead of Electron?**
Eel is significantly lighter and lets us use Python directly as the backend without a Node.js process. The tradeoff is that Chrome must be installed on the target machine.

**Why temp files for the editor?**
Every edit operation (reorder, delete, insert) generates a new temp file and discards the previous one. This means the original PDF is never touched, and the "undo" model is simply resetting to the original. It also avoids keeping large PDFs in memory.

**Why canvas rendering for the PDF viewer?**
`react-pdf` (which wraps pdf.js) had MIME type conflicts when served by Eel's static file server. Rendering pages directly to `<canvas>` elements using `pdfjs-dist` gives full control without the worker/MIME issues.

---

## Requirements

```
eel
pypdf
pymupdf
Pillow
pyinstaller
comtypes
```

Full list in `requirements.txt`.

---

## License

MIT — free to use, modify, and distribute.