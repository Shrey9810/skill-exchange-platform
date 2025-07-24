import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './components/home/HomePage';
import DashboardPage from './components/dashboard/DashboardPage';
import ProfilePage from './components/profile/ProfilePage';
import PublicProfilePage from './components/profile/PublicProfilePage'; // --- NEW IMPORT ---
import AuthPage from './components/auth/AuthPage';
import PrivateRoute from './components/auth/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-[#f8f7f4] font-sans">
          <Header />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/register" element={<AuthPage />} />
              <Route path="/user/:userId" element={<PublicProfilePage />} /> {/* --- NEW ROUTE --- */}

              {/* Private Routes */}
              <Route 
                path="/dashboard" 
                element={<PrivateRoute><DashboardPage /></PrivateRoute>} 
              />
              <Route 
                path="/profile" 
                element={<PrivateRoute><ProfilePage /></PrivateRoute>} 
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
