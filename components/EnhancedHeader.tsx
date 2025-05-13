import React, { useEffect, useState } from 'react';

const StyledHeading = () => {
  const [animate, setAnimate] = useState(false);
  
  useEffect(() => {
    // Start animation after component mounts
    setAnimate(true);
  }, []);
  
  return (
    <div className="relative w-full max-w-4xl mx-auto py-12 px-4">
      {/* Background texture - subtly animated */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute -inset-2 bg-gradient-to-r from-pink-500 to-amber-500 blur-3xl"></div>
      </div>
      
      {/* Decorative frames */}
      <div className="absolute -inset-1 rounded-lg border-2 border-amber-400 p-1"></div>
      <div className="absolute -inset-2 rounded-lg border border-pink-500 p-2 opacity-70"></div>
      
      {/* Fire effect at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-8 overflow-hidden">
        <div className={`flex justify-center transition-all duration-1000 ${animate ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
          {[...Array(20)].map((_, i) => (
            <div 
              key={i} 
              className="w-6 h-16 bg-gradient-to-t from-amber-500 via-amber-400 to-pink-300 rounded-full mx-1 animate-pulse"
              style={{ 
                animationDuration: `${0.8 + Math.random() * 1.2}s`,
                animationDelay: `${Math.random() * 0.5}s`,
                height: `${30 + Math.random() * 20}px`
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Main heading with text clip background gradient */}
      <div className="relative z-10 text-center py-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-pink-600 via-amber-500 to-pink-400 bg-clip-text text-transparent">
          AI Roaster & Praiser
        </h1>
        
        {/* Subtle background text for depth */}
        <div className="absolute -z-10 inset-0 flex justify-center items-center opacity-5 overflow-hidden">
          <div className="text-9xl font-black text-amber-500 whitespace-nowrap animate-pulse">
            AI POWER
          </div>
        </div>
      </div>
    </div>
  );
};

export default StyledHeading;