from contextlib import asynccontextmanager
from io import BytesIO
from pathlib import Path

import timm
import torch
import torch.nn as nn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import ExifTags, Image, ImageOps
from torchvision import transforms


PROJECT_ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = PROJECT_ROOT / "models" / "signalscope_best_v3_finetuned.pt"

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MODEL = None
TEMPERATURE = 1.0

IMAGE_TRANSFORM = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=(0.485, 0.456, 0.406),
        std=(0.229, 0.224, 0.225),
    ),
])


class SignalScopeModel(nn.Module):
    def __init__(self, backbone_name="efficientnet_b0", dropout=0.3):
        super().__init__()
        self.backbone = timm.create_model(
            backbone_name,
            pretrained=False,
            num_classes=0,
        )
        self.head = nn.Sequential(
            nn.Dropout(dropout),
            nn.Linear(self.backbone.num_features, 1),
        )

    def forward(self, x):
        return self.head(self.backbone(x))


def load_model():
    global MODEL, TEMPERATURE

    if not MODEL_PATH.is_file():
        raise FileNotFoundError(
            f"Model checkpoint not found: {MODEL_PATH}\n"
            "Make sure it is inside the model folder with the exact filename."
        )

    checkpoint = torch.load(
        MODEL_PATH,
        map_location="cpu",
        weights_only=True,
    )

    model = SignalScopeModel(checkpoint["backbone_name"])
    model.load_state_dict(checkpoint["model_state_dict"], strict=True)
    model.to(DEVICE)
    model.eval()

    MODEL = model
    TEMPERATURE = float(checkpoint["temperature"])


def extract_metadata(image, raw_bytes):
    """
    Metadata is supporting evidence only.
    It never changes the vision-model verdict.
    """
    exif = image.getexif()

    make = str(exif.get(271, "")).strip()       # Camera manufacturer
    camera_model = str(exif.get(272, "")).strip()  # Camera model

    date_taken = ""
    try:
        exif_ifd = exif.get_ifd(ExifTags.IFD.Exif)
        date_taken = str(exif_ifd.get(36867, "")).strip()
    except Exception:
        pass

    has_camera_metadata = bool(make or camera_model or date_taken)

    # This is only a presence hint, not cryptographic C2PA verification.
    has_c2pa_hint = b"c2pa" in raw_bytes.lower()

    evidence = []
    if has_camera_metadata:
        evidence.append("Camera-origin EXIF metadata is present.")
    else:
        evidence.append("No camera EXIF metadata was found.")

    if has_c2pa_hint:
        evidence.append("Possible Content Credentials/C2PA data detected.")
    else:
        evidence.append("No Content Credentials/C2PA hint detected.")

    return {
        "camera_make": make or None,
        "camera_model": camera_model or None,
        "date_taken": date_taken or None,
        "camera_metadata_present": has_camera_metadata,
        "c2pa_hint_present": has_c2pa_hint,
        "note": (
            "Metadata can be removed or altered. It is supporting evidence, "
            "not proof that an image is real or AI-generated."
        ),
        "evidence": evidence,
    }


def make_verdict(ai_probability, metadata):
    """Return a hedged visual verdict, with a conservative metadata conflict state.

    Camera EXIF can be copied or edited, so it never proves an image is real and
    never changes the visual model's probability. When complete camera-origin
    metadata conflicts with a likely-AI visual score, we ask for human review
    instead of making an over-confident claim.
    """
    has_complete_camera_metadata = all(
        metadata.get(field)
        for field in ("camera_make", "camera_model", "date_taken")
    )

    if ai_probability >= 0.60:
        if has_complete_camera_metadata:
            return "conflicting_evidence_needs_review", ai_probability, True
        return "likely_ai_generated", ai_probability, False

    if ai_probability <= 0.40:
        return "likely_real", 1.0 - ai_probability, False

    return "uncertain_needs_review", max(ai_probability, 1.0 - ai_probability), True
@asynccontextmanager
async def lifespan(app: FastAPI):
    load_model()
    print(f"SignalScope model loaded on: {DEVICE}")
    yield


app = FastAPI(
    title="SignalScope API",
    version="1.0.0",
    description="Responsible real-vs-AI-generated image classification.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Development only; restrict this before deployment.
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", include_in_schema=False)
def home():
    return FileResponse(FRONTEND_PATH)



@app.get("/health")
def health():
    return {
        "status": "healthy",
        "device": str(DEVICE),
        "model_loaded": MODEL is not None,
        "model_name": "SignalScope EfficientNet-B0",
    }


@app.post("/predict")
async def predict(image: UploadFile = File(...)):
    if MODEL is None:
        raise HTTPException(status_code=503, detail="Model is not loaded.")

    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image file.",
        )

    raw_bytes = await image.read()

    if len(raw_bytes) == 0:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")

    if len(raw_bytes) > 15 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Image is too large. Maximum allowed size is 15 MB.",
        )

    try:
        with Image.open(BytesIO(raw_bytes)) as opened_image:
            metadata = extract_metadata(opened_image, raw_bytes)
            processed_image = ImageOps.exif_transpose(opened_image).convert("RGB")
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail="Could not read this image file.",
        ) from exc

    tensor = IMAGE_TRANSFORM(processed_image).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        raw_logit = MODEL(tensor).squeeze().item()
        ai_probability = torch.sigmoid(
            torch.tensor(raw_logit / TEMPERATURE)
        ).item()

    verdict, confidence, needs_review = make_verdict(ai_probability, metadata)

    return {
        "filename": image.filename,
        "verdict": verdict,
        "display_verdict": verdict.replace("_", " "),
        "ai_generated_probability": round(ai_probability, 4),
        "confidence": round(confidence, 4),
        "needs_review": needs_review,
        "metadata_evidence": metadata,
        "responsible_use_note": (
            "This is an automated likelihood assessment, not proof or an accusation. "
            "Review important decisions with additional evidence."
        ),
    }