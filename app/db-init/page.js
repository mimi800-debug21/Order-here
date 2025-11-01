'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DbInitPage() {
  const [status, setStatus] = useState('initializing');
  const [message, setMessage] = useState('Initializing database...');
  const router = useRouter();

  useEffect(() => {
    const initializeDb = async () => {
      try {
        setStatus('connecting');
        setMessage('Connecting to database...');
        
        const response = await fetch('/api/db/init', { method: 'POST' });
        const result = await response.json();
        
        if (result.success) {
          setStatus('success');
          setMessage('Database initialized successfully! Redirecting...');
          setTimeout(() => {
            router.push('/');
          }, 2000);
        } else {
          setStatus('error');
          setMessage(`Error: ${result.error}`);
        }
      } catch (error) {
        setStatus('error');
        setMessage(`Connection error: ${error.message}`);
      }
    };

    initializeDb();
  }, [router]);

  const getStatusStyle = () => {
    switch (status) {
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="mb-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Database Initialization</h1>
        <p className={`text-lg ${getStatusStyle()}`}>{message}</p>
        {status === 'error' && (
          <p className="text-red-400 mt-4">
            Please make sure your DATABASE_URL is properly configured in your environment variables.
          </p>
        )}
      </div>
    </div>
  );
}