const form = document.getElementById('upload-form');
const statusElement = document.getElementById('status');
const resultSection = document.getElementById('result');
const downloadLink = document.getElementById('download-link');
const toolInfo = document.getElementById('tool-info');
const fileInput = document.getElementById('file-input');

function setStatus(message, isError = false) {
  statusElement.textContent = message;
  statusElement.style.color = isError ? '#ff3b30' : 'inherit';
}

function resetUI() {
  setStatus('');
  resultSection.classList.add('hidden');
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!fileInput.files.length) {
    setStatus('Please select a HEIC file to convert.', true);
    return;
  }

  resetUI();
  setStatus('Uploading and converting…');

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);

  try {
    const response = await fetch('/api/convert', {
      method: 'POST',
      body: formData
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'Conversion failed');
    }

    resultSection.classList.remove('hidden');
    downloadLink.href = payload.downloadUrl;
    toolInfo.textContent = `Generated with ${payload.tool} (${payload.command})`;
    setStatus('');
  } catch (error) {
    console.error(error);
    setStatus(error.message, true);
  }
});

fileInput.addEventListener('change', () => {
  resetUI();
  if (fileInput.files.length) {
    setStatus(`Ready to convert: ${fileInput.files[0].name}`);
  }
});
