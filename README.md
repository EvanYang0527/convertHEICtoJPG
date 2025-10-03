# HEIC to JPG Converter

A minimal full-stack Flask application that lets users upload `.heic` / `.heif` images and converts them to downloadable `.jpg` files in the browser.

## Features

- Drag-and-drop style file picker with a simple, modern UI.
- Server-side conversion from HEIC/HEIF to JPEG using Pillow with `pillow-heif`.
- Instant download link and inline preview of the converted image.

## Getting Started

### Prerequisites

- Python 3.11+
- `pip` package manager

### Installation

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows use `.venv\\Scripts\\activate`
pip install -r requirements.txt
```

### Running the App

```bash
flask --app app run --debug
```

Then open [http://localhost:5000](http://localhost:5000) in your browser.

## Project Structure

```
convertHEICtoJPG/
├── app.py              # Flask application with upload and conversion endpoints
├── templates/
│   └── index.html      # Front-end UI
├── static/
│   ├── script.js       # Client-side logic for uploads
│   └── styles.css      # Styling for the converter
├── uploads/            # Temporary upload storage (auto-created)
└── converted/          # Converted JPEG files (auto-created)
```

## Notes

- Files larger than 10 MB are rejected.
- Only `.heic` and `.heif` files are accepted for upload.
- Converted images are saved to the `converted/` folder and can be downloaded via the link displayed after a successful conversion.
