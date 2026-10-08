import React from 'react';
import LongformLayout from '../../components/site/LongformLayout';
import { siteConfig } from '../../config/site';

export default function Community() {
  return (
    <LongformLayout title="Community Ideas" date="October 2026">
      <p className="text-body-large text-slate mb-8">
        See what the community is working on, discussing, and proposing.
      </p>

      <h2 className="text-heading-2 mt-16 mb-8">Top Ideas</h2>
      <div className="flex flex-col gap-6">
        {[
          { title: "Export to ROS 2 RViz", category: "Feature", votes: 42 },
          { title: "Thermal camera fusion", category: "Research", votes: 28 },
          { title: "Underground mine scanning dataset", category: "Dataset", votes: 15 }
        ].map((idea, idx) => (
          <div key={idx} className="p-6 border border-slate/20 rounded-media flex items-center justify-between">
            <div>
              <span className="text-small font-mono text-slate mb-2 block">{idea.category}</span>
              <h3 className="text-heading-3">{idea.title}</h3>
            </div>
            <div className="flex flex-col items-center justify-center bg-mist w-16 h-16 rounded-xl">
              <span className="font-semibold text-graphite text-body-large">{idea.votes}</span>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-heading-2 mt-16 mb-8">Code of Conduct</h2>
      <p className="text-body mb-4">
        We expect everyone in the Sanjaya community to be respectful, inclusive, and collaborative. Please review our full Code of Conduct on <a href={siteConfig.githubUrl} className="underline hover:text-trace">GitHub</a>.
      </p>
    </LongformLayout>
  );
}
