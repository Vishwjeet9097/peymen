import { useState, useEffect } from 'react';

/**
 * Custom hook to detect online/offline status
 * Returns the current online status and provides callbacks for status changes
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    // Check initial status
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
    // Default to true if we can't determine
    return true;
  });

  const [wasOffline, setWasOffline] = useState<boolean>(false);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);
    setWasOffline(!navigator.onLine);

    // Handle online event
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true); // Track that we were offline
    };

    // Handle offline event
    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline
  };
};
