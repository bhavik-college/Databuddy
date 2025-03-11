import React from 'react';

interface GlobeTooltipProps {
  fromCountry: string;
  toCountry: string;
}

const GlobeTooltip: React.FC<GlobeTooltipProps> = ({ fromCountry, toCountry }) => {
  return (
    <div className="absolute transform -translate-x-1/2 -translate-y-full -mt-2 pointer-events-none">
      <div className="bg-slate-800/90 backdrop-blur-sm text-white px-3 py-2 rounded-md border border-slate-700/50 shadow-lg">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-sky-300">{fromCountry}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-medium text-purple-300">{toCountry}</span>
        </div>
      </div>
      <div className="w-3 h-3 bg-slate-800/90 rotate-45 transform -translate-x-1/2 left-1/2 absolute -bottom-1.5 border-r border-b border-slate-700/50"></div>
    </div>
  );
};

export default GlobeTooltip; 