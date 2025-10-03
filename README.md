# HEIC to JPG Converter

A minimal full-stack project that lets users upload a `.heic` image and
instantly receive a converted `.jpg` version. The Express backend exposes an
upload endpoint that performs the conversion with [`sharp`](https://sharp.pixelplumbing.com/), while the bundled single-page front-end provides a friendly user interface for the workflow.

## Project structure

```
convertHEICtoJPG/
├── backend/
│   ├── package.json        # Node.js metadata and dependency list
│   ├── src/
│   │   └── server.js       # Express application with the conversion endpoint
│   └── static/             # Front-end assets served by the API
│       ├── assets/
│       │   ├── script.js
│       │   └── styles.css
│       └── index.html
└── README.md
```

## Getting started

1. **Install dependencies**:

   ```bash
   cd backend
   npm install
   ```

2. **Run the development server**:

   ```bash
   npm start
   ```

   The server listens on port `8000` by default. Override it with the `PORT`
   environment variable if needed.

3. **Open the application** at <http://localhost:8000> and upload a `.heic` file.

## How it works

- The front-end submits the selected HEIC file via `fetch` to `POST /api/convert`.
- The backend validates the file, decodes it, and streams a JPEG response back to
  the browser using `sharp`.
- The browser shows a preview and provides a direct download link using the
  returned `Content-Disposition` header.

## Notes

- Only HEIC/HEIF files are accepted. Uploading any other format will return a 400
  error with a helpful message.
- The conversion quality is set to 90 to balance fidelity and file size, and can
  be tweaked in `backend/src/server.js`.
- Because the API returns the JPEG bytes directly, no converted files are stored
  on disk.
- Ensure the host environment provides `libvips` with `libheif` support so that
  `sharp` can decode HEIC images.
