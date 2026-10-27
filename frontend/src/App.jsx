/**
 * All page routes. Logged-in pages sit inside ProtectedRoute and the sidebar layout.
 * @author Ashmi Hettige
 */
import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import MarketLayout from './layouts/MarketLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MarketplacePage from './pages/MarketplacePage';
import ListingDetailPage from './pages/ListingDetailPage';
import MyListingsPage from './pages/MyListingsPage';
import ListingFormPage from './pages/ListingFormPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* public: anyone can browse produce */}
      <Route element={<MarketLayout />}>
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/listings/:id" element={<ListingDetailPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route element={<ProtectedRoute roles={['FARMER']} />}>
            <Route path="/farmer/listings" element={<MyListingsPage />} />
            <Route path="/farmer/listings/new" element={<ListingFormPage />} />
            <Route path="/farmer/listings/:id/edit" element={<ListingFormPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}