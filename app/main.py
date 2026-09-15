import base64
from contextlib import asynccontextmanager
from io import BytesIO
from pathlib import Path

import timm
import torch
import torch.nn as nn
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import ExifTags, Image, ImageOps
from torchvision import transforms


PROJECT_ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = PROJECT_ROOT / "model" / "signalscope_best_v3_finetuned.pt"
FRONTEND_PATH = Path(__file__).with_name("index.html")

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


def predict_ai_probability(image):
    """Return calibrated AI probability and raw logit for one PIL image."""
    processed = ImageOps.exif_transpose(image).convert("RGB")
    tensor = IMAGE_TRANSFORM(processed).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        raw_logit = MODEL(tensor).squeeze().item()
        ai_probability = torch.sigmoid(
            torch.tensor(raw_logit / TEMPERATURE)
        ).item()

    return ai_probability, raw_logit


def make_social_media_copy(image):
    """Resize and JPEG-recompress an image to simulate platform re-encoding."""
    image = ImageOps.exif_transpose(image).convert("RGB")
    width, height = image.size
    long_edge = max(width, height)

    if long_edge > 1080:
        scale = 1080 / long_edge
        image = image.resize(
            (round(width * scale), round(height * scale)),
            Image.Resampling.LANCZOS,
        )

    buffer = BytesIO()
    image.save(buffer, format="JPEG", quality=75, optimize=True)
    buffer.seek(0)

    with Image.open(buffer) as compressed:
        return compressed.convert("RGB").copy()


def generate_gradcam(image):
    """Create a Grad-CAM overlay for evidence supporting the predicted class."""
    activations = []
    gradients = []

    def save_activation(_module, _inputs, output):
        activations.append(output)

    def save_gradient(_module, _grad_inputs, grad_outputs):
        gradients.append(grad_outputs[0])

    # EfficientNet-B0's final convolutional feature map retains spatial detail.
    target_layer = MODEL.backbone.conv_head
    forward_handle = target_layer.register_forward_hook(save_activation)
    backward_handle = target_layer.register_full_backward_hook(save_gradient)

    try:
        processed = ImageOps.exif_transpose(image).convert("RGB")
        tensor = IMAGE_TRANSFORM(processed).unsqueeze(0).to(DEVICE)

        MODEL.zero_grad(set_to_none=True)
        logit = MODEL(tensor).squeeze()
        ai_probability = torch.sigmoid(logit / TEMPERATURE).item()
        predicted_class = "AI-generated" if ai_probability >= 0.5 else "Real"

        # For a real prediction, explain evidence for the negative/real class.
        target_score = logit if ai_probability >= 0.5 else -logit
        target_score.backward()

        if not activations or not gradients:
            raise RuntimeError("Grad-CAM hooks did not receive feature maps.")

        activation = activations[-1].detach()
        gradient = gradients[-1].detach()
        channel_weights = gradient.mean(dim=(2, 3), keepdim=True)
        cam = torch.relu((channel_weights * activation).sum(dim=1, keepdim=True))
        display_long_edge = min(1024, max(processed.width, processed.height))
        display_scale = display_long_edge / max(processed.width, processed.height)
        display_size = (
            max(1, round(processed.width * display_scale)),
            max(1, round(processed.height * display_scale)),
        )
        cam = torch.nn.functional.interpolate(
            cam,
            size=(display_size[1], display_size[0]),
            mode="bilinear",
            align_corners=False,
        ).squeeze()

        cam -= cam.min()
        cam /= cam.max().clamp_min(1e-8)
        heat = cam.cpu().numpy()

        # Transparent red-to-yellow overlay; frontend places it over the original.
        rgba = np.zeros((display_size[1], display_size[0], 4), dtype=np.uint8)
        rgba[..., 0] = 255
        rgba[..., 1] = (heat * 230).astype(np.uint8)
        rgba[..., 2] = 0
        rgba[..., 3] = (heat * 190).astype(np.uint8)

        overlay = Image.fromarray(rgba, mode="RGBA")
        output = BytesIO()
        overlay.save(output, format="PNG")
        overlay_base64 = base64.b64encode(output.getvalue()).decode("ascii")

        return {
            "target_class": predicted_class,
            "overlay_png_base64": overlay_base64,
        }
    finally:
        forward_handle.remove()
        backward_handle.remove()
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

    ai_probability, raw_logit = predict_ai_probability(processed_image)

    social_media_copy = make_social_media_copy(processed_image)
    social_media_probability, social_media_raw_logit = predict_ai_probability(
        social_media_copy
    )
    gradcam = generate_gradcam(processed_image)

    verdict, confidence, needs_review = make_verdict(ai_probability, metadata)

    return {
        "filename": image.filename,
        "verdict": verdict,
        "display_verdict": verdict.replace("_", " "),
        "ai_generated_probability": round(ai_probability, 4),
        "confidence": round(confidence, 4),
        "needs_review": needs_review,
        "robustness": {
            "condition": "Resize to 1080px long edge + JPEG quality 75",
            "original_ai_probability": round(ai_probability, 4),
            "social_media_ai_probability": round(social_media_probability, 4),
            "probability_delta": round(
                abs(ai_probability - social_media_probability),
                4,
            ),
            "original_raw_logit": round(raw_logit, 4),
            "social_media_raw_logit": round(social_media_raw_logit, 4),
        },
        "gradcam": gradcam,
        "metadata_evidence": metadata,
        "responsible_use_note": (
            "This is an automated likelihood assessment, not proof or an accusation. "
            "Review important decisions with additional evidence."
        ),
    }
