import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-[#0f1015] flex flex-col items-center justify-center p-6 font-sans text-center">
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-9xl font-extrabold text-transparent bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text font-heading tracking-widest animate-pulse">
          404
        </h1>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white font-heading">
            Page Not Found
          </h2>
          <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
            The page you are looking for does not exist, has been removed, or is temporarily unavailable.
          </p>
        </div>

        <div className="pt-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-[#0f1015] transition duration-200 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
