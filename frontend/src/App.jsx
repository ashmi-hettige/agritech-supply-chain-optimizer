/**
 * All page routes. Logged-in pages sit inside ProtectedRoute; role-only pages check the role too.
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
import CartPage from './pages/CartPage';
import MyOrdersPage from './pages/MyOrdersPage';
import IncomingOrdersPage from './pages/IncomingOrdersPage';
import AdvisorPage from './pages/AdvisorPage';
import MarketPricesPage from './pages/MarketPricesPage';
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

        {/* buyers only: cart and orders keep the marketplace header */}
        <Route element={<ProtectedRoute roles={['BUYER']} />}>
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<MyOrdersPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/prices" element={<MarketPricesPage />} />

          <Route element={<ProtectedRoute roles={['FARMER']} />}>
            <Route path="/farmer/listings" element={<MyListingsPage />} />
            <Route path="/farmer/listings/new" element={<ListingFormPage />} />
            <Route path="/farmer/listings/:id/edit" element={<ListingFormPage />} />
            <Route path="/farmer/orders" element={<IncomingOrdersPage />} />
            <Route path="/farmer/advisor" element={<AdvisorPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}