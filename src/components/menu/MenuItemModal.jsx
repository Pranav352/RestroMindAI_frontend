import React from 'react';

const MenuItemModal = ({
  isOpen,
  onClose,
  onSubmit,
  itemForm,
  handleItemFormChange,
  imagePreview,
  handleItemImageChange,
  modalError,
  modalMode
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0f1015]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#161720] border border-[#262837] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="px-6 py-4 border-b border-[#262837] flex items-center justify-between">
          <h3 className="text-lg font-bold text-white font-heading">
            {modalMode === 'add' ? 'Add Menu Item' : 'Edit Menu Item'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {modalError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs flex gap-2">
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{modalError}</span>
            </div>
          )}

          {/* Image upload */}
          <div className="flex items-center gap-4 pb-4 border-b border-[#262837]">
            <div className="w-16 h-16 rounded-xl bg-[#1e202e] border border-[#2c2f42] overflow-hidden flex items-center justify-center shrink-0">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <svg className="h-6 w-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-300">Food Image</h4>
              <label className="inline-block mt-1 px-3 py-1.5 bg-[#252839] hover:bg-[#2b2f44] text-amber-400 rounded-lg text-[10px] font-semibold cursor-pointer transition">
                Browse File
                <input type="file" onChange={handleItemImageChange} className="hidden" accept="image/*" />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Item Name *</label>
            <input
              type="text"
              name="name"
              value={itemForm.name}
              onChange={handleItemFormChange}
              className="w-full px-4 py-2.5 rounded-xl bg-[#1e202e] border border-[#2c2f42] focus:border-amber-500/50 text-gray-100 text-sm focus:outline-none"
              placeholder="e.g. Truffle Fries"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Price ($) *</label>
            <input
              type="number"
              name="price"
              value={itemForm.price}
              onChange={handleItemFormChange}
              step="0.01"
              min="0.01"
              className="w-full px-4 py-2.5 rounded-xl bg-[#1e202e] border border-[#2c2f42] focus:border-amber-500/50 text-gray-100 text-sm focus:outline-none"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Description</label>
            <textarea
              name="description"
              value={itemForm.description}
              onChange={handleItemFormChange}
              rows="3"
              className="w-full px-4 py-2.5 rounded-xl bg-[#1e202e] border border-[#2c2f42] focus:border-amber-500/50 text-gray-100 text-sm focus:outline-none"
              placeholder="Describe this dish..."
            ></textarea>
          </div>

          <div className="flex items-center justify-between py-2 bg-[#1e202e] px-4 rounded-xl border border-[#2c2f42]">
            <span className="text-xs font-semibold text-gray-300">Is Available</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="is_available"
                checked={itemForm.is_available}
                onChange={handleItemFormChange}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-[#0f1015]"></div>
            </label>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-1/2 px-4 py-3 bg-amber-500 hover:bg-amber-400 text-[#0f1015] rounded-xl text-sm font-semibold transition"
            >
              Save Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MenuItemModal;
