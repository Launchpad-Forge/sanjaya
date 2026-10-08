import React from 'react';
import LongformLayout from '../../components/site/LongformLayout';

export default function Policy({ title, content }) {
  return (
    <LongformLayout title={title} date="October 2026">
      <div className="bg-amber-100 text-amber-900 px-4 py-2 rounded text-small font-medium inline-block mb-8">
        Draft — under review
      </div>
      <div className="prose prose-slate prose-lg max-w-none">
        <p className="text-body-large text-slate mb-8">
          This is a draft version of the {title.toLowerCase()} policy for the Sanjaya open research project.
        </p>
        <h2 className="text-heading-2 mt-16 mb-8">1. Introduction</h2>
        <p>We believe in transparent, accountable, and safe AI research. The Sanjaya system is designed to provide situational awareness and is bounded by strict ethical guardrails.</p>
        
        <h2 className="text-heading-2 mt-16 mb-8">2. Core Principles</h2>
        <ul>
          <li><strong>Human in the Loop:</strong> Detections are proposals, not facts, until reviewed.</li>
          <li><strong>Privacy:</strong> On-device blurring for PII before any data leaves the device.</li>
          <li><strong>Security:</strong> All streams are encrypted in transit and ephemeral sessions are never persisted.</li>
        </ul>
      </div>
    </LongformLayout>
  );
}
