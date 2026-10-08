import React from 'react';

export default function Faq({ items }) {
  return (
    <div className="flex flex-col gap-4 w-full">
      {items.map((item, idx) => (
        <details key={idx} className="group border-b border-slate/20 pb-4 w-full cursor-pointer">
          <summary className="text-heading-3 list-none flex justify-between items-center py-4 text-graphite group-open:text-graphite font-medium">
            {item.q}
            <span className="text-slate group-open:rotate-45 transition-transform origin-center leading-none text-2xl">+</span>
          </summary>
          <div className="text-body text-slate pr-8 pb-4">
            {item.a}
          </div>
        </details>
      ))}
    </div>
  );
}
