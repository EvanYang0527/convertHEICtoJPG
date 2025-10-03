const form = document.getElementById("upload-form");
const fileInput = document.getElementById("file-input");
const statusEl = document.getElementById("status");
const resultSection = document.getElementById("result");
const previewImage = document.getElementById("preview");
const downloadLink = document.getElementById("download-link");

let currentObjectUrl = null;

const resetResult = () => {
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
  resultSection.classList.add("hidden");
  previewImage.src = "";
  downloadLink.removeAttribute("href");
  downloadLink.removeAttribute("download");
};

fileInput.addEventListener("change", () => {
  resetResult();
  statusEl.textContent = "";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  resetResult();

  if (!fileInput.files?.length) {
    statusEl.textContent = "Please select a HEIC file first.";
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  form.querySelector("button").disabled = true;
  statusEl.textContent = "Converting…";

  try {
    const response = await fetch("/api/convert", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const message = data.detail || "Conversion failed.";
      throw new Error(message);
    }

    const blob = await response.blob();
    currentObjectUrl = URL.createObjectURL(blob);

    previewImage.src = currentObjectUrl;
    downloadLink.href = currentObjectUrl;

    const filename = response.headers.get("Content-Disposition")
      ?.split("filename=")?.[1]
      ?.replaceAll('"', "")
      ?.trim();
    downloadLink.download = filename || "converted.jpg";

    resultSection.classList.remove("hidden");
    statusEl.textContent = "Conversion successful!";
  } catch (error) {
    statusEl.textContent = error.message;
  } finally {
    form.querySelector("button").disabled = false;
  }
});
