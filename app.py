from __future__ import annotations

import os
from pathlib import Path
from typing import Final
from uuid import uuid4

from flask import Flask, jsonify, render_template, request, send_from_directory
from PIL import Image
from pillow_heif import register_heif_opener
from werkzeug.utils import secure_filename

# Enable HEIC/HEIF support for Pillow
register_heif_opener()

BASE_DIR: Final[Path] = Path(__file__).parent.resolve()
UPLOAD_DIR: Final[Path] = BASE_DIR / "uploads"
CONVERTED_DIR: Final[Path] = BASE_DIR / "converted"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
CONVERTED_DIR.mkdir(parents=True, exist_ok=True)

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10 MB upload limit
ALLOWED_EXTENSIONS: Final[set[str]] = {".heic", ".heif"}


def allowed_file(filename: str) -> bool:
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS


@app.route("/")
def index() -> str:
    return render_template("index.html")


@app.post("/api/upload")
def upload_image():
    if "image" not in request.files:
        return jsonify({"error": "No file part in the request."}), 400

    upload = request.files["image"]
    if upload.filename == "":
        return jsonify({"error": "No file selected."}), 400

    if not allowed_file(upload.filename):
        return (
            jsonify({"error": "Unsupported file type. Please upload a HEIC/HEIF image."}),
            400,
        )

    safe_name = secure_filename(upload.filename)
    unique_name = f"{uuid4().hex}{Path(safe_name).suffix.lower()}"
    temp_path = UPLOAD_DIR / unique_name
    upload.save(temp_path)

    try:
        with Image.open(temp_path) as img:
            rgb_image = img.convert("RGB")
            output_name = f"{temp_path.stem}.jpg"
            output_path = CONVERTED_DIR / output_name
            rgb_image.save(output_path, format="JPEG", quality=95)
    except Exception as exc:  # pragma: no cover - defensive programming
        temp_path.unlink(missing_ok=True)
        return jsonify({"error": f"Failed to convert image: {exc}"}), 500

    return jsonify({
        "message": "Image converted successfully.",
        "downloadUrl": f"/download/{output_name}",
        "filename": output_name,
    })


@app.get("/download/<path:filename>")
def download_file(filename: str):
    safe_filename = secure_filename(filename)
    if not (CONVERTED_DIR / safe_filename).exists():
        return jsonify({"error": "File not found."}), 404

    return send_from_directory(CONVERTED_DIR, safe_filename, as_attachment=True)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)
