'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const PageLoader = () => {
  const [showLoader, setShowLoader] = useState(true);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  // Safely handle useSearchParams which might not be available during static generation
  const searchParams = typeof window !== 'undefined' ? useSearchParams() : null;
  const prevPathnameRef = useRef(pathname);

  // Handle initial loading
  useEffect(() => {
    let startTime: number | null = null;
    const duration = 500; // 500ms for initial load
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progressPercent = Math.min((elapsed / duration) * 100, 100);
      
      setProgress(progressPercent);
      
      if (progressPercent < 100) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(() => setShowLoader(false), 50);
      }
    };
    
    requestAnimationFrame(animate);
    
    return () => {};
  }, []);

  // Handle navigation changes
  useEffect(() => {
    // Check if pathname has actually changed
    if (pathname !== prevPathnameRef.current) {
      // Update the ref
      prevPathnameRef.current = pathname;
      
      // Reset progress and show loader immediately
      setShowLoader(true);
      setProgress(0);
      
      let startTime: number | null = null;
      const duration = 600; // 600ms for navigation
      
      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progressPercent = Math.min((elapsed / duration) * 100, 100);
        
        setProgress(progressPercent);
        
        if (progressPercent < 100) {
          requestAnimationFrame(animate);
        } else {
          setTimeout(() => setShowLoader(false), 50);
        }
      };
      
      // Start animation immediately
      requestAnimationFrame(animate);
    }
    
    return () => {};
  }, [pathname, searchParams?.toString()]);

  if (!showLoader) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 z-[100]">
      <div 
        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-75 ease-out"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
};

export default PageLoader;