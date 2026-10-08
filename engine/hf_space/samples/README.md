# Sample missions

Each folder here is one pre-computed mission shown in the "Sample missions" tab
(no GPU needed to view them):

```
samples/<slug>/
  scene.glb       3D map
  floorplan.png   floor plan (beta)
  manifest.json   stats + title + description
  input.mp4       original video (also offered as a "Try one of our videos" example)
```

Add one with `python make_sample.py sanjaya_mission.zip input.mp4 "Title" "One-line description"`.
Keep videos short (under ~10 MB) so the Space repo stays light.
