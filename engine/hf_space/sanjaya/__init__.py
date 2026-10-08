"""Sanjaya Engine: single-camera 3D mapping.

Pipeline (each stage is its own module):
  frames      video/photos -> ordered, model-ready frames
  geometry    LingBot-Map streaming reconstruction -> points, cameras, per-frame 3D maps
  frame       our coordinate frame: origin at the first camera, Y up (gravity), metres
  scale       Depth Anything V2 Metric -> real-world scale for the whole map
  objects     OWLv2 open-vocabulary detection -> 3D objects fused across views
  mental_map  places graph + objects (Hydra-inspired) and coverage / frontier grid
  render      floor plan and mental-map images
  export      scene.glb and the mission bundle
"""

__version__ = "0.2.0"
