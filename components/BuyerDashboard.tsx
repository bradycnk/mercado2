import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Product, CartItem, Profile } from '../types';
import { CATEGORIES, CATEGORY_ICONS, BCV_RATE } from '../constants';
import { ShoppingCart } from 'lucide-react';

interface BuyerDashboardProps {
  addToCart: (product: Product) => void;
  currency: 'USD' | 'VES';
}

export const BuyerDashboard: React.FC<BuyerDashboardProps> = ({ addToCart, currency }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllProducts = async () => {
      setLoading(true);
      const query = supabase.from('products').select('*');
      if (selectedCategory !== 'Todas') {
        query.eq('category', selectedCategory);
      }
      const { data } = await query;
      if (data) setProducts(data);
      setLoading(false);
    };

    fetchAllProducts();
  }, [selectedCategory]);

  const formatPrice = (usd: number) => {
    if (currency === 'VES') {
      return `Bs. ${(usd * BCV_RATE).toFixed(2)}`;
    }
    return `$${usd.toFixed(2)}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Category Filter */}
      <div className="mb-8 overflow-x-auto pb-4">
        <div className="flex space-x-4">
          <button
             onClick={() => setSelectedCategory('Todas')}
             className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition ${selectedCategory === 'Todas' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}
          >
            Todas
          </button>
          {CATEGORIES.map(cat => {
            const Icon = CATEGORY_ICONS[cat];
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium flex items-center space-x-2 transition ${selectedCategory === cat ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition duration-300 flex flex-col">
              <div className="relative h-48 bg-gray-200">
                <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">{product.category}</span>
                <h3 className="mt-1 text-lg font-bold text-gray-900 line-clamp-1">{product.title}</h3>
                <p className="mt-1 text-sm text-gray-500 line-clamp-2 flex-grow">{product.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xl font-bold text-gray-900">{formatPrice(product.price_usd)}</span>
                  <button 
                    onClick={() => addToCart(product)}
                    className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition shadow-md"
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};