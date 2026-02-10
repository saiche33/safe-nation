import os
import cv2
import numpy as np
import pandas as pd

# -----------------------------
# PATHS (corrected)
# -----------------------------
IMAGE_FOLDER = "images"           # your images folder
VIDEO_FOLDER = "videos"           # your videos folder
OUTPUT_FOLDER = "dataset"         # save outputs in dataset folder

os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# -----------------------------
# IMAGE PROCESSING
# -----------------------------
image_data = []
image_info = []

print("Processing Images...")

for img_name in os.listdir(IMAGE_FOLDER):
    if img_name.lower().endswith((".jpg", ".jpeg", ".png")):
        img_path = os.path.join(IMAGE_FOLDER, img_name)

        img = cv2.imread(img_path)
        if img is None:
            continue

        # Resize image (optional but recommended)
        img = cv2.resize(img, (224, 224))

        # Normalize
        img = img / 255.0

        image_data.append(img)
        image_info.append({
            "filename": img_name,
            "type": "image",
            "height": img.shape[0],
            "width": img.shape[1],
            "channels": img.shape[2]
        })

# Convert to NumPy array
image_data = np.array(image_data, dtype=np.float32)

# Save images
np.save(os.path.join(OUTPUT_FOLDER, "images_data.npy"), image_data)

print(f"Saved {len(image_data)} images")

# -----------------------------
# VIDEO PROCESSING
# -----------------------------
video_data = {}
video_info = []

print("Processing Videos...")

for video_name in os.listdir(VIDEO_FOLDER):
    if video_name.lower().endswith(".mp4"):
        video_path = os.path.join(VIDEO_FOLDER, video_name)

        cap = cv2.VideoCapture(video_path)
        frames = []
        frame_count = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # Resize frame
            frame = cv2.resize(frame, (224, 224))

            # Normalize
            frame = frame / 255.0

            frames.append(frame)
            frame_count += 1

        cap.release()

        video_data[video_name] = np.array(frames, dtype=np.float32)

        video_info.append({
            "filename": video_name,
            "frames": frame_count,
            "type": "video"
        })

        print(f"Saved {frame_count} frames from {video_name}")

# Save videos
np.save(os.path.join(OUTPUT_FOLDER, "videos_data.npy"), video_data)

# -----------------------------
# SAVE METADATA (CSV)
# -----------------------------
metadata = image_info + video_info
df = pd.DataFrame(metadata)
df.to_csv(os.path.join(OUTPUT_FOLDER, "dataset_metadata.csv"), index=False)

print("\n✅ All data stored successfully!")
