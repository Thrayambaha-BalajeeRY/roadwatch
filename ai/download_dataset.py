import requests, zipfile, os

print("Downloading pothole dataset...")

url = "https://public.roboflow.com/ds/pothole/1?key=public"

response = requests.get(
    "https://universe.roboflow.com/ds/BCNskyFsTd?key=public",
    stream=True
)

with open("pothole_dataset.zip", "wb") as f:
    for chunk in response.iter_content(chunk_size=8192):
        f.write(chunk)

print("Extracting...")
with zipfile.ZipFile("pothole_dataset.zip", "r") as z:
    z.extractall("pothole-detection-th8es-1")

os.remove("pothole_dataset.zip")
print("Done — dataset ready at pothole-detection-th8es-1/")