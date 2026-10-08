import React from 'react';
import LongformLayout from '../../components/site/LongformLayout';

export default function Docs() {
  return (
    <LongformLayout title="Documentation" date="October 2026">
      <p className="text-body-large text-slate mb-8">
        Learn how to run Sanjaya locally, connect your own cameras, and integrate the mental map with your robot stack.
      </p>

      <h2 className="text-heading-2 mt-16 mb-8">Quick start</h2>
      <pre className="bg-mist p-6 rounded-media text-small overflow-x-auto font-mono text-graphite/80 border border-slate/20">
{`git clone https://github.com/sanjaya/sanjaya.git
cd sanjaya
docker compose up -d`}
      </pre>

      <h2 className="text-heading-2 mt-16 mb-8">Run locally</h2>
      <p className="mb-4">
        To run the complete pipeline on your workstation, you will need an NVIDIA GPU with at least 8GB of VRAM.
      </p>

      <h2 className="text-heading-2 mt-16 mb-8">Architecture</h2>
      <p className="mb-4">
        The Sanjaya stack is divided into a lightweight client and a GPU-accelerated engine. The engine runs the SLAM and scene graph pipeline.
      </p>

      <h2 className="text-heading-2 mt-16 mb-8">Real-time protocol</h2>
      <p className="mb-4">
        Clients stream RGB frames over WebRTC or WebSockets. The engine responds with incremental map updates and delta graphs.
      </p>

      <h2 className="text-heading-2 mt-16 mb-8">Deploy</h2>
      <p className="mb-4">
        See the `engine/deployment` directory for Terraform scripts to provision cloud GPUs on GCP or AWS.
      </p>
    </LongformLayout>
  );
}
