from ultralytics import YOLO
import os
import yaml
import warnings
warnings.filterwarnings('ignore')

os.environ['POLARS_SKIP_CPU_CHECK'] = '1'
os.environ['OMP_NUM_THREADS'] = '2'
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'

base         = os.path.abspath("roaddataset")
train_images = os.path.join(base, "train", "images")
val_images   = os.path.join(base, "valid", "images")

cfg = {
    'path': base,
    'train': train_images,
    'val':   val_images,
    'nc': 1,
    'names': ['Pothole']
}

with open("fixed_data.yaml", 'w') as f:
    yaml.dump(cfg, f)

print("Starting training...")

model = YOLO('yolov8n.pt')

results = model.train(
    data="fixed_data.yaml",
    epochs=30,
    imgsz=320,
    batch=2,
    device='cpu',
    workers=0,
    amp=False,
    cos_lr=False,
    optimizer='SGD',
    lr0=0.01,
    save=True,
    save_period=5,
    project='models',
    name='roadwatch',
    exist_ok=True,
    verbose=True,
    plots=False,
    overlap_mask=False,
    mask_ratio=1
)

print("DONE")
print("Model: models/roadwatch/weights/best.pt")