import React, { useState } from 'react';
import { supabase, uploadImage } from '../services/supabaseClient';
import { UserRole } from '../types';
import { Store, User, Lock, Mail, Image as ImageIcon } from 'lucide-react';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>('buyer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        // Register
        const { data: authData, error: authError } = await supabase.auth.signUp({ 
          email, 
          password 
        });

        if (authError) throw authError;

        if (authData.user) {
          let logoUrl = '';
          
          // Solo intentamos subir la imagen si tenemos una sesión activa (email confirmado o auto-confirm)
          if (authData.session && role === 'seller' && logoFile) {
            const uploaded = await uploadImage(logoFile, `logos/${authData.user.id}_${Date.now()}`);
            if (uploaded) {
              logoUrl = uploaded;
            } else {
              console.warn("No se pudo subir el logo durante el registro (verifique políticas de Storage)");
            }
          }

          const { error: profileError } = await supabase.from('profiles').insert({
            id: authData.user.id,
            email,
            role,
            full_name: fullName,
            company_name: role === 'seller' ? companyName : null,
            logo_url: logoUrl
          });

          if (profileError) {
             // Si el perfil ya existe (ej. doble clic), ignoramos
             if (profileError.code !== '23505') throw profileError;
          }

          setMessage({ type: 'success', text: 'Registro exitoso! Por favor verifica tu correo si es necesario o inicia sesión.' });
        }
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Ocurrió un error inesperado.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setMessage({ type: 'error', text: 'Ingresa tu correo primero.' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) setMessage({ type: 'error', text: error.message });
    else setMessage({ type: 'success', text: 'Correo de recuperación enviado.' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
            {role === 'seller' ? <Store className="h-6 w-6 text-indigo-600" /> : <User className="h-6 w-6 text-indigo-600" />}
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isLogin ? '¿Nuevo aquí? ' : '¿Ya tienes cuenta? '}
            <button onClick={() => setIsLogin(!isLogin)} className="font-medium text-indigo-600 hover:text-indigo-500">
              {isLogin ? 'Regístrate' : 'Ingresa'}
            </button>
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-md ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message.text}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          {!isLogin && (
            <div className="flex justify-center space-x-4 mb-4">
              <button
                type="button"
                onClick={() => setRole('buyer')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${role === 'buyer' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Soy Comprador
              </button>
              <button
                type="button"
                onClick={() => setRole('seller')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${role === 'seller' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Soy Vendedor
              </button>
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
             {!isLogin && (
              <div className="mb-4">
                <label className="sr-only">Nombre Completo</label>
                <input
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Nombre Completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}
            
            {!isLogin && role === 'seller' && (
              <>
                <div className="mb-4">
                  <label className="sr-only">Nombre de la Empresa</label>
                  <input
                    type="text"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Nombre de la Empresa / Emprendimiento"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo de la Empresa</label>
                  <div className="flex items-center space-x-2">
                    <label className="cursor-pointer flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                      <ImageIcon className="h-5 w-5 mr-2 text-gray-400" />
                      <span>Subir Imagen</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                    </label>
                    {logoFile && <span className="text-xs text-green-600">{logoFile.name}</span>}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="sr-only">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Correo Electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="sr-only">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            {isLogin && (
              <div className="text-sm">
                <button type="button" onClick={handlePasswordReset} className="font-medium text-indigo-600 hover:text-indigo-500">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Procesando...' : (isLogin ? 'Ingresar' : 'Registrarse')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};