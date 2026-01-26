
import React from 'react';
import { APP_CONTENT, TRANSPORT_INFO } from '../constants';

export const LocationInfo: React.FC = () => {
  return (
    <div className="space-y-12">
        {/* Venue Info Card */}
        <div className="glass-panel p-8 rounded-lg border border-white/60 relative overflow-hidden bg-white/40">
           <div className="absolute top-0 right-0 w-32 h-32 bg-rose-100 rounded-full blur-2xl -mr-16 -mt-16" />
           
           <div className="relative z-10 flex flex-col md:flex-row gap-8 justify-between items-start md:items-center">
              <div>
                <h3 className="font-display text-2xl text-[#2c3e50] tracking-wide mb-1">{APP_CONTENT.venueName}</h3>
                <h4 className="font-serif text-lg text-[#b08d55] italic">{APP_CONTENT.venueHall}</h4>
              </div>
              <p className="font-sans text-sm text-[#7f8c8d] max-w-md leading-relaxed text-left md:text-right">
                {APP_CONTENT.venueDescription}
              </p>
           </div>
        </div>

        {/* Map - No Invert for Light Theme */}
        <div className="w-full h-[350px] rounded-lg overflow-hidden border border-[#b08d55]/20 relative group shadow-sm">
          <iframe 
            src={`https://www.google.com/maps?q=${encodeURIComponent(APP_CONTENT.venueName + " " + APP_CONTENT.venueAddress)}&output=embed`}
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen={false} 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            title="Venue Map"
            className="opacity-90 group-hover:opacity-100 transition-opacity duration-500"
          ></iframe>
           <div className="absolute bottom-4 left-4 right-4 md:left-4 md:right-auto bg-white/90 backdrop-blur-md p-4 border border-white/50 rounded text-left shadow-lg">
              <p className="text-[#2c3e50] text-sm font-medium">{APP_CONTENT.venueName}</p>
              <p className="text-[#7f8c8d] text-xs mt-1">{APP_CONTENT.venueAddress}</p>
           </div>
        </div>

        {/* Transport Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TRANSPORT_INFO.map((item, idx) => (
                <div key={idx} className="glass-panel p-6 rounded-lg flex flex-col items-center text-center hover:bg-white/80 transition-colors bg-white/40">
                    <div className="text-3xl mb-4 grayscale opacity-80">{item.icon}</div>
                    <h4 className="font-display text-xs text-[#b08d55] uppercase tracking-widest mb-2">{item.title}</h4>
                    <span className="font-serif text-lg text-[#2c3e50] mb-3 block">{item.chineseTitle}</span>
                    <p className="text-xs text-[#7f8c8d] leading-relaxed">
                        {item.description}
                    </p>
                </div>
            ))}
        </div>
    </div>
  );
};
