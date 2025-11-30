import React from 'react';
import { ShoppingCart, LogOut, Menu } from 'lucide-react';
import { Profile } from '../types';
import { BCV_RATE } from '../constants';

interface NavbarProps {
  profile: Profile | null;
  onLogout: () => void;
  cartCount: number;
  openCart: () => void;
  currency: 'USD' | 'VES';
  toggleCurrency: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ profile, onLogout, cartCount, openCart, currency, toggleCurrency }) => {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-indigo-600">Mercadeo Pro</span>
            {profile && (
              <span className="ml-4 px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 hidden sm:inline-block">
                {profile.role === 'seller' ? `Vendedor: ${profile.company_name}` : 'Comprador'}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleCurrency}
              className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition"
            >
              Cambiar a {currency === 'USD' ? 'Bolívares (VES)' : 'Dólares (USD)'} 
              <span className="block text-xs text-gray-500 text-right">Tasa: {BCV_RATE}</span>
            </button>

            {profile?.role === 'buyer' && (
              <button onClick={openCart} className="relative p-2 text-gray-600 hover:text-indigo-600 transition">
                <ShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {profile && (
              <button 
                onClick={onLogout}
                className="flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-md"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Salir
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};