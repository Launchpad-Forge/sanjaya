import React from 'react';

export default function Timeline({ items }) {
  return (
    <div className="flex flex-col md:flex-row gap-8 md:gap-12 mt-12">
      {items.map((item, idx) => (
        <div key={idx} className="flex-1 relative border-t border-slate/30 pt-6">
          <div className="absolute top-[-4px] left-0 w-2 h-2 rounded-full bg-trace"></div>
          <h3 className="text-heading-3 mb-2">{item.time}</h3>
          <p className="text-body text-slate">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}
