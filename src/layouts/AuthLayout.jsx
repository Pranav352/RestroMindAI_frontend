import React from 'react';
import logoImg from '../assets/logo.jpg';

const AuthLayout = ({
  heroTitle,
  heroHighlight,
  heroSubtitle,
  heroCustomContent,
  cardTitle,
  cardSubtitle,
  children,
}) => {
  return (
    <div className="min-h-screen w-full bg-[#0a0b10] text-gray-100 flex items-center justify-center relative overflow-hidden font-sans selection:bg-amber-500 selection:text-slate-950 py-8 sm:py-12">
      {/* Background Ambient Glow Effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-600/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Main Split Layout Container - Uniform Grid Across All Auth Pages */}
      <div className="w-full max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        
        {/* Left Hero Section */}
        <div className="lg:col-span-6 space-y-7 hidden lg:flex flex-col justify-center pr-2">
          {/* Logo Brand Header */}
          <div className="flex items-center gap-3.5">
            <img
              src={logoImg}
              alt="RestroMind AI Logo"
              className="h-11 w-11 rounded-2xl object-cover border border-amber-500/40 shadow-lg shadow-amber-500/20"
            />
            <span className="text-2xl font-black tracking-tight text-white font-heading">
              RestroMind<span className="text-amber-400">.AI</span>
            </span>
          </div>

          {/* Hero Title & Subtitle */}
          <div className="space-y-3.5">
            <h1 className="text-4xl xl:text-5xl font-black leading-tight text-white tracking-tight">
              {heroTitle}{' '}
              {heroHighlight && (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">
                  {heroHighlight}
                </span>
              )}
            </h1>
            {heroSubtitle && (
              <p className="text-gray-400 text-base leading-relaxed">
                {heroSubtitle}
              </p>
            )}
          </div>

          {/* Hero Custom Content */}
          {heroCustomContent}
        </div>

        {/* Right Form Card Section - Clean, Proportionate Container */}
        <div className="lg:col-span-6 w-full max-w-lg mx-auto">
          <div className="bg-[#131522]/90 backdrop-blur-2xl p-7 sm:p-8 rounded-3xl border border-[#24283b] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
            
            {/* Mobile Header Logo */}
            <div className="inline-flex lg:hidden items-center gap-2.5 mb-4">
              <img
                src={logoImg}
                alt="RestroMind AI Logo"
                className="h-9 w-9 rounded-xl object-cover border border-amber-500/40 shadow-md shadow-amber-500/20"
              />
              <span className="text-xl font-bold tracking-tight text-white font-heading">
                RestroMind<span className="text-amber-400">.AI</span>
              </span>
            </div>

            {/* Form Header Title */}
            <div className="text-center sm:text-left mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
                {cardTitle}
              </h2>
              {cardSubtitle && (
                <p className="mt-1 text-sm text-gray-400">
                  {cardSubtitle}
                </p>
              )}
            </div>

            {/* Form Content Body */}
            {children}

          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthLayout;
