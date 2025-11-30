import React, { useEffect, useState } from 'react';
import { supabase } from './services/supabaseClient';
import { Profile, CartItem, Product } from './types';
import { Navbar } from './components/Navbar';
import { Auth } from './components/Auth';
import { BuyerDashboard } from './components/BuyerDashboard';
import { SellerDashboard } from './components/SellerDashboard';
import { Checkout } from './components/Checkout';
import { HashRouter } from 'react-router-dom';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currency, setCurrency] = useState<'USD' | 'VES'>('USD');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        // Reset profile to ensure we fetch fresh data for new user
        setProfile(null); 
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      let attempts = 0;
      let profileData = null;
      
      // Retry loop to handle race condition where profile insert finishes after auth state change
      while (attempts < 3 && !profileData) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (!error) {
          profileData = data;
        } else if (error.code === 'PGRST116') {
          // PGRST116: JSON object requested, multiple (or no) rows returned
          // Profile might not be created yet, wait and retry
          console.log(`Profile lookup attempt ${attempts + 1} failed (not found yet), retrying...`);
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          // Real error
          throw error;
        }
      }

      if (profileData) {
        setProfile(profileData);
      } else {
        console.warn('No profile found for user after retries.');
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error.message || error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCart([]);
    setProfile(null);
  };

  const addToCart = (product: Product) => {
    setCart(prev => [...prev, { ...product, quantity: 1 }]);
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    // Removes the first instance found
    const index = cart.findIndex(item => item.id === id);
    if (index > -1) {
      const newCart = [...cart];
      newCart.splice(index, 1);
      setCart(newCart);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-indigo-600"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div></div>;
  }

  if (!session || !profile) {
    return <Auth />;
  }

  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
        <Navbar 
          profile={profile} 
          onLogout={handleLogout} 
          cartCount={cart.length} 
          openCart={() => setIsCartOpen(true)} 
          currency={currency}
          toggleCurrency={() => setCurrency(prev => prev === 'USD' ? 'VES' : 'USD')}
        />

        <main>
          {profile.role === 'seller' ? (
            <SellerDashboard profile={profile} />
          ) : (
            <BuyerDashboard addToCart={addToCart} currency={currency} />
          )}
        </main>

        {isCartOpen && profile.role === 'buyer' && (
          <Checkout 
            cart={cart} 
            closeCart={() => setIsCartOpen(false)} 
            removeFromCart={removeFromCart}
            clearCart={() => setCart([])}
            profile={profile}
            currency={currency}
          />
        )}
      </div>
    </HashRouter>
  );
};

export default App;