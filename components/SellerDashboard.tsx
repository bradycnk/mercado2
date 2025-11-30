import React, { useEffect, useState } from 'react';
import { supabase, uploadImage } from '../services/supabaseClient';
import { generateProductDescription } from '../services/geminiService';
import { Profile, Product, Order } from '../types';
import { CATEGORIES } from '../constants';
import { Plus, Loader2, Sparkles, Eye, CheckCircle } from 'lucide-react';

interface SellerDashboardProps {
  profile: Profile;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({ profile }) => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, [profile.id]);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').eq('seller_id', profile.id);
    if (data) setProducts(data);
  };

  const fetchOrders = async () => {
    // Join with buyer profile info
    const { data } = await supabase
      .from('orders')
      .select(`*, buyer_profile:buyer_id ( full_name, email )`)
      .eq('seller_id', profile.id)
      .order('created_at', { ascending: false });
    
    if (data) setOrders(data);
  };

  const handleAiDescription = async () => {
    if (!title) return alert("Escribe el nombre del producto primero.");
    setAiLoading(true);
    const desc = await generateProductDescription(title, category);
    setDescription(desc);
    setAiLoading(false);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = 'https://picsum.photos/400/400';
      if (imageFile) {
        const uploaded = await uploadImage(imageFile, `products/${profile.id}/${Date.now()}`);
        if (uploaded) imageUrl = uploaded;
      }

      const { error } = await supabase.from('products').insert({
        seller_id: profile.id,
        title,
        description,
        price_usd: parseFloat(price),
        category,
        image_url: imageUrl
      });

      if (error) throw error;
      
      // Reset form
      setTitle('');
      setDescription('');
      setPrice('');
      setImageFile(null);
      fetchProducts();
      alert('Producto agregado!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex space-x-4 mb-8">
        <button 
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-md font-medium ${activeTab === 'products' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 shadow-sm'}`}
        >
          Mis Productos
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-md font-medium ${activeTab === 'orders' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 shadow-sm'}`}
        >
          Pedidos Recibidos
        </button>
      </div>

      {activeTab === 'products' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Form */}
          <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-md h-fit">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Plus className="w-5 h-5 mr-2" /> Agregar Producto
            </h3>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre del Producto</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Categoría</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border">
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Precio (USD)</label>
                <input required type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 flex justify-between">
                  Descripción
                  <button type="button" onClick={handleAiDescription} disabled={aiLoading} className="text-xs text-indigo-600 flex items-center hover:underline">
                    {aiLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                    Generar con IA
                  </button>
                </label>
                <textarea required rows={3} value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border"></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Imagen</label>
                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              </div>

              <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                {loading ? 'Guardando...' : 'Publicar Producto'}
              </button>
            </form>
          </div>

          {/* Product List */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map(product => (
              <div key={product.id} className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                <img src={product.image_url} alt={product.title} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <h4 className="font-bold text-lg text-gray-900">{product.title}</h4>
                  <p className="text-sm text-gray-500">{product.category}</p>
                  <p className="text-indigo-600 font-bold mt-2">${product.price_usd}</p>
                </div>
              </div>
            ))}
            {products.length === 0 && <p className="text-gray-500 col-span-2 text-center py-10">No has publicado productos aún.</p>}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {orders.map(order => (
              <li key={order.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-bold">Orden #{order.id.slice(0, 8)}</h4>
                    <p className="text-sm text-gray-500">Comprador: {order.buyer_profile?.full_name} ({order.buyer_profile?.email})</p>
                    <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <p className="font-medium text-sm text-gray-700 mb-2">Detalles del Pago:</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="block text-gray-500">Referencia (Últimos 4):</span>
                      <span className="font-mono font-bold">{order.payment_ref_last4}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500">Monto Total:</span>
                      <span className="font-bold">${order.total_amount_usd}</span>
                    </div>
                    <div>
                       <span className="block text-gray-500">Delivery:</span>
                       <span className="font-bold">{order.delivery_needed ? 'Sí' : 'No'}</span>
                    </div>
                  </div>
                  {order.payment_proof_url && (
                    <div className="mt-4">
                      <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center">
                        <Eye className="w-4 h-4 mr-1" /> Ver Capture de Pago
                      </a>
                    </div>
                  )}
                </div>
                <div>
                   <h5 className="font-medium text-sm mb-2">Productos:</h5>
                   <ul className="text-sm text-gray-600 list-disc list-inside">
                     {(order.product_details as any[]).map((p: any, idx: number) => (
                       <li key={idx}>{p.title} - ${p.price_usd}</li>
                     ))}
                   </ul>
                </div>
              </li>
            ))}
            {orders.length === 0 && <div className="p-8 text-center text-gray-500">No tienes pedidos pendientes.</div>}
          </ul>
        </div>
      )}
    </div>
  );
};