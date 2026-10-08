import math
import time
import random

class MockAdapter:
    # WORKING: returns a slowly growing fake point cloud + circular trajectory
    def __init__(self):
        self.points = []
        self.start_time = time.time()

    def get_next_update(self):
        t = time.time() - self.start_time
        
        # Circular trajectory
        r = 2.0
        x = r * math.cos(t)
        y = r * math.sin(t)
        z = 1.0 + 0.1 * math.sin(t * 3)
        pose = {"x": x, "y": y, "z": z}
        
        # Add a new point near the trajectory
        new_point = [
            x + random.uniform(-0.5, 0.5),
            y + random.uniform(-0.5, 0.5),
            z + random.uniform(-0.5, 0.5),
            random.randint(0, 255), # R
            random.randint(0, 255), # G
            random.randint(0, 255)  # B
        ]
        self.points.append(new_point)
        
        return {
            "type": "map_update",
            "newPoints": [new_point],
            "pose": pose,
            "fps": 5,
            "latencyMs": 15
        }
