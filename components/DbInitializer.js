'use client';

import { useEffect } from 'react';

export default function DbInitializer() {
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        const response = await fetch('/api/db/init', { method: 'POST' });
        const result = await response.json();
        if (result.success) {
          console.log('Database initialized successfully');
        } else {
          console.error('Database initialization error:', result.error);
        }
      } catch (error) {
        console.error('Database initialization failed:', error);
      }
    };

    initializeDatabase();
  }, []);

  return null; // This component doesn't render anything
}