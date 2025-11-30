import { createClient } from '@supabase/supabase-js';

// --- ATENCION ---
// COLOCA TUS API KEYS DE SUPABASE AQUI ABAJO
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pidhooqfybqsjghcszyx.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpZGhvb3FmeWJxc2pnaGNzenl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyODkxMDEsImV4cCI6MjA3OTg2NTEwMX0.woT4H9iNrRPTPh4uUBxNbCu0qTGkCLIIiTPNlTtQKTE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to upload files to 'images' bucket
export const uploadImage = async (file: File, path: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from('images') // Asegurate de haber corrido el SQL para crear este bucket
      .upload(path, file, { upsert: true });

    if (error) {
      console.error('Upload error details:', error.message || error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(path);

    return publicUrl;
  } catch (err) {
    console.error('Unexpected upload error:', err);
    return null;
  }
};