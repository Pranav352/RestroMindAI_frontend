import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useRestaurant from '../hooks/useRestaurant';
import useMenuData from '../hooks/useMenuData';
import ConfirmDialog from '../components/ConfirmDialog';
import CategorySection from '../components/menu/CategorySection';
import MenuItemModal from '../components/menu/MenuItemModal';
import { useAuth } from '../context/AuthContext';

const MenuManagementPage = () => {
  const {
    restaurant,
    loading: restaurantLoading,
    fetchRestaurant,
  } = useRestaurant();

  const {
    categories,
    menuItems,
    loading: menuLoading,
    error,
    success,
    setSuccess,
    setError,
    fetchMenuData,
    addCategory,
    renameCategory,
    deleteCategory,
    addMenuItem,
    editMenuItem,
    deleteMenuItem,
    toggleItemAvailability,
  } = useMenuData();

  const { user } = useAuth();
  const subscription = user?.subscription;
  const isSubscriptionActive = subscription?.status === 'active' && 
    (subscription?.days_remaining > 0 || subscription?.days_remaining === null);

  // Category Form State
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryParent, setCategoryParent] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  // MenuItem Modal State
  const [showItemModal, setShowItemModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentItem, setCurrentItem] = useState(null);
  const [itemCategory, setItemCategory] = useState('');
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    is_available: true,
  });
  const [itemImage, setItemImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [modalError, setModalError] = useState('');

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    isDanger: false,
  });

  useEffect(() => {
    const init = async () => {
      const rest = await fetchRestaurant();
      if (rest) {
        await fetchMenuData();
      }
    };
    init();
  }, [fetchRestaurant, fetchMenuData]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, setSuccess]);

  // Category CRUD wrappers
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim() || !restaurant) return;
    try {
      await addCategory(restaurant.id, categoryName.trim(), categoryParent || null);
      setCategoryName('');
      setCategoryParent('');
      setShowAddCategory(false);
    } catch (err) {
      // Error message is set in hook
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editCategoryName.trim() || !editingCategory) return;
    try {
      await renameCategory(editingCategory.id, editCategoryName.trim());
      setEditingCategory(null);
      setEditCategoryName('');
    } catch (err) {
      // Error message is set in hook
    }
  };

  const handleDeleteCategoryClick = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Category?',
      message: 'Are you sure you want to delete this category? All items inside it will be deleted permanently.',
      isDanger: true,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          await deleteCategory(id);
        } catch (err) {
          // Handled by hook
        }
      },
    });
  };

  // MenuItem CRUD wrappers
  const openAddItemModal = (categoryId) => {
    setModalMode('add');
    setItemCategory(categoryId);
    setItemForm({ name: '', description: '', price: '', is_available: true });
    setItemImage(null);
    setImagePreview(null);
    setModalError('');
    setShowItemModal(true);
  };

  const openEditItemModal = (item) => {
    setModalMode('edit');
    setCurrentItem(item);
    setItemCategory(item.category);
    setItemForm({
      name: item.name || '',
      description: item.description || '',
      price: item.price || '',
      is_available: item.is_available ?? true,
    });
    setItemImage(null);
    if (item.image) {
      const imgUrl = item.image.startsWith('http')
        ? item.image
        : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${item.image}`;
      setImagePreview(imgUrl);
    } else {
      setImagePreview(null);
    }
    setModalError('');
    setShowItemModal(true);
  };

  const handleItemFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setItemForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleItemImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setModalError('Only JPEG, PNG, WEBP, and GIF images are allowed.');
        e.target.value = null;
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setModalError('Image must be under 5MB.');
        e.target.value = null;
        return;
      }
      setModalError('');
      setItemImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!itemForm.name.trim()) {
      setModalError('Item name is required.');
      return;
    }
    if (!itemForm.price || parseFloat(itemForm.price) <= 0) {
      setModalError('Price must be a positive number.');
      return;
    }

    const data = new FormData();
    data.append('category', itemCategory);
    data.append('name', itemForm.name.trim());
    data.append('price', parseFloat(itemForm.price));
    data.append('description', itemForm.description.trim());
    data.append('is_available', itemForm.is_available);
    if (itemImage) {
      data.append('image', itemImage);
    }

    try {
      if (modalMode === 'add') {
        await addMenuItem(data);
      } else {
        await editMenuItem(currentItem.id, data);
      }
      setShowItemModal(false);
    } catch (err) {
      setModalError(err.response?.data?.image?.[0] || err.response?.data?.price?.[0] || 'Failed to save menu item.');
    }
  };

  const handleDeleteItem = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Menu Item?',
      message: 'Are you sure you want to delete this food item permanently?',
      isDanger: true,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          await deleteMenuItem(id);
        } catch (err) {
          // Handled by hook
        }
      },
    });
  };

  const loading = restaurantLoading || menuLoading;

  if (loading && !restaurant) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-16 max-w-lg mx-auto space-y-6">
        <div className="w-20 h-20 mx-auto bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500">
          <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white font-heading">Restaurant Profile Required</h2>
        <p className="text-gray-400">
          You must set up your restaurant profile details first before creating category folders and food menus.
        </p>
        <Link
          to="/profile"
          className="inline-block px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-[#0f1015] font-semibold rounded-xl transition duration-300"
        >
          Create Restaurant Profile
        </Link>
      </div>
    );
  }

  const currencySymbol = restaurant.currency || '₹';

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-heading">
            Menu Management
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage your categories and food items for {restaurant.name}
          </p>
        </div>
        <div>
          <button
            onClick={() => {
              if (isSubscriptionActive) {
                setShowAddCategory(true);
              }
            }}
            disabled={!isSubscriptionActive}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 border border-transparent rounded-xl text-sm font-semibold transition duration-300 ${
              isSubscriptionActive
                ? 'text-[#0f1015] bg-amber-500 hover:bg-amber-400'
                : 'text-gray-400 bg-gray-700 cursor-not-allowed opacity-50'
            }`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Category
          </button>
        </div>
      </div>

      {!isSubscriptionActive && subscription && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-start gap-2">
          <svg className="h-5 w-5 shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>
            {subscription.status === 'pending'
              ? 'Your account is pending admin approval. You are in read-only mode and cannot add or edit categories/items.'
              : 'Your trial period has ended or has been paused. You are in read-only mode and cannot add or edit categories/items.'}
          </span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-gray-400 hover:text-gray-200">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-gray-400 hover:text-gray-200">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Add Category Dialog (Inline collapse) */}
      {showAddCategory && (
        <form
          onSubmit={handleAddCategory}
          className="bg-[#161720] border border-[#262837] p-6 rounded-2xl flex flex-col sm:flex-row items-end gap-4"
        >
          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">New Category Name</label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g. Appetizers, Desserts"
                className="w-full px-4 py-3 rounded-xl bg-[#1e202e] border border-[#2c2f42] focus:border-amber-500/50 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Parent Category (Optional)</label>
              <select
                value={categoryParent}
                onChange={(e) => setCategoryParent(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#1e202e] border border-[#2c2f42] focus:border-amber-500/50 text-gray-100 focus:outline-none focus:ring-1 focus:ring-amber-500/30 appearance-none"
              >
                <option value="">None (Top Level)</option>
                {categories.filter(c => !c.parent).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto shrink-0 mt-4 sm:mt-0">
            <button
              type="button"
              onClick={() => {
                setShowAddCategory(false);
                setCategoryName('');
                setCategoryParent('');
              }}
              className="w-1/2 sm:w-auto px-5 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-1/2 sm:w-auto px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0f1015] font-semibold transition"
            >
              Add
            </button>
          </div>
        </form>
      )}

      {categories.length === 0 ? (
        <div className="bg-[#161720] border border-[#262837] p-12 rounded-2xl text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 mx-auto bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center text-amber-500">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white font-heading">No Categories Yet</h3>
          <p className="text-gray-400 text-sm">
            Set up menu folders (categories) first before adding food plates.
          </p>
          <button
            onClick={() => {
              if (isSubscriptionActive) {
                setShowAddCategory(true);
              }
            }}
            disabled={!isSubscriptionActive}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
              isSubscriptionActive
                ? 'bg-[#252839] hover:bg-[#2b2f44] text-amber-400 border border-amber-500/20 hover:border-amber-500/40'
                : 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed opacity-50'
            }`}
          >
            Create First Category
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.filter(cat => !cat.parent).map((cat) => {
            const catItems = menuItems.filter((item) => item.category === cat.id);
            const subCategories = categories.filter((subCat) => subCat.parent === cat.id);
 
            return (
              <div key={cat.id} className="space-y-4">
                <CategorySection
                  category={cat}
                  items={catItems}
                  editingCategory={editingCategory}
                  editCategoryName={editCategoryName}
                  setEditCategoryName={setEditCategoryName}
                  setEditingCategory={setEditingCategory}
                  handleUpdateCategory={handleUpdateCategory}
                  handleDeleteCategory={handleDeleteCategoryClick}
                  openAddItemModal={openAddItemModal}
                  openEditItemModal={openEditItemModal}
                  handleDeleteItem={handleDeleteItem}
                  toggleAvailability={toggleItemAvailability}
                  currency={currencySymbol}
                  readOnly={!isSubscriptionActive}
                />
                
                {subCategories.length > 0 && (
                  <div className="pl-8 sm:pl-12 space-y-4 border-l-2 border-[#262837] ml-4 sm:ml-6 mt-4">
                    {subCategories.map((subCat) => {
                      const subCatItems = menuItems.filter((item) => item.category === subCat.id);
                      return (
                        <CategorySection
                          key={subCat.id}
                          category={subCat}
                          items={subCatItems}
                          editingCategory={editingCategory}
                          editCategoryName={editCategoryName}
                          setEditCategoryName={setEditCategoryName}
                          setEditingCategory={setEditingCategory}
                          handleUpdateCategory={handleUpdateCategory}
                          handleDeleteCategory={handleDeleteCategoryClick}
                          openAddItemModal={openAddItemModal}
                          openEditItemModal={openEditItemModal}
                          handleDeleteItem={handleDeleteItem}
                          toggleAvailability={toggleItemAvailability}
                          currency={currencySymbol}
                          readOnly={!isSubscriptionActive}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <MenuItemModal
        isOpen={showItemModal}
        onClose={() => setShowItemModal(false)}
        onSubmit={handleSaveItem}
        itemForm={itemForm}
        handleItemFormChange={handleItemFormChange}
        imagePreview={imagePreview}
        handleItemImageChange={handleItemImageChange}
        modalError={modalError}
        modalMode={modalMode}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        isDanger={confirmDialog.isDanger}
      />
    </div>
  );
};

export default MenuManagementPage;
