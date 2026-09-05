import React from 'react';
import { useNavigate } from 'react-router-dom';

const UpgradeModal = ({ isOpen, onClose, title, description, currentQuota, maxQuota, featureName }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#161720] border border-amber-500/30 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative overflow-hidden text-center space-y-6">
        <div className="absolute top-0 right-0 translate-x-8 -translate-y-8 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 text-xl font-bold"
        >
          ✕
        </button>

        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl shadow-inner">
          🚀
        </div>

        <div>
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 mb-2 inline-block">
            Quota Limit Reached 🔒
          </span>
          <h2 className="text-2xl font-extrabold text-white font-heading mt-1">
            {title || 'Upgrade to RestroMind Pro'}
          </h2>
          <p className="text-gray-300 text-sm mt-2 leading-relaxed">
            {description || `You have reached the maximum quota of ${maxQuota || 'free tier'} for ${featureName || 'this feature'}. Upgrade your store subscription to unlock unlimited access.`}
          </p>
        </div>

        {currentQuota !== undefined && maxQuota !== undefined && (
          <div className="bg-[#1d1f2b] p-4 rounded-xl border border-[#2c2f42] flex items-center justify-between text-xs">
            <span className="text-gray-400 font-medium">Free Tier Usage:</span>
            <span className="font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
              {currentQuota} / {maxQuota} Used
            </span>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <button
            onClick={() => {
              onClose();
              navigate('/settings');
            }}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold text-sm hover:from-amber-400 hover:to-orange-400 transition shadow-lg shadow-amber-500/20"
          >
            Upgrade to Pro Plan ($29/mo) →
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition"
          >
            Continue with Free Tier
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
