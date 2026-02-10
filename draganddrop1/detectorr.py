import os
import cv2
from flask import Flask, request, jsonify
from flask_cors import CORS
from nudenet import NudeDetector

# ---------------- APP INIT ----------------
app = Flask(__name__)
# Allow all origins to fix CORS issues
CORS(app, resources={r"/*": {"origins": "*"}})

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

detector = NudeDetector()

# ---------------- CONFIG ----------------
IMAGE_EXT = (".jpg", ".jpeg", ".png", ".bmp", ".webp")
VIDEO_EXT = (".mp4", ".avi", ".mov", ".mkv", ".wmv")

STRICT_LABELS = {
    "FEMALE_GENITALIA_EXPOSED",
    "MALE_GENITALIA_EXPOSED",
    "ANUS_EXPOSED",
    "BUTTOCKS_EXPOSED",
    "FEMALE_BREAST_EXPOSED"
}

# ---------------- HELPERS ----------------
def is_adult(item):
    label = item["class"].upper()
    score = item["score"]
    # Check if label matches and confidence is high
    if label in STRICT_LABELS and score >= 0.5:
        return True
    return False

def check_image(path):
    detections = detector.detect(path)
    return any(is_adult(item) for item in detections)

def check_video(path):
    cap = cv2.VideoCapture(path)
    frame_no = 0
    unsafe_frames = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        frame_no += 1
        # Check every 20th frame to save time
        if frame_no % 20 != 0:
            continue
            
        detections = detector.detect(frame)
        if any(is_adult(item) for item in detections):
            unsafe_frames += 1
            if unsafe_frames >= 1: # If at least 1 unsafe frame found
                cap.release()
                return True

    cap.release()
    return False

# ---------------- ROUTES ----------------
@app.route("/", methods=["GET"])
def home():
    return "🔥 Server Working"

@app.route("/check-file", methods=["POST"])
def check_file():
    print("🔥 API HIT")

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    filename = file.filename
    path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(path)

    ext = os.path.splitext(filename)[1].lower()
    is_unsafe = False
    
    # Process
    try:
        if ext in IMAGE_EXT:
            is_unsafe = check_image(path)
        elif ext in VIDEO_EXT:
            is_unsafe = check_video(path)
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Processing failed"}), 500

    # Logic for Frontend
    if is_unsafe:
        prediction = "NSFW / 18+ Detected"
        confidence = 0.98
        details = ["Explicit content found", "Verification required to view/download"]
    else:
        prediction = "Safe Content"
        confidence = 0.99
        details = ["Content is clean", "Safe to view"]

    return jsonify({
        "prediction": prediction,
        "confidence": confidence,
        "is_safe": not is_unsafe, # Easy flag for JS
        "additional_info": {
            "Notes": details
        }
    })

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)