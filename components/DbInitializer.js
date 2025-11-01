'use client';

import { useEffect } from 'react';

export default function DbInitializer() {
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        // Only try to initialize if we're on the client side (runtime)
        if (typeof window !== 'undefined') {
          const response = await fetch('/api/db/init', { method: 'POST' });
          const result = await response.json();
          if (result.success) {
            console.log('Database initialized successfully');
          } else {
            console.log('Database init response:', result); // Log but don't error during build
          }
        }
      } catch (error) {
        console.log('Database initialization check:', error.message); // Use log instead of error
      }
    };

    initializeDatabase();
  }, []);

  return null; // This component doesn't render anything
}