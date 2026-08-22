import React from 'react';

/**
 * Universal Popup / Alert Modal Component
 * Replaces native browser alert() and confirm() with a branded, modern UI.
 * 
 * @param {boolean} isOpen - Controls visibility
 * @param {string} type - 'info' | 'warning' | 'error' | 'success' | 'occupied' | 'confirm'
 * @param {string} title - Main modal heading
 * @param {string} message - Description or guidance text
 * @param {string} primaryText - Label for main confirmation / dismiss button
 * @param {string} secondaryText - Optional label for secondary button (cancel)
 * @param {function} onPrimary - Callback when primary button is clicked
 * @param {function} onSecondary - Callback when secondary button is clicked
 * @param {function} onClose - Callback when modal is dismissed (via backdrop or close icon)
 */
const PopupModal = ({
  isOpen,
  type = 'info',
  title,
  message,
  primaryText = 'OK',
  secondaryText,
  onPrimary,
  onSecondary,
  onClose,
}) => {
  if (!isOpen) return null;

  // Icon & Theme configurations based on type
  const config = {
    occupied: {
      icon: '🔒',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
      primaryBtn: 'bg-gradient-to-r from-amber-500 to-orange-600 text-[#0f1015] hover:from-amber-600 hover:to-orange-700',
      badge: 'Table Active',
    },
    warning: {
      icon: '⚠️',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
      primaryBtn: 'bg-amber-500 hover:bg-amber-400 text-[#0f1015]',
      badge: 'Notice',
    },
    error: {
      icon: '✕',
      iconBg: 'bg-red-500/10 text-red-400 border-red-500/25',
      primaryBtn: 'bg-red-500 hover:bg-red-600 text-white',
      badge: 'Error',
    },
    success: {
      icon: '✓',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
      primaryBtn: 'bg-emerald-500 hover:bg-emerald-400 text-[#0f1015]',
      badge: 'Success',
    },
    confirm: {
      icon: '❓',
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
      primaryBtn: 'bg-gradient-to-r from-amber-500 to-orange-600 text-[#0f1015]',
      badge: 'Confirm Action',
    },
    info: {
      icon: 'ℹ️',
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
      primaryBtn: 'bg-blue-500 hover:bg-blue-400 text-[#0f1015]',
      badge: 'Information',
    },
  }[type] || {
    icon: 'ℹ️',
    iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    primaryBtn: 'bg-amber-500 hover:bg-amber-400 text-[#0f1015]',
    badge: 'Notification',
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      if (onClose) onClose();
      else if (onSecondary) onSecondary();
      else if (onPrimary) onPrimary();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fadeIn"
    >
      <div className="bg-[#161720] border border-[#262837] hover:border-[#373a50] rounded-3xl w-full max-w-sm shadow-2xl p-6 sm:p-7 space-y-6 relative overflow-hidden transition-all duration-300">
        {/* Glow Accent */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-36 h-36 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Header & Icon */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div
            className={`h-14 w-14 rounded-2xl border flex items-center justify-center text-2xl font-bold shadow-lg ${config.iconBg}`}
          >
            {config.icon}
          </div>

          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2.5 py-0.5 rounded-full bg-[#1e202e] border border-[#2c2f42] inline-block">
              {config.badge}
            </span>
            <h3 className="text-lg font-black text-white font-heading">
              {title || 'Notification'}
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed max-w-xs mx-auto">
              {message}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          {secondaryText && (
            <button
              type="button"
              onClick={onSecondary || onClose}
              className="flex-1 py-3 px-4 bg-[#1d1f2b] hover:bg-[#252839] border border-[#2c2f42] hover:border-[#3c405a] text-gray-300 hover:text-white rounded-xl text-xs font-bold transition duration-200"
            >
              {secondaryText}
            </button>
          )}
          <button
            type="button"
            onClick={onPrimary || onClose}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-extrabold shadow-lg transition duration-200 flex items-center justify-center ${config.primaryBtn}`}
          >
            {primaryText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PopupModal;
