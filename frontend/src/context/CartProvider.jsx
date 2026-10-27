/**
 * The buyer's cart, saved in the browser so it survives a page reload.
 * Each buyer has their own saved cart; other roles always see an empty one.
 * Prices are only shown here: the server reads the real price and stock at checkout.
 * @author Ashmi Hettige
 */
import { useState } from 'react';
import useAuth from '../hooks/useAuth';
import { CartContext } from './CartContext';

const CART_KEY_PREFIX = 'goviroute_cart_';

function readCart(ownerId) {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY_PREFIX + ownerId));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function writeCart(ownerId, items) {
  try {
    localStorage.setItem(CART_KEY_PREFIX + ownerId, JSON.stringify(items));
  } catch {
    // storage blocked: the cart still works until the tab closes
  }
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const ownerId = user?.role === 'BUYER' ? user.id : null;
  const [cart, setCart] = useState({ ownerId: null, items: [] });

  // someone else logged in (or out): switch to that buyer's saved cart
  if (cart.ownerId !== ownerId) {
    setCart({ ownerId, items: ownerId ? readCart(ownerId) : [] });
  }

  function save(change) {
    setCart((current) => {
      const items = change(current.items);
      if (current.ownerId) writeCart(current.ownerId, items);
      return { ...current, items };
    });
  }

  // adds a listing, or changes the kilos if it is already in the cart
  function setItem(listing, quantityKg) {
    const item = {
      listingId: listing.id,
      cropName: listing.cropName,
      cropImageUrl: listing.cropImageUrl,
      grade: listing.grade,
      farmerId: listing.farmerId,
      farmName: listing.farmName ?? listing.farmerName,
      district: listing.district,
      pricePerKg: Number(listing.pricePerKg),
      availableKg: Number(listing.availableKg),
      quantityKg: Number(quantityKg),
    };
    save((items) => {
      const exists = items.some((line) => line.listingId === listing.id);
      return exists ? items.map((line) => (line.listingId === listing.id ? item : line)) : [...items, item];
    });
  }

  function updateQuantity(listingId, quantityKg) {
    save((items) => items.map((line) => (
      line.listingId === listingId ? { ...line, quantityKg: Number(quantityKg) } : line
    )));
  }

  function removeItem(listingId) {
    save((items) => items.filter((line) => line.listingId !== listingId));
  }

  function clear() {
    save(() => []);
  }

  const items = cart.ownerId === ownerId ? cart.items : [];
  const getItem = (listingId) => items.find((line) => line.listingId === listingId);
  const totalAmount = items.reduce((sum, line) => sum + line.pricePerKg * line.quantityKg, 0);

  return (
    <CartContext.Provider
      value={{ items, count: items.length, totalAmount, getItem, setItem, updateQuantity, removeItem, clear }}
    >
      {children}
    </CartContext.Provider>
  );
}