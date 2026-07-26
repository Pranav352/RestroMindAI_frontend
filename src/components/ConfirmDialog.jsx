import React from 'react';

const ConfirmDialog = ({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDanger = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0f1015]/85 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-[#161720] border border-[#262837] rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-6 transform scale-100 transition-all duration-300">
        <div className="space-y-2 text-center">
          <h3 className="text-lg font-bold text-white font-heading">
            {title}
          </h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={onCancel}
            className="w-1/2 px-4 py-2.5 bg-[#1e202e] hover:bg-[#252839] border border-[#2c2f42] hover:border-[#3d425c] text-gray-300 hover:text-white rounded-xl text-xs font-semibold transition duration-200"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`w-1/2 px-4 py-2.5 rounded-xl text-xs font-semibold transition duration-200 ${
              isDanger
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-amber-500 hover:bg-amber-400 text-[#0f1015]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
