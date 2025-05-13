// components/SkeletonLoader.tsx
import React from 'react';

interface SkeletonLineProps {
  width?: string;
  height?: string;
  className?: string;
}

const SkeletonLine: React.FC<SkeletonLineProps> = ({
  width = 'w-full',
  height = 'h-4', // Standard height for a line of text
  className = '',
}) => {
  return (
    <div
      className={`bg-slate-300/70 dark:bg-slate-700/50 rounded animate-pulse ${width} ${height} ${className}`}
    ></div>
  );
};

interface SkeletonLoaderProps {
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ className }) => {
  return (
    <div
      className={`w-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-md shadow-lg rounded-xl p-6 md:p-8 space-y-5 ${className}`}
    >
      <SkeletonLine width="w-1/3" height="h-5" className="mb-3" /> {/* Title-like line */}
      <SkeletonLine height="h-3.5" />
      <SkeletonLine height="h-3.5" />
      <SkeletonLine height="h-3.5" width="w-4/5" />
      <div className="pt-2">
        <SkeletonLine height="h-3.5" width="w-3/5" />
      </div>
    </div>
  );
};

export default SkeletonLoader;