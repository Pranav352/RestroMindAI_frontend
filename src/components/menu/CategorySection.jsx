import React from 'react';
import MenuItemCard from './MenuItemCard';

const CategorySection = ({
  category,
  items,
  editingCategory,
  editCategoryName,
  setEditCategoryName,
  setEditingCategory,
  handleUpdateCategory,
  handleDeleteCategory,
  openAddItemModal,
  openEditItemModal,
  handleDeleteItem,
  toggleAvailability,
  currency = '₹',
  readOnly = false
}) => {

  return (
    <div className="bg-[#161720] border border-[#262837] rounded-2xl overflow-hidden shadow-lg transition duration-200">
      {/* Category Header */}
      <div className="px-6 py-4 bg-[#1b1c28] border-b border-[#262837] flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          {editingCategory?.id === category.id && !readOnly ? (
            <form onSubmit={handleUpdateCategory} className="flex items-center gap-2">
              <input
                type="text"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-[#1e202e] border border-[#2c2f42] focus:border-amber-500/50 text-gray-100 text-sm focus:outline-none"
                required
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-[#0f1015] rounded-lg text-xs font-semibold transition"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-semibold transition"
              >
                Cancel
              </button>
            </form>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white font-heading">{category.name}</h3>
              <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded-full">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {!readOnly && (
            <>
              <button
                onClick={() => openAddItemModal(category.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#252839] hover:bg-[#2b2f44] text-amber-400 border border-amber-500/10 hover:border-amber-500/30 rounded-xl text-xs font-semibold transition"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Item
              </button>
              {editingCategory?.id !== category.id && (
                <>
                  <button
                    onClick={() => {
                      setEditingCategory(category);
                      setEditCategoryName(category.name);
                    }}
                    className="p-1.5 text-gray-400 hover:text-amber-400 rounded-lg hover:bg-gray-800 transition"
                    title="Rename Category"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-800 transition"
                    title="Delete Category"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Items List */}
      <div className="p-6">
        {items.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center italic">
            No menu items in this category yet. {readOnly ? '' : 'Click Add Item to start.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                openEditItemModal={openEditItemModal}
                handleDeleteItem={handleDeleteItem}
                toggleAvailability={toggleAvailability}
                currency={currency}
                readOnly={readOnly}
              />
            ))}

          </div>
        )}
      </div>
    </div>
  );
};

export default CategorySection;
