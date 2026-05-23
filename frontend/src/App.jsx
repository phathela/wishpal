import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';

import Landing from './pages/Landing';
import Benefits from './pages/Benefits';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateWish from './pages/CreateWish';
import Search from './pages/Search';
import WishPadPage from './pages/WishPadPage';
import Profile from './pages/Profile';
import BuyWees from './pages/BuyWees';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="pb-16 md:pb-0">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/benefits" element={<Benefits />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wish/new"
                element={
                  <ProtectedRoute>
                    <CreateWish />
                  </ProtectedRoute>
                }
              />
              <Route path="/search" element={<Search />} />
              <Route path="/b/:slug" element={<WishPadPage />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/buy-wees"
                element={
                  <ProtectedRoute>
                    <BuyWees />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </AuthProvider>
    </Router>
  );
}
