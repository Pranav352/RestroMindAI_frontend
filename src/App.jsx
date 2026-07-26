import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import RestaurantProfilePage from './pages/RestaurantProfilePage';
import MenuManagementPage from './pages/MenuManagementPage';
import QRCodePage from './pages/QRCodePage';
import PublicMenuPage from './pages/PublicMenuPage';
import OrdersPage from './pages/OrdersPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminRestaurantsPage from './pages/AdminRestaurantsPage';
import NotFoundPage from './pages/NotFoundPage';
import ErrorBoundary from './components/ErrorBoundary';


function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>

        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/menu/:restaurantId" element={<PublicMenuPage />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="profile" element={<RestaurantProfilePage />} />
            <Route path="menu" element={<MenuManagementPage />} />
            <Route path="qr" element={<QRCodePage />} />
            <Route path="orders" element={<OrdersPage />} />
            
            {/* Admin Routes */}
            <Route
              path="admin/users"
              element={
                <AdminRoute>
                  <AdminUsersPage />
                </AdminRoute>
              }
            />
            <Route
              path="admin/restaurants"
              element={
                <AdminRoute>
                  <AdminRestaurantsPage />
                </AdminRoute>
              }
            />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<NotFoundPage />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
   </ErrorBoundary>
  );
}

export default App;
