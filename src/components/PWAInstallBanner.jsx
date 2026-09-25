import React from 'react';
import { usePWA } from '../hooks/usePWA';

const PWAInstallBanner = () => {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="bg-amber-500 text-slate-950 font-bold px-4 py-2 text-center text-xs flex items-center justify-center gap-2 shadow-md z-50">
      <span>📡 You are working offline. Menu and orders are served from local device cache.</span>
    </div>
  );
};

export default PWAInstallBanner;
