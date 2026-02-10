import cv2
import numpy as np
import mediapipe as mp

# -----------------------------
# LOAD STORED DATASET
# -----------------------------
images = np.load("dataset/images_data.npy")
videos = np.load("dataset/videos_data.npy", allow_pickle=True).item()

print("Images loaded:", images.shape[0])
print("Videos loaded:", len(videos))

# -----------------------------
# MEDIAPIPE FACE MESH
# -----------------------------
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=True,
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.7
)

# -----------------------------
# KEY LANDMARK IDS
# -----------------------------
LEFT_EYE = 33
RIGHT_EYE = 263
NOSE = 1
MOUTH_L = 61
MOUTH_R = 291
CHIN = 152

# -----------------------------
# FACE FUNCTIONS
# -----------------------------
def extract_landmarks(img):
    if img.max() <= 1.0:
        img = (img * 255).astype("uint8")

    h, w, _ = img.shape
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    res = face_mesh.process(rgb)

    if not res.multi_face_landmarks:
        return None

    landmarks = []
    for lm in res.multi_face_landmarks[0].landmark:
        landmarks.append([lm.x * w, lm.y * h, lm.z])

    return np.array(landmarks, dtype=np.float32)

# -----------------------------
# METHOD 1: NORMALIZATION
# -----------------------------
def normalize_landmarks(lm):
    cx, cy = lm[:, 0].mean(), lm[:, 1].mean()
    scale = max(lm[:, 0].max() - lm[:, 0].min(),
                lm[:, 1].max() - lm[:, 1].min())

    lm[:, 0] = (lm[:, 0] - cx) / scale
    lm[:, 1] = (lm[:, 1] - cy) / scale
    lm[:, 2] = lm[:, 2] / scale
    return lm

# -----------------------------
# METHOD 2: DISTANCE RATIOS
# -----------------------------
def face_ratios(lm):
    def dist(a, b):
        return np.linalg.norm(lm[a][:2] - lm[b][:2])

    eye_dist = dist(LEFT_EYE, RIGHT_EYE)
    if eye_dist == 0:
        return None

    return np.array([
        dist(LEFT_EYE, NOSE) / eye_dist,
        dist(RIGHT_EYE, NOSE) / eye_dist,
        dist(MOUTH_L, MOUTH_R) / eye_dist,
        dist(NOSE, CHIN) / eye_dist
    ], dtype=np.float32)

# -----------------------------
# FACE SIGNATURE
# -----------------------------
def face_signature(img):
    lm = extract_landmarks(img)
    if lm is None:
        return None

    return {
        "lm": normalize_landmarks(lm),
        "ratios": face_ratios(lm)
    }

# -----------------------------
# FACE COMPARISON
# -----------------------------
def compare_faces(f1, f2):
    lm_dist = np.mean(np.linalg.norm(f1["lm"] - f2["lm"], axis=1))
    ratio_dist = np.mean(np.abs(f1["ratios"] - f2["ratios"]))
    return 0.7 * lm_dist + 0.3 * ratio_dist

# -----------------------------
# PREPARE REFERENCE FACES
# -----------------------------
reference_faces = []

for img in images:
    sig = face_signature(img)
    if sig:
        reference_faces.append(sig)

print("Reference faces:", len(reference_faces))

# -----------------------------
# VIDEO ANALYSIS (STRICT)
# -----------------------------
THRESHOLD = 0.06
video_all_faces_matched = True

for video_name, frames in videos.items():
    print(f"\nAnalyzing video: {video_name}")

    for frame in frames:
        sig = face_signature(frame)
        if sig is None:
            continue

        matched = False
        for ref in reference_faces:
            score = compare_faces(sig, ref)
            if score < THRESHOLD:
                matched = True
                break

        if not matched:
            video_all_faces_matched = False
            break

    if not video_all_faces_matched:
        break

# -----------------------------
# FINAL OUTPUT
# -----------------------------
print("\n================ RESULT ================")
if video_all_faces_matched:
    print("✅ MATCH : Video lo unna ANDHARU persons reference images lo unnaru")
else:
    print("❌ NOT MATCH : Video lo reference lo leni person unnadu")
print("========================================")
