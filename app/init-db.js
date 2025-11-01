'use client';

import { useEffect } from 'react';
import { initializeTables } from './actions';

export default function InitDB() {
  useEffect(() => {
    const setupDatabase = async () => {
      try {
        await initializeTables();
        console.log('Database initialized successfully');
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    };

    setupDatabase();
  }, []);

  return null; // This component doesn't render anything
}