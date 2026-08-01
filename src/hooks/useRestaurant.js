import { useState, useCallback } from 'react';
import restaurantApi from '../api/restaurant';
import { useAuth } from '../context/AuthContext';

export const useRestaurant = () => {
  const { setActiveTenantId } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchRestaurant = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await restaurantApi.getProfile();
      if (data && data.length > 0) {
        setRestaurant(data[0]);
        return data[0];
      } else {
        setRestaurant(null);
        return null;
      }
    } catch (err) {
      console.error('Error fetching restaurant:', err);
      setError('Failed to load restaurant profile.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createRestaurant = useCallback(async (formData) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const data = await restaurantApi.createProfile(formData);
      setRestaurant(data);
      if (setActiveTenantId) {
        setActiveTenantId(data.id);
      }
      setSuccess('Restaurant profile created successfully!');
      return data;
    } catch (err) {
      console.error('Error creating restaurant:', err);
      setError(err.response?.data?.phone?.[0] || err.response?.data?.logo?.[0] || 'Failed to create restaurant profile.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setActiveTenantId]);

  const updateRestaurant = useCallback(async (id, formData) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const data = await restaurantApi.updateProfile(id, formData);
      setRestaurant(data);
      setSuccess('Restaurant profile updated successfully!');
      return data;
    } catch (err) {
      console.error('Error updating restaurant:', err);
      setError(err.response?.data?.phone?.[0] || err.response?.data?.logo?.[0] || 'Failed to update restaurant profile.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    restaurant,
    loading,
    error,
    success,
    setSuccess,
    setError,
    fetchRestaurant,
    createRestaurant,
    updateRestaurant,
  };
};

export default useRestaurant;
