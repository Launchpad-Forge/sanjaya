"""Turn a mission bundle downloaded from the Space into a sample mission.

Usage (inside the Space repo):
    python make_sample.py sanjaya_mission.zip path/to/input.mp4 "Office corridor" "A 30-second walk down a corridor."

Creates samples/<slug>/ with scene.glb, floorplan.png, mentalmap.png, manifest.json
(title + description filled in) and input.mp4. Upload the folder; the "Sample missions"
tab picks it up. Standard library only.
"""

import json
import os
import re
import shutil
import sys
import zipfile


def main():
    if len(sys.argv) < 4:
        print(__doc__)
        sys.exit(1)
    bundle, video, title = sys.argv[1], sys.argv[2], sys.argv[3]
    description = sys.argv[4] if len(sys.argv) > 4 else ""
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-") or "mission"
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "samples", slug)
    os.makedirs(out, exist_ok=True)
    with zipfile.ZipFile(bundle) as z:
        for name in ("scene.glb", "floorplan.png", "mentalmap.png"):
            if name in z.namelist():
                with z.open(name) as src, open(os.path.join(out, name), "wb") as dst:
                    shutil.copyfileobj(src, dst)
        manifest = json.loads(z.read("manifest.json"))
    manifest.pop("keyframes", None)
    manifest["title"], manifest["description"] = title, description
    with open(os.path.join(out, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)
    shutil.copy(video, os.path.join(out, "input" + (os.path.splitext(video)[1].lower() or ".mp4")))
    print(f"Sample ready: {out}")


if __name__ == "__main__":
    main()
