// app/index.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { uploadFile } from '../lib/storageClient';

export default function HomeScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');

  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string>('application/octet-stream');

  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null);

  // --- Selección de imagen ---
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para continuar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setImageMimeType(asset.mimeType || 'image/jpeg');
      setStatusMessage(null);
    }
  };

  // --- Selección de archivo arbitrario ---
  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setFileUri(asset.uri);
      setFileName(asset.name);
      setFileMimeType(asset.mimeType || 'application/octet-stream');
      setStatusMessage(null);
    }
  };

  // --- Subida al servicio ---
  const handleUpload = async () => {
    if (!imageUri && !fileUri) {
      Alert.alert('Nada que subir', 'Selecciona al menos una imagen o un archivo.');
      return;
    }

    setUploading(true);
    setStatusMessage(null);
    setStatusType(null);

    try {
      const urls: string[] = [];

      if (imageUri) {
        const url = await uploadFile(imageUri, imageMimeType, 'imagen.jpg');
        urls.push(`Imagen: ${url}`);
      }

      if (fileUri) {
        const url = await uploadFile(fileUri, fileMimeType, fileName || undefined);
        urls.push(`Archivo: ${url}`);
      }

      setStatusType('success');
      setStatusMessage(`¡Subida exitosa!\n${urls.join('\n')}`);
    } catch (error: any) {
      setStatusType('error');
      setStatusMessage(`Error al subir: ${error.message || 'Error desconocido'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Almacenamiento en la Nube</Text>

      {/* Selección de imagen */}
      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>Seleccionar imagen</Text>
      </TouchableOpacity>

      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.preview} />
      )}

      {/* Selección de archivo */}
      <TouchableOpacity style={styles.button} onPress={pickDocument}>
        <Text style={styles.buttonText}>Seleccionar archivo</Text>
      </TouchableOpacity>

      {fileName && <Text style={styles.fileName}>📄 {fileName}</Text>}

      {/* Botón de subida */}
      <TouchableOpacity
        style={[styles.button, styles.uploadButton]}
        onPress={handleUpload}
        disabled={uploading}
      >
        <Text style={styles.buttonText}>Subir al servicio</Text>
      </TouchableOpacity>

      {uploading && <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />}

      {statusMessage && (
        <Text
          style={[
            styles.statusText,
            statusType === 'success' ? styles.successText : styles.errorText,
          ]}
        >
          {statusMessage}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
    color: '#0f172a',
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginVertical: 8,
    width: '100%',
    alignItems: 'center',
  },
  uploadButton: {
    backgroundColor: '#16a34a',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  preview: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginVertical: 12,
  },
  fileName: {
    fontSize: 14,
    color: '#334155',
    marginVertical: 8,
  },
  statusText: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  successText: {
    color: '#16a34a',
  },
  errorText: {
    color: '#dc2626',
  },
});