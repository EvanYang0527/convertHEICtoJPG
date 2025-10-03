const form = document.getElementById("upload-form");
const resultSection = document.getElementById("result");
const statusText = document.getElementById("status");
const downloadLink = document.getElementById("download-link");
const previewImage = document.getElementById("preview");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  statusText.textContent = "Uploading and converting...";
  resultSection.classList.remove("hidden");
  downloadLink.classList.add("hidden");
  previewImage.classList.add("hidden");

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Conversion failed.");
    }

    statusText.textContent = payload.message;
    downloadLink.href = payload.downloadUrl;
    downloadLink.classList.remove("hidden");
    downloadLink.textContent = `Download ${payload.filename}`;

    previewImage.src = payload.downloadUrl;
    previewImage.classList.remove("hidden");
  } catch (error) {
    statusText.textContent = error.message;
  }
});
