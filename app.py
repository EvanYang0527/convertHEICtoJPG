from __future__ import annotations

import os
from pathlib import Path
from typing import Final
from uuid import uuid4

from flask import Flask, jsonify, render_template, request, send_from_directory
from PIL import Image, UnidentifiedImageError
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


def load_heif_as_rgb(image_path: Path) -> Image.Image:
    """Load a HEIF image and return it as an RGB Pillow image.

    The default Pillow opener (backed by pillow-heif) handles the majority of
    cases. Some HEIF files, however, rely on codecs that are not bundled with
    the wheel and trigger ``"No decoding plugin installed"`` errors. When that
    happens we fall back to ``imagecodecs`` which ships its own decoder.
    """

    try:
        with Image.open(image_path) as pil_image:
            return pil_image.convert("RGB")
    except (UnidentifiedImageError, OSError) as pil_error:
        try:
            from imagecodecs import heif_decode  # type: ignore
        except Exception as import_error:  # pragma: no cover - import guard
            raise RuntimeError(
                "Unable to decode HEIF image: pillow-heif failed and the "
                "imagecodecs fallback is unavailable."
            ) from pil_error

        image_bytes = image_path.read_bytes()

        try:
            decoded, info = heif_decode(image_bytes, return_info=True)
        except Exception as decode_error:  # pragma: no cover - defensive
            raise RuntimeError(
                "Unable to decode HEIF image with the imagecodecs fallback."
            ) from decode_error

        mode = info.get("mode") if isinstance(info, dict) else None
        if isinstance(mode, str) and ";" in mode:
            mode = mode.split(";", 1)[0]
        if mode is None:
            mode = _guess_mode(decoded)

        pil_image = Image.fromarray(decoded, mode=mode)
        if pil_image.mode != "RGB":
            pil_image = pil_image.convert("RGB")
        return pil_image


def _guess_mode(array) -> str:
    try:
        ndim = array.ndim
        shape = array.shape
    except AttributeError as exc:  # pragma: no cover - sanity check
        raise RuntimeError("Unsupported decoded image format.") from exc

    if ndim == 2:
        return "L"
    if ndim == 3:
        channels = shape[2]
        if channels == 3:
            return "RGB"
        if channels == 4:
            return "RGBA"

    raise RuntimeError("Unsupported HEIF pixel layout.")


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

    rgb_image: Image.Image | None = None
    try:
        rgb_image = load_heif_as_rgb(temp_path)
        output_name = f"{temp_path.stem}.jpg"
        output_path = CONVERTED_DIR / output_name
        rgb_image.save(output_path, format="JPEG", quality=95)
    except Exception as exc:  # pragma: no cover - defensive programming
        temp_path.unlink(missing_ok=True)
        if rgb_image is not None:
            rgb_image.close()
        return jsonify({"error": f"Failed to convert image: {exc}"}), 500
    finally:
        if rgb_image is not None:
            rgb_image.close()

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
