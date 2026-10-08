#!/bin/bash
set -e

echo "Initializing git and creating directories..."
git init

mkdir -p .github/workflows .github/ISSUE_TEMPLATE docs/research
mkdir -p client/src/api client/src/context client/src/hooks client/src/lib client/src/components/layout client/src/components/viewer client/src/components/live client/src/components/landing client/src/pages/public client/src/pages/app client/src/pages/admin
mkdir -p server/src/config server/src/middleware server/src/routes server/src/controllers server/src/services server/src/validators server/src/utils server/prisma
mkdir -p engine/app/adapters engine/app/sources engine/app/semantics engine/app/mental_map engine/app/exporters engine/scripts engine/tests engine/third_party

echo "Adding submodules... (this may take a minute)"
git submodule add https://github.com/MIT-SPARK/VGGT-SLAM engine/third_party/VGGT-SLAM || echo "Failed to add VGGT-SLAM"
git submodule add https://github.com/robbyant/lingbot-map engine/third_party/lingbot-map || echo "Failed to add lingbot-map"
git submodule add https://github.com/MIT-SPARK/Hydra engine/third_party/Hydra || echo "Failed to add Hydra"
git submodule add https://github.com/rmurai0610/MASt3R-SLAM engine/third_party/MASt3R-SLAM || echo "Failed to add MASt3R-SLAM"

echo "Done setting up directories and submodules."
