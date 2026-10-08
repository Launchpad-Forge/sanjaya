# Third-party licences

Sanjaya's own code is Apache-2.0. The research code and models it builds on keep their
own licences. "Verify" means: read the upstream licence before any commercial or
operational use; this table is a guide, not legal advice.

## Used by the Sanjaya Engine (engine/hf_space)

| Component | Code licence | Model weights | Allowed use |
|---|---|---|---|
| LingBot-Map (robbyant) | Apache-2.0 | Apache-2.0 | Research and commercial |
| OWLv2 (google/owlv2-base-patch16-ensemble) | Apache-2.0 (transformers) | Apache-2.0 | Research and commercial |
| Depth Anything V2 Metric Small (depth-anything) | Apache-2.0 (transformers) | See model card. Verify | Research; verify for commercial |

## Reference code in engine/third_party (git submodules, not run by the engine yet)

| Repo | Code licence | Model weights | Allowed use |
|---|---|---|---|
| MIT-SPARK/VGGT-SLAM | BSD-2-Clause | Downloads VGGT, SAM 3 and Perception Encoder weights, each under its own licence. Verify | Research; verify before commercial use |
| MIT-SPARK/Hydra | BSD-2-Clause | None | Research and commercial |
| robbyant/lingbot-map | Apache-2.0 | Apache-2.0 | Research and commercial |
| rmurai0610/MASt3R-SLAM | See repo LICENSE | MASt3R checkpoints are non-commercial (see naver/mast3r CHECKPOINTS_NOTICE). Verify | Research only |
