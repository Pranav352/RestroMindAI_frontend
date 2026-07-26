import { useState, useCallback } from 'react';
import menuApi from '../api/menu';

export const useMenuData = () => {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchMenuData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [cats, items] = await Promise.all([
        menuApi.getCategories(),
        menuApi.getMenuItems(),
      ]);
      setCategories(cats);
      setMenuItems(items);
    } catch (err) {
      console.error('Error fetching menu data:', err);
      setError('Failed to fetch category folders and food plates.');
    } finally {
      setLoading(false);
    }
  }, []);

  const addCategory = useCallback(async (restaurantId, name, parent = null) => {
    try {
      setError('');
      setSuccess('');
      await menuApi.createCategory(restaurantId, name, parent);
      setSuccess('Category folder added successfully!');
      await fetchMenuData();
    } catch (err) {
      console.error('Error adding category:', err);
      setError(err.response?.data?.name?.[0] || 'Failed to add category.');
      throw err;
    }
  }, [fetchMenuData]);

  const renameCategory = useCallback(async (categoryId, name) => {
    try {
      setError('');
      setSuccess('');
      await menuApi.updateCategory(categoryId, name);
      setSuccess('Category folder renamed successfully!');
      await fetchMenuData();
    } catch (err) {
      console.error('Error updating category:', err);
      setError(err.response?.data?.name?.[0] || 'Failed to update category.');
      throw err;
    }
  }, [fetchMenuData]);

  const deleteCategory = useCallback(async (categoryId) => {
    try {
      setError('');
      setSuccess('');
      await menuApi.deleteCategory(categoryId);
      setSuccess('Category folder and its food plates deleted successfully!');
      await fetchMenuData();
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category.');
      throw err;
    }
  }, [fetchMenuData]);

  const addMenuItem = useCallback(async (formData) => {
    try {
      setError('');
      setSuccess('');
      await menuApi.createMenuItem(formData);
      setSuccess('Food menu item created successfully!');
      await fetchMenuData();
    } catch (err) {
      console.error('Error adding menu item:', err);
      setError(err.response?.data?.image?.[0] || err.response?.data?.price?.[0] || 'Failed to add menu item.');
      throw err;
    }
  }, [fetchMenuData]);

  const editMenuItem = useCallback(async (itemId, formData) => {
    try {
      setError('');
      setSuccess('');
      await menuApi.updateMenuItem(itemId, formData);
      setSuccess('Food menu item updated successfully!');
      await fetchMenuData();
    } catch (err) {
      console.error('Error updating menu item:', err);
      setError(err.response?.data?.image?.[0] || err.response?.data?.price?.[0] || 'Failed to update menu item.');
      throw err;
    }
  }, [fetchMenuData]);

  const deleteMenuItem = useCallback(async (itemId) => {
    try {
      setError('');
      setSuccess('');
      await menuApi.deleteMenuItem(itemId);
      setSuccess('Food menu item deleted successfully!');
      await fetchMenuData();
    } catch (err) {
      console.error('Error deleting menu item:', err);
      setError('Failed to delete menu item.');
      throw err;
    }
  }, [fetchMenuData]);

  const toggleItemAvailability = useCallback(async (item) => {
    try {
      setError('');
      const formData = new FormData();
      formData.append('is_available', !item.is_available);
      await menuApi.updateMenuItem(item.id, formData);
      await fetchMenuData();
    } catch (err) {
      console.error('Error toggling availability:', err);
      setError('Failed to update status.');
    }
  }, [fetchMenuData]);

  return {
    categories,
    menuItems,
    loading,
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
  };
};

export default useMenuData;
