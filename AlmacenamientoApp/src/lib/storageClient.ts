import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan las variables de entorno EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const BUCKET_NAME = 'archivos-app';

/**
 * Sube un archivo (imagen o documento) al bucket de Supabase Storage.
 * @param uri URI local del archivo (de expo-image-picker o expo-document-picker)
 * @param mimeType Tipo MIME del archivo
 * @param originalName Nombre original del archivo (para conservar extensión)
 */
export async function uploadFile(
  uri: string,
  mimeType: string,
  originalName?: string
): Promise<string> {
  // Generar nombre único usando timestamp + nombre original
  const extension = originalName?.split('.').pop() || mimeType.split('/').pop() || 'dat';
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;

  // Convertir el archivo local a un blob que el SDK pueda subir
  const response = await fetch(uri);
  const blob = await response.blob();

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, blob, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Error al subir archivo: ${error.message}`);
  }

  // Obtener URL pública del archivo subido
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}