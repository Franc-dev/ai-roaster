/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useChatStore, { InteractionMode } from '@/store/chatStore'; // Assuming this path is correct
import LoadingSpinner from './LoadingSpinner'; // Assuming this path is correct
import SkeletonLoader from './SkeletonLoader'; // Assuming this path is correct
import { ClipboardCopy, Share2, X, CheckCircle2 } from 'lucide-react';
// domtoimage is no longer used for image generation
import EnhancedH from "@/components/EnhancedHeader"; // Assuming this path is correct

const ChatInterface = () => {
  const {
    name,
    career,
    currentResponse,
    isLoading,
    error,
    history,
    setName,
    setCareer,
    fetchAIResponse,
    clearHistory,
    clearCurrentResponse,
  } = useChatStore();

  const [isClient, setIsClient] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  // responseRef is still used for the on-screen modal, but not for image generation directly
  const responseRef = useRef<HTMLDivElement>(null); 

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [showResponse, setShowResponse] = useState(false);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (currentResponse && !isLoading) {
      setShowResponse(true);
      setShowError(false);
      setShowModal(true);
    } else if (!isLoading) {
      setShowResponse(false);
    }
  }, [currentResponse, isLoading]);

  useEffect(() => {
    if (error && !isLoading) {
      setShowError(true);
      setShowResponse(false);
    } else if (!isLoading) {
      setShowError(false);
    }
  }, [error, isLoading]);

  const handleSubmit = (mode: InteractionMode) => {
    clearCurrentResponse();
    setShowResponse(false);
    setShowError(false);
    fetchAIResponse(mode);
  };

  const copyToClipboard = () => {
    if (!currentResponse) return;
    
    const textToCopy = `AI ${history[0]?.mode === 'roast' ? 'Roast' : 'Praise'} for ${name} (${career}):\n\n${currentResponse}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  // Helper function to wrap text on canvas
  const wrapText = (
    context: CanvasRenderingContext2D, 
    text: string, 
    x: number, 
    y: number, 
    maxWidth: number, 
    lineHeight: number,
    maxLines?: number
  ) => {
    const words = text.split(' ');
    let line = '';
    let linesDrawn = 0;

    for (let n = 0; n < words.length; n++) {
      if (maxLines && linesDrawn >= maxLines) {
        // Add ellipsis if maxLines is reached and there's more text
        const lastLine = context.measureText(line + '...').width < maxWidth ? line + '...' : line.slice(0, -1) + '...';
        context.fillText(lastLine, x, y);
        return;
      }
      const testLine = line + words[n] + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        context.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
        linesDrawn++;
      } else {
        line = testLine;
      }
    }
    if (!maxLines || linesDrawn < maxLines) {
         context.fillText(line, x, y);
    }
  };


  const handleShareAsImage = async () => {
    if (!currentResponse) return;
    setIsSharing(true);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      alert('Canvas not supported or context could not be created.');
      setIsSharing(false);
      return;
    }

    // --- Card Design Parameters ---
    const cardWidth = 600; // Base width
    const scaleFactor = 2; // For higher resolution
    canvas.width = cardWidth * scaleFactor;
    
    // Dynamic height calculation
    let cardHeight = 0;
    const padding = 30 * scaleFactor; // 30px padding at scale
    const headerLineHeight = 30 * scaleFactor;
    const contentLineHeight = 28 * scaleFactor;
    const footerLineHeight = 20 * scaleFactor;
    const sectionSpacing = 20 * scaleFactor; // Spacing between header/content and content/footer

    // --- Pre-calculate height ---
    // Header height
    cardHeight += padding + headerLineHeight + sectionSpacing;

    // Content height (estimate)
    ctx.font = `${18 * scaleFactor}px Inter, sans-serif`; // Content font for measurement
    const tempWords = currentResponse.split(' ');
    let tempLine = '';
    let numContentLines = 1;
    for (let n = 0; n < tempWords.length; n++) {
        const testLine = tempLine + tempWords[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > (cardWidth * scaleFactor - 2 * padding - 15 * scaleFactor) && n > 0) { // 15 for left accent bar space
            numContentLines++;
            tempLine = tempWords[n] + ' ';
        } else {
            tempLine = testLine;
        }
    }
    cardHeight += numContentLines * contentLineHeight + sectionSpacing;
    
    // Footer height
    cardHeight += footerLineHeight + padding;
    canvas.height = cardHeight;


    // --- Apply Scale ---
    ctx.scale(scaleFactor, scaleFactor);

    // --- Styles ---
    const isRoast = history[0]?.mode === 'roast';
    const themeColor = isRoast ? '#EF4444' : '#38BDF8'; // Red-500 or Sky-500
    const textColor = isRoast ? '#B91C1C' : '#0284C7'; // Red-700 or Sky-700
    const icon = isRoast ? '🔥' : '✨';
    const headerText = `${isRoast ? 'Epic Roast' : 'Heartfelt Praise'} for ${name}`;

    // 1. Draw Background
    ctx.fillStyle = '#FFFFFF'; // White background
    ctx.fillRect(0, 0, cardWidth, cardHeight / scaleFactor); // Use unscaled height for fillRect if canvas.height was set scaled

    let currentY = padding / scaleFactor;

    // 2. Draw Header
    ctx.fillStyle = textColor;
    ctx.font = `bold ${20 / scaleFactor * 2}px Inter, sans-serif`; // Header font (e.g., 20px)
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    const iconText = `${icon} ${headerText}`;
    const iconWidth = ctx.measureText(icon).width;
    ctx.fillText(icon, padding / scaleFactor, currentY);
    ctx.fillText(headerText, padding / scaleFactor + iconWidth + (8 / scaleFactor * 2) , currentY); // 8px spacing
    currentY += headerLineHeight / scaleFactor + sectionSpacing / scaleFactor;
    
    // 3. Draw Content (with left accent bar)
    const accentBarWidth = 5 / scaleFactor * 2; // 5px width
    const contentX = padding / scaleFactor + accentBarWidth + (10 / scaleFactor * 2); // 10px space after bar
    const contentMaxWidth = cardWidth - contentX - padding / scaleFactor;

    ctx.fillStyle = themeColor;
    ctx.fillRect(padding / scaleFactor, currentY, accentBarWidth, (numContentLines * contentLineHeight) / scaleFactor);

    ctx.fillStyle = textColor;
    ctx.font = `${18 / scaleFactor * 2}px Inter, sans-serif`; // Content font (e.g., 18px)
    wrapText(ctx, currentResponse, contentX, currentY, contentMaxWidth, contentLineHeight / scaleFactor);
    currentY += (numContentLines * contentLineHeight) / scaleFactor + sectionSpacing / scaleFactor;

    // 4. Draw Footer
    ctx.fillStyle = '#6B7280'; // Slate-500
    ctx.font = `italic ${14 / scaleFactor * 2}px Inter, sans-serif`; // Footer font (e.g., 14px)
    ctx.textAlign = 'center';
    const footerText = "Generated by AI Roaster & Praiser";
    ctx.fillText(footerText, cardWidth / 2, currentY);
    // currentY += footerLineHeight / scaleFactor; // No need to update Y further if it's the last element

    // --- Share ---
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert('Failed to create image blob.');
          setIsSharing(false);
          return;
        }
        const fileName = `AI_Verdict_${name.replace(/\s+/g, '_')}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });
        const shareData = {
          files: [file],
          title: `AI ${history[0]?.mode === 'roast' ? 'Roast' : 'Praise'} for ${name}`,
          text: `Check out this AI ${history[0]?.mode === 'roast' ? 'roast' : 'praise'} for ${name} (${career})! Generated by AI Roaster & Praiser.`,
        };

        if (navigator.canShare && navigator.canShare(shareData)) {
          await navigator.share(shareData);
        } else if (navigator.share) {
          await navigator.share({
            title: shareData.title,
            text: `${shareData.text}\n\n"${currentResponse}"`,
          });
        } else {
          alert('Sharing is not supported on your browser. You can copy the text instead.');
          copyToClipboard();
        }
      }, 'image/png', 0.95); // Quality for PNG
    } catch (err) {
      console.error('Error sharing canvas image:', err);
      alert('An error occurred while trying to share the image.');
    } finally {
      setIsSharing(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-5 sm:py-6 md:py-8 font-sans">
      <EnhancedH/>
      <div className="container mx-auto max-w-2xl w-full px-4 flex flex-col items-center space-y-5 sm:space-y-6 md:space-y-8">
        {/* Header Section */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="mt-1.5 sm:mt-2 text-sm sm:text-base text-slate-600 max-w-md mx-auto pt-2">
            Enter a name and career, then brace yourself for a roast or some praise!
          </p>
        </motion.header>

        {/* Input Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full bg-white/60 backdrop-blur-xl shadow-xl rounded-xl p-4 sm:p-5 md:p-6 space-y-4 ring-1 ring-black ring-opacity-5"
        >
          <div>
            <label
              htmlFor="name"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Person&apos;s Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Ada Lovelace"
              className="w-full p-3 bg-white/80 border-2 border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-200 text-slate-900 placeholder-slate-400 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="career"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Career / Profession
            </label>
            <input
              type="text"
              id="career"
              value={career}
              onChange={(e) => setCareer(e.target.value)}
              placeholder="e.g., First Computer Programmer"
              className="w-full p-3 bg-white/80 border-2 border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-200 text-slate-900 placeholder-slate-400 text-sm"
            />
          </div>

          <div className="pt-2 grid grid-cols-1 xs:grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: "0px 5px 15px rgba(0,0,0,0.1)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSubmit('roast')}
              disabled={isLoading || !name.trim() || !career.trim()}
              className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-red-500"
            >
              {isLoading && history[0]?.mode === 'roast' ? (
                <LoadingSpinner size="4" color="text-white" />
              ) : (
                <>
                  <span className="text-lg sm:text-xl mr-2" aria-hidden="true">🔥</span> Roast Me!
                </>
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: "0px 5px 15px rgba(0,0,0,0.1)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSubmit('positive')}
              disabled={isLoading || !name.trim() || !career.trim()}
              className="flex items-center justify-center bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-sky-500"
            >
              {isLoading && history[0]?.mode === 'positive' ? (
                <LoadingSpinner size="4" color="text-white" />
              ) : (
                <>
                  <span className="text-lg sm:text-xl mr-2" aria-hidden="true">✨</span> Praise Me!
                </>
              )}
            </motion.button>
          </div>
        </motion.section>

        {/* Loading/Error Display Area (before modal) */}
        <div className="w-full min-h-[100px]">
          <AnimatePresence>
            {isLoading && !currentResponse && !error && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <SkeletonLoader />
              </motion.div>
            )}
            {showError && error && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md"
                role="alert"
              >
                <p className="font-bold text-sm">Oops! Something went wrong.</p>
                <p className="text-xs mt-1">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modal for Displaying Response (On-screen version) */}
        <AnimatePresence>
          {showModal && currentResponse && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 min-h-screen bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
              onClick={() => setShowModal(false)} 
            >
              {/* This is the on-screen modal's content, styled with Tailwind. 
                  The image generation happens separately on a canvas. */}
              <motion.div
                ref={responseRef} // Still useful if you want to reference the modal DOM for other purposes
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 20, stiffness: 250 }}
                className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col p-6" 
                onClick={(e) => e.stopPropagation()} 
              >
                {/* Header for on-screen modal */}
                <div className={`flex items-center pb-3 mb-4 border-b border-slate-200`}>
                    <span className={`text-2xl mr-3 ${history[0]?.mode === 'roast' ? 'text-red-500' : 'text-sky-500'}`}>
                        {history[0]?.mode === 'roast' ? '🔥' : '✨'}
                    </span>
                    <h3 className={`text-lg font-semibold ${history[0]?.mode === 'roast' ? 'text-red-600' : 'text-sky-600'}`}>
                        {history[0]?.mode === 'roast' ? 'Epic Roast' : 'Heartfelt Praise'} for {name}
                    </h3>
                </div>

                {/* Content for on-screen modal */}
                <div className={`flex-grow mb-4 text-base leading-relaxed ${history[0]?.mode === 'roast' ? 'text-red-700' : 'text-sky-700'}`}>
                     <div className={`border-l-4 ${history[0]?.mode === 'roast' ? 'border-red-400' : 'border-sky-400'} pl-4`}>
                        <p className="whitespace-pre-wrap">{currentResponse}</p>
                    </div>
                </div>
                
                {/* Watermark for on-screen modal */}
                <div className="pt-4 mt-auto text-center text-xs text-slate-500 border-t border-slate-200">
                    <p>Generated by AI Roaster & Praiser</p>
                </div>

                {/* On-screen action buttons */}
                <div className="absolute top-3 right-3 flex space-x-2"> 
                    <motion.button
                      whileHover={{ scale: 1.1, backgroundColor: '#e2e8f0' }}
                      whileTap={{ scale: 0.9 }}
                      onClick={copyToClipboard}
                      className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <motion.div initial={{scale:0}} animate={{scale:1}} className="flex items-center text-green-600">
                          <CheckCircle2 size={18} />
                        </motion.div>
                      ) : (
                        <ClipboardCopy size={18} />
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1, backgroundColor: '#e2e8f0' }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowModal(false)}
                      className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                      title="Close"
                    >
                      <X size={18} />
                    </motion.button>
                </div>
                
                {/* Share Button for on-screen modal */}
                <div className="mt-6">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleShareAsImage} 
                        disabled={isSharing} 
                        className="w-full flex items-center justify-center text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isSharing ? (
                        <>
                            <LoadingSpinner size="4" color="text-white" />
                            <span className="ml-2">Sharing Image...</span>
                        </>
                        ) : (
                        <>
                            <Share2 size={16} className="mr-2" />
                            Share this {history[0]?.mode === 'roast' ? 'Roast' : 'Praise'}
                        </>
                        )}
                    </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fallback display for response if modal is closed (optional) */}
        <AnimatePresence>
          {showResponse && currentResponse && !isLoading && !showModal && (
             <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full mt-6"
            >
              <div className="bg-white/50 backdrop-blur-md shadow-lg rounded-lg p-4 sm:p-5 ring-1 ring-black ring-opacity-5">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-base font-semibold text-slate-800">
                    The AI&apos;s Verdict:
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={copyToClipboard}
                    className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <span className="text-green-600 text-xs font-medium">Copied!</span>
                    ) : (
                      <ClipboardCopy size={16} />
                    )}
                  </motion.button>
                </div>
                <p className="text-slate-700 text-sm sm:text-base whitespace-pre-wrap leading-relaxed">
                  {currentResponse}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History Section */}
        {isClient && history.length > 0 && (
          <motion.section 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full mt-8"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg sm:text-xl font-semibold text-slate-800">
                Recent Interactions
              </h3>
              {history.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={clearHistory}
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium transition duration-150"
                >
                  Clear History
                </motion.button>
              )}
            </div>
            <motion.div 
              className="space-y-3 max-h-80 overflow-y-auto p-3 bg-white/40 backdrop-blur-sm rounded-lg shadow-md ring-1 ring-black ring-opacity-5"
            >
              <AnimatePresence>
                {history.map((item, index) => (
                  <motion.div
                    key={item.id} 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="p-3 bg-white/70 rounded-md shadow-sm ring-1 ring-black ring-opacity-5 cursor-pointer hover:bg-white transition-colors"
                    onClick={() => { 
                      setName(item.name);
                      setCareer(item.career);
                      console.log("Clicked history item:", item); 
                    }}
                  >
                    <p className="text-xs text-slate-500 mb-1">
                      <time dateTime={new Date(item.timestamp).toISOString()}>
                        {new Date(item.timestamp).toLocaleString()}
                      </time>
                      {' - '}
                      <span
                        className={`font-semibold ${
                          item.mode === 'roast' ? 'text-red-600' : 'text-sky-600'
                        }`}
                      >
                        {item.mode === 'roast' ? 'Roast' : 'Praise'}
                      </span>
                      {' for '}
                      <strong className="text-slate-700">{item.name}</strong> ({item.career})
                    </p>
                    <p className="text-slate-700 text-sm whitespace-pre-wrap">
                      {item.response}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </motion.section>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
