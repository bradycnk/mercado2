import React, { useState } from 'react';
import { supabase, uploadImage } from '../services/supabaseClient';
import { CartItem, Profile } from '../types';
import { BCV_RATE } from '../constants';
import { X, Upload, Check, ShoppingCart } from 'lucide-react';

interface CheckoutProps {
  cart: CartItem[];
  closeCart: () => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  profile: Profile;
  currency: 'USD' | 'VES';
}

export const Checkout: React.FC<CheckoutProps> = ({ cart, closeCart, removeFromCart, clearCart, profile, currency }) => {
  const [step, setStep] = useState<'cart' | 'payment' | 'history'>('cart');
  const [delivery, setDelivery] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const totalUSD = cart.reduce((acc, item) => acc + item.price_usd, 0);
  const deliveryFee = delivery ? 5 : 0; // Flat fee $5
  const finalTotalUSD = totalUSD + deliveryFee;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setLoading(true);

    try {
      let proofUrl = '';
      if (paymentFile) {
        const uploaded = await uploadImage(paymentFile, `payments/${profile.id}/${Date.now()}`);
        if (uploaded) proofUrl = uploaded;
      }

      // Group by seller to create separate orders if necessary, 
      // but for simplicity we will create one order entry per checkout (or per seller)
      // Here we assume items might belong to different sellers.
      
      const itemsBySeller: Record<string, CartItem[]> = {};
      cart.forEach(item => {
        if (!itemsBySeller[item.seller_id]) itemsBySeller[item.seller_id] = [];
        itemsBySeller[item.seller_id].push(item);
      });

      for (const sellerId of Object.keys(itemsBySeller)) {
        const sellerItems = itemsBySeller[sellerId];
        const sellerTotal = sellerItems.reduce((acc, i) => acc + i.price_usd, 0) + (delivery ? 5 : 0); // Adding delivery to each for simplicity in demo

        await supabase.from('orders').insert({
          buyer_id: profile.id,
          seller_id: sellerId,
          product_details: sellerItems,
          total_amount_usd: sellerTotal,
          payment_ref_last4: paymentRef.slice(-4),
          payment_proof_url: proofUrl,
          delivery_needed: delivery,
          status: 'pending'
        });
      }

      alert('Compra realizada con éxito! El vendedor verificará tu pago.');
      clearCart();
      closeCart();
    } catch (error) {
      console.error(error);
      alert('Error procesando la compra.');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setStep('history');
    const { data } = await supabase.from('orders').select('*').eq('buyer_id', profile.id).order('created_at', { ascending: false });
    if (data) setHistory(data);
  };

  const formatMoney = (usd: number) => {
     if (currency === 'VES') return `Bs. ${(usd * BCV_RATE).toFixed(2)}`;
     return `$${usd.toFixed(2)}`;
  };

  if (step === 'history') {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-end">
        <div className="w-full max-w-md bg-white h-full overflow-y-auto p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Mis Compras</h2>
            <button onClick={closeCart}><X className="w-6 h-6" /></button>
          </div>
          <div className="space-y-4">
             {history.map(order => (
               <div key={order.id} className="border p-4 rounded-lg bg-gray-50">
                 <div className="flex justify-between mb-2">
                   <span className="font-bold text-sm">Ref: {order.payment_ref_last4}</span>
                   <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'completed' ? 'bg-green-200' : 'bg-yellow-200'}`}>{order.status}</span>
                 </div>
                 <p className="text-sm text-gray-600 mb-2">Total: ${order.total_amount_usd}</p>
                 <ul className="text-xs list-disc list-inside text-gray-500">
                    {(order.product_details as CartItem[]).map((p, i) => <li key={i}>{p.title}</li>)}
                 </ul>
               </div>
             ))}
          </div>
          <button onClick={() => setStep('cart')} className="mt-4 w-full py-2 text-indigo-600 font-medium">Volver al Carrito</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-end transition-opacity duration-300">
      <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-indigo-50">
          <h2 className="text-lg font-bold text-gray-900">{step === 'cart' ? 'Tu Carrito' : 'Finalizar Compra'}</h2>
          <button onClick={closeCart} className="text-gray-500 hover:text-gray-700"><X /></button>
        </div>

        {/* Body */}
        <div className="flex-1 p-4 overflow-y-auto">
          {step === 'cart' ? (
            <>
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <ShoppingCart className="w-12 h-12 mb-2 opacity-50" />
                  <p>Tu carrito está vacío</p>
                  <button onClick={loadHistory} className="mt-4 text-indigo-600 underline text-sm">Ver historial de compras</button>
                </div>
              ) : (
                <ul className="space-y-4">
                  {cart.map((item, index) => (
                    <li key={`${item.id}-${index}`} className="flex py-2 border-b">
                      <img src={item.image_url} alt={item.title} className="w-16 h-16 object-cover rounded-md" />
                      <div className="ml-4 flex-1">
                        <h4 className="text-sm font-medium">{item.title}</h4>
                        <p className="text-gray-500 text-sm">{formatMoney(item.price_usd)}</p>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 text-sm">Eliminar</button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <form id="checkout-form" onSubmit={handleCheckout} className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="font-bold text-blue-800 mb-2">Datos Pago Móvil</h3>
                <p className="text-sm text-blue-700">Banco: <span className="font-mono">Venezuela (0102)</span></p>
                <p className="text-sm text-blue-700">Teléfono: <span className="font-mono">0412-123-4567</span></p>
                <p className="text-sm text-blue-700">CI: <span className="font-mono">V-12345678</span></p>
                <p className="text-sm text-blue-700 font-bold mt-2">Monto a pagar: Bs. {((finalTotalUSD * BCV_RATE)).toFixed(2)}</p>
              </div>

              <div>
                 <label className="flex items-center space-x-2">
                   <input type="checkbox" checked={delivery} onChange={e => setDelivery(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4" />
                   <span className="text-sm font-medium text-gray-700">Quiero servicio de Delivery (+$5)</span>
                 </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Últimos 4 dígitos de Referencia</label>
                <input required type="text" maxLength={4} pattern="\d{4}" value={paymentRef} onChange={e => setPaymentRef(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2" placeholder="0000" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Capture de Pago</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:bg-gray-50 transition cursor-pointer relative">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                        <span>Sube un archivo</span>
                        <input required type="file" className="hidden" accept="image/*" onChange={e => setPaymentFile(e.target.files?.[0] || null)} />
                      </label>
                    </div>
                  </div>
                  {paymentFile && (
                    <div className="absolute inset-0 bg-green-50 flex items-center justify-center rounded-md">
                      <p className="text-green-700 font-medium flex items-center"><Check className="w-4 h-4 mr-2" /> Listo: {paymentFile.name}</p>
                    </div>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between mb-4 text-sm font-medium">
            <span>Subtotal</span>
            <span>{formatMoney(totalUSD)}</span>
          </div>
          {step === 'payment' && (
            <div className="flex justify-between mb-4 text-sm font-medium text-green-600">
              <span>Delivery</span>
              <span>{formatMoney(deliveryFee)}</span>
            </div>
          )}
          <div className="flex justify-between mb-6 text-xl font-bold">
            <span>Total</span>
            <span>{formatMoney(step === 'cart' ? totalUSD : finalTotalUSD)}</span>
          </div>
          
          {step === 'cart' ? (
            <button 
              onClick={() => setStep('payment')} 
              disabled={cart.length === 0}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition shadow-lg"
            >
              Proceder al Pago
            </button>
          ) : (
            <div className="flex space-x-3">
              <button onClick={() => setStep('cart')} className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-50">Atrás</button>
              <button 
                form="checkout-form"
                type="submit" 
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 shadow-lg disabled:opacity-70 flex justify-center items-center"
              >
                {loading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div> : 'Confirmar Pago'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};