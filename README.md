# HEIC to JPG Full-Stack Converter

This project provides a production-ready Node.js full-stack application that converts HEIC images to JPG format by delegating the work to command-line tools such as ImageMagick or `heif-convert`. The app exposes both an interactive web interface and a reusable command-line utility.

## Features

- 🌐 **Web UI**: Upload HEIC files from the browser and download the converted JPG image.
- ⚙️ **Command-line workflow**: Conversion is performed through external binaries (`magick`, `convert`, or `heif-convert`) ensuring consistent results with native tooling.
- 🧰 **Reusable service layer**: Shared conversion logic powers both the web API and the CLI utility.
- 🧹 **Automatic cleanup**: Temporary uploads are removed after each conversion to keep disk usage low.

## Prerequisites

Install at least one of the following command-line tools on the host operating system:

- [ImageMagick](https://imagemagick.org) (`magick` or `convert` command)
- [`heif-convert`](https://github.com/strukturag/libheif)

The application automatically detects which tool is available at runtime.

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Run in development mode**

   ```bash
   npm run dev
   ```

   The server starts on [http://localhost:3000](http://localhost:3000) and serves the front-end directly.

3. **Start in production mode**

   ```bash
   npm start
   ```

## Command-line Conversion

Use the bundled script to convert one or many HEIC files without starting the server:

```bash
npm run convert -- --input ./path/to/image.heic --output ./path/to/output.jpg
```

Convert an entire directory recursively:

```bash
npm run convert -- --input ./photos --output ./converted
```

The CLI mirrors the same detection logic used by the API and reports missing tool dependencies with actionable guidance.

## Project Structure

```
├── package.json
├── public
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── scripts
│   └── convert-heic.mjs
└── src
    └── server
        ├── index.js
        ├── routes
        │   └── convert.js
        └── services
            ├── cli-runner.js
            └── converter.js
```

## Testing the API

The API exposes a single endpoint:

- `POST /api/convert` — Multipart form-data with field name `file`. Returns JSON containing a download URL for the JPG file.

Use `curl` to test from the command line:

```bash
curl -F "file=@/path/to/image.heic" http://localhost:3000/api/convert --output response.json
```

The JSON payload includes `downloadUrl` which points to the converted JPG file.

## License

MIT
