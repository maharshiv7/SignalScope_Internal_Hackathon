# SignalScope

SignalScope is a responsible image-authenticity prototype. It combines a fine-tuned visual classifier with limited provenance metadata to return a **hedged likelihood assessment** for whether an image is likely AI-generated or likely real.

> This project does not provide proof of authenticity or AI generation. Important decisions require human review and additional evidence.

## Current implementation

- **Visual model:** EfficientNet-B0 binary classifier built with PyTorch and `timm`.
- **Checkpoint:** `models/signalscope_best_v3_finetuned.pt`.
  - Fine-tuned from the supplied SignalScope v2 checkpoint.
  - Training used CIFAKE plus 50 additional real photographs and 62 additional AI-generated images.
  - Uses BCEWithLogitsLoss, AdamW, learning rate `1e-5`, five epochs, gradient clipping (`max_norm=1.0`), and temperature scaling.
- **FastAPI backend:** `POST /predict` accepts an image and returns a visual-model AI probability, hedged verdict, confidence, review flag, and metadata evidence.
- **Metadata handling:** reads available EXIF make, model, and capture date; detects only a possible C2PA byte hint. Metadata is supporting evidence and can be removed or altered.
- **Conflict safeguard:** if the model calls an image likely AI-generated but complete camera make/model/date EXIF is present, the API returns `conflicting_evidence_needs_review` rather than automatically calling it real.
- **React/Vite frontend:** uploads images to the live FastAPI endpoint and displays the returned verdict and metadata.

## API verdicts

| API value | Meaning |
| --- | --- |
| `likely_ai_generated` | Visual AI likelihood is at least 60% and no complete camera-EXIF conflict exists. |
| `likely_real` | Visual AI likelihood is at most 40%. |
| `uncertain_needs_review` | Visual likelihood is between 40% and 60%. |
| `conflicting_evidence_needs_review` | Likely-AI visual result conflicts with complete camera EXIF. It is not a "real" decision. |

## Run locally

### 1. Backend

Use Python 3.10+ and install dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000` and interactive API documentation at `http://127.0.0.1:8000/docs`.

### 2. Frontend

In a separate terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`). Keep the backend running while using the frontend.

## API example

Send a `multipart/form-data` request with an `image` field to `POST /predict`.

```json
{
  "verdict": "conflicting_evidence_needs_review",
  "ai_generated_probability": 0.846,
  "confidence": 0.846,
  "needs_review": true,
  "metadata_evidence": {
    "camera_make": "HONOR",
    "camera_model": "...",
    "date_taken": "..."
  }
}
```

## Validation status and limitations

The CIFAKE validation accuracy recorded during v3 fine-tuning was 97.92%, but that dataset result must not be treated as real-world accuracy. On a small unseen Gemini-generated probe set, the model identified 8 of 15 images as AI-generated (53.3%). This shows the current checkpoint still has substantial false negatives and must be improved with broader, properly separated training/validation data.

Current limitations:

- C2PA is a presence hint only; it is **not** cryptographic verification.
- EXIF is not proof of camera origin and is never used to override the visual model to “real.”
- Grad-CAM/attention-map, compression robustness, user authentication, and persistent history are not backend-implemented features yet.
- The provided classifier should be presented as a prototype likelihood signal, not as a forensic certainty.

## Repository layout

```text
app/main.py                         FastAPI inference service
frontend/                           React + Vite interface
models/signalscope_best.pt          Original checkpoint already in the repo
models/signalscope_best_v3_finetuned.pt  Calibrated fine-tuned checkpoint
requirements.txt                    Python dependencies
```