import React from 'react';

const MenuItemCard = ({ item, openEditItemModal, handleDeleteItem, toggleAvailability, currency = '₹', readOnly = false }) => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  
  return (
    <div className="flex gap-4 p-4 rounded-xl bg-[#1e202e] border border-[#2c2f42] hover:border-[#383c54] transition duration-200">
      {/* Image */}
      <div className="w-20 h-20 rounded-lg bg-[#161720] overflow-hidden flex items-center justify-center shrink-0 border border-[#2c2f42]">
        {item.image ? (
          <img
            src={
              item.image.startsWith('http')
                ? item.image
                : `${apiBaseUrl}${item.image}`
            }
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <svg className="h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" />
          </svg>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-gray-200 truncate">{item.name}</h4>
            <span className="text-sm font-extrabold text-amber-400 font-heading shrink-0">
              {currency}{item.price}
            </span>
          </div>
          <p className="text-xs text-gray-400 line-clamp-2 mt-1">{item.description || 'No description'}</p>
        </div>

        
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#262837]">
          {/* Availability toggle */}
          <label className={`flex items-center gap-2 select-none ${readOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
            <input
              type="checkbox"
              checked={item.is_available}
              onChange={() => !readOnly && toggleAvailability(item)}
              disabled={readOnly}
              className="sr-only peer"
            />
            <div className="relative w-8 h-4 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-[#0f1015]"></div>
            <span className="text-[10px] font-semibold text-gray-400 peer-checked:text-amber-400">
              {item.is_available ? 'Available' : 'Sold Out'}
            </span>
          </label>

          {/* Action buttons */}
          {!readOnly && (
            <div className="flex gap-1">
              <button
                onClick={() => openEditItemModal(item)}
                className="p-1 text-gray-400 hover:text-amber-400 rounded transition"
                title="Edit Item"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                onClick={() => handleDeleteItem(item.id)}
                className="p-1 text-gray-400 hover:text-red-400 rounded transition"
                title="Delete Item"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
