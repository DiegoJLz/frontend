'use client';

import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';
import { Switch } from '@headlessui/react';
import { Dialog, Transition } from '@headlessui/react';

interface ImageData {
  id: number;
  originalUrl: string;
  processedUrl: string;
  originalName: string;
  mimetype: string;
  size: number;
  transformations: string;
  uploadedAt: string;
  processedAt: string;
}

interface ImageDetail {
  original: string;
  processed: string;
}

interface TransformationOptions {
  resize: {
    width: number;
    height: number;
  };
  rotate: number;
  flip: boolean;
  flop: boolean;
  grayscale: boolean;
}

export default function GalleryPage() {
  const router = useRouter();
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showTransformations, setShowTransformations] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageDetail | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [transformations, setTransformations] = useState<TransformationOptions>({
    resize: {
      width: 800,
      height: 600
    },
    rotate: 0,
    flip: false,
    flop: false,
    grayscale: false
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  useEffect(() => {
    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
      setShowTransformations(true);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [selectedFile]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/auth/login');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido');
      return;
    }
    setSelectedFile(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      handleFileSelect(event.target.files[0]);
    }
  };

  const handleTransformationChange = (key: string, value: any) => {
    if (key === 'width' || key === 'height') {
      setTransformations(prev => ({
        ...prev,
        resize: {
          ...prev.resize,
          [key]: parseInt(value) || 0
        }
      }));
    } else {
      setTransformations(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };

  const fetchImages = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No se encontró token de autenticación');
        return;
      }

      const response = await fetch('http://localhost:3001/images', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar las imágenes');
      }

      const result = await response.json();
      setImages(result.data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast.error('Error al cargar las imágenes');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) {
      toast.error('Por favor selecciona una imagen');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('transformations', JSON.stringify({
      resize: {
        width: Number(transformations.resize.width),
        height: Number(transformations.resize.height)
      },
      rotate: Number(transformations.rotate),
      flip: Boolean(transformations.flip),
      flop: Boolean(transformations.flop),
      grayscale: Boolean(transformations.grayscale)
    }));

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No se encontró token de autenticación');

      const response = await fetch('http://localhost:3001/images/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al subir la imagen');
      }

      toast.success('Imagen subida exitosamente');
      setSelectedFile(null);
      setPreview(null);
      setShowTransformations(false);
      setTransformations({
        resize: { width: 800, height: 600 },
        rotate: 0,
        flip: false,
        flop: false,
        grayscale: false
      });
      if (event.target instanceof HTMLFormElement) {
        event.target.reset();
      }
      await fetchImages();
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (imageId: number) => {
    setImageToDelete(imageId);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!imageToDelete) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No se encontró token de autenticación');

      const response = await fetch(`http://localhost:3001/images/${imageToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Error al eliminar la imagen');

      toast.success('Imagen eliminada exitosamente');
      setImages(images.filter(img => img.id !== imageToDelete));
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Error al eliminar la imagen');
    } finally {
      setIsDeleteModalOpen(false);
      setImageToDelete(null);
    }
  };

  const handleViewImage = async (imageId: number) => {
    setLoadingImage(true);
    try {
      const selectedImg = images.find(img => img.id === imageId);
      if (!selectedImg) {
        throw new Error('Imagen no encontrada');
      }

      console.log('Selected image data:', {
        id: selectedImg.id,
        originalUrl: selectedImg.originalUrl,
        processedUrl: selectedImg.processedUrl
      });

      const originalUrl = selectedImg.originalUrl.startsWith('http')
        ? selectedImg.originalUrl
        : `http://localhost:3001${selectedImg.originalUrl}`;

      const processedUrl = selectedImg.processedUrl.startsWith('http')
        ? selectedImg.processedUrl
        : `http://localhost:3001${selectedImg.processedUrl}`;

      setSelectedImage({
        original: originalUrl,
        processed: processedUrl
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error loading images:', error);
      toast.error('Error al cargar las imágenes');
    } finally {
      setLoadingImage(false);
    }
  };

  const getRelativePath = (fullPath: string) => {
    // Extraer la parte de la ruta después de 'uploads'
    const parts = fullPath.split('uploads');
    return parts.length > 1 ? `/uploads${parts[1].replace(/\\/g, '/')}` : '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando galería...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header mejorado */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-semibold text-gray-800">
                Galería de Imágenes
              </h1>
            </div>
            <div className="flex items-center space-x-6">
              <Link
                href="/profile"
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Mi Perfil
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center text-red-500 hover:text-red-700"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
          <form onSubmit={handleUpload} className="space-y-6">
            {/* Área de vista previa y subida */}
            <div className="flex space-x-6">
              {/* Panel izquierdo: Vista previa */}
              <div className="w-1/3">
                <div
                  className={`relative border-2 border-dashed rounded-lg h-48 transition-colors duration-200 ease-in-out ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    id="file-upload"
                  />

                  {!preview ? (
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center h-full cursor-pointer p-4"
                    >
                      <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-600 text-center">
                        <span className="font-medium text-blue-600">Click para subir</span> o arrastra y suelta
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF hasta 10MB</p>
                    </label>
                  ) : (
                    <div className="relative h-full">
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-full object-contain rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreview(null);
                          setShowTransformations(false);
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Panel derecho: Opciones de transformación */}
              <div className="w-2/3">
                <div className="space-y-4">
                  {/* Dimensiones */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Dimensiones</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Ancho</label>
                        <input
                          type="number"
                          value={transformations.resize.width}
                          onChange={(e) => handleTransformationChange('width', e.target.value)}
                          className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          min="1"
                          placeholder="800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Alto</label>
                        <input
                          type="number"
                          value={transformations.resize.height}
                          onChange={(e) => handleTransformationChange('height', e.target.value)}
                          className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          min="1"
                          placeholder="600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rotación */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium text-gray-700">Rotación</h3>
                      <span className="text-xs text-gray-500">{transformations.rotate}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="90"
                      value={transformations.rotate}
                      onChange={(e) => handleTransformationChange('rotate', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Switches */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="flex items-center space-x-2">
                        <Switch
                          checked={transformations.flip}
                          onChange={(checked) => handleTransformationChange('flip', checked)}
                          className={`${
                            transformations.flip ? 'bg-blue-600' : 'bg-gray-200'
                          } relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                        >
                          <span
                            className={`${
                              transformations.flip ? 'translate-x-5' : 'translate-x-1'
                            } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                        <span className="text-sm text-gray-700">Voltear H</span>
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center space-x-2">
                        <Switch
                          checked={transformations.flop}
                          onChange={(checked) => handleTransformationChange('flop', checked)}
                          className={`${
                            transformations.flop ? 'bg-blue-600' : 'bg-gray-200'
                          } relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                        >
                          <span
                            className={`${
                              transformations.flop ? 'translate-x-5' : 'translate-x-1'
                            } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                        <span className="text-sm text-gray-700">Voltear V</span>
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center space-x-2">
                        <Switch
                          checked={transformations.grayscale}
                          onChange={(checked) => handleTransformationChange('grayscale', checked)}
                          className={`${
                            transformations.grayscale ? 'bg-blue-600' : 'bg-gray-200'
                          } relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                        >
                          <span
                            className={`${
                              transformations.grayscale ? 'translate-x-5' : 'translate-x-1'
                            } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                        <span className="text-sm text-gray-700">Grises</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botón de subida */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${uploading || !selectedFile
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Subiendo...
                  </>
                ) : 'Subir Imagen'}
              </button>
            </div>
          </form>
        </div>

        {/* Galería de imágenes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image) => (
            <div key={image.id} className="bg-white shadow-sm rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="relative aspect-video bg-gray-100">
                <div className="w-full h-full">
                  {image.processedUrl ? (
                    <>
                      <img
                        src={image.processedUrl}
                        alt={image.originalName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Error loading processed image');
                          // Si falla la imagen procesada, intentar con la original
                          e.currentTarget.src = image.originalUrl;
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-300">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewImage(image.id)}
                            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transform hover:scale-110 transition-all duration-300"
                            title="Ver imagen"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(image.id)}
                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transform hover:scale-110 transition-all duration-300"
                            title="Eliminar imagen"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 truncate">
                    {image.originalName || 'Sin nombre'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewImage(image.id)}
                      className="p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
                      title="Ver imagen"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(image.id)}
                      className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                      title="Eliminar imagen"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Subido:</span>{' '}
                    {image.uploadedAt ? new Date(image.uploadedAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Fecha no disponible'}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Procesado:</span>{' '}
                    {image.processedAt ? new Date(image.processedAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Fecha no disponible'}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {images.length === 0 && (
            <div className="col-span-full">
              <div className="text-center py-12 bg-white shadow-sm rounded-lg">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No hay imágenes</h3>
                <p className="mt-2 text-gray-500">Comienza subiendo tu primera imagen</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal para ver imágenes */}
        <Transition appear show={isModalOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 backdrop-blur-md bg-white/5" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                    <div className="flex justify-between items-center mb-4">
                      <Dialog.Title className="text-lg font-semibold text-gray-900">
                        Comparación de Imágenes
                      </Dialog.Title>
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="text-gray-400 hover:text-gray-500 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {selectedImage && (
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Imagen Original</h4>
                          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                            {loadingImage ? (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                              </div>
                            ) : (
                              <>
                                <img
                                  src={selectedImage.original}
                                  alt="Imagen original"
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    console.error('Error loading original image:', selectedImage.original);
                                    const img = e.currentTarget;
                                    img.onerror = null;
                                    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IiNmZWU2ZTYiIHJ4PSI0Ii8+PHBhdGggZD0iTTEyIDZhMSAxIDAgMDExIDF2NGExIDEgMCAwMS0yIDBWN2ExIDEgMCAwMTEtMXpNMTIgMTZhMSAxIDAgMTAwLTIgMSAxIDAgMDAwIDJ6IiBmaWxsPSIjZmM4MTgxIi8+PHBhdGggZD0iTTEyIDIyYzUuNTIzIDAgMTAtNC40NzcgMTAtMTBTMTcuNTIzIDIgMTIgMiAyIDYuNDc3IDIgMTJzNC40NzcgMTAgMTAgMTB6IiBzdHJva2U9IiNmYzgxODEiIHN0cm9rZVdpZHRoPSIyIiBzdHJva2VMaW5lY2FwPSJyb3VuZCIgc3Ryb2tlTGluZWpvaW49InJvdW5kIi8+PC9zdmc+';
                                    const errorDiv = document.createElement('div');
                                    errorDiv.className = 'absolute bottom-0 left-0 right-0 bg-red-500 text-white text-xs p-2 text-center';
                                    errorDiv.textContent = 'Error al cargar la imagen original';
                                    img.parentElement?.appendChild(errorDiv);
                                  }}
                                  onLoad={() => console.log('Original image loaded successfully')}
                                />
                                {process.env.NODE_ENV === 'development' && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1">
                                    URL: {selectedImage.original}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Imagen Procesada</h4>
                          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                            {loadingImage ? (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                              </div>
                            ) : (
                              <>
                                <img
                                  src={selectedImage.processed}
                                  alt="Imagen procesada"
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    console.error('Error loading processed image:', selectedImage.processed);
                                    const img = e.currentTarget;
                                    img.onerror = null;
                                    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IiNmZWU2ZTYiIHJ4PSI0Ii8+PHBhdGggZD0iTTEyIDZhMSAxIDAgMDExIDF2NGExIDEgMCAwMS0yIDBWN2ExIDEgMCAwMTEtMXpNMTIgMTZhMSAxIDAgMTAwLTIgMSAxIDAgMDAwIDJ6IiBmaWxsPSIjZmM4MTgxIi8+PHBhdGggZD0iTTEyIDIyYzUuNTIzIDAgMTAtNC40NzcgMTAtMTBTMTcuNTIzIDIgMTIgMiAyIDYuNDc3IDIgMTJzNC40NzcgMTAgMTAgMTB6IiBzdHJva2U9IiNmYzgxODEiIHN0cm9rZVdpZHRoPSIyIiBzdHJva2VMaW5lY2FwPSJyb3VuZCIgc3Ryb2tlTGluZWpvaW49InJvdW5kIi8+PC9zdmc+';
                                    const errorDiv = document.createElement('div');
                                    errorDiv.className = 'absolute bottom-0 left-0 right-0 bg-red-500 text-white text-xs p-2 text-center';
                                    errorDiv.textContent = 'Error al cargar la imagen procesada';
                                    img.parentElement?.appendChild(errorDiv);
                                  }}
                                  onLoad={() => console.log('Processed image loaded successfully')}
                                />
                                {process.env.NODE_ENV === 'development' && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1">
                                    URL: {selectedImage.processed}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Modal de confirmación de eliminación */}
        <Transition appear show={isDeleteModalOpen} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-50"
            onClose={() => setIsDeleteModalOpen(false)}
            static
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 backdrop-blur-md bg-white/5" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <div className="flex items-center justify-center mb-4">
                      <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                        <svg
                          className="h-6 w-6 text-red-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                          />
                        </svg>
                      </div>
                    </div>

                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold text-gray-900 text-center mb-2"
                    >
                      Eliminar Imagen
                    </Dialog.Title>

                    <div className="mt-2">
                      <p className="text-sm text-gray-500 text-center">
                        ¿Estás seguro de que deseas eliminar esta imagen?
                        <br />
                        <span className="font-medium">Esta acción no se puede deshacer.</span>
                      </p>
                    </div>

                    <div className="mt-6 flex justify-center space-x-3">
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-lg px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 transition-colors"
                        onClick={() => setIsDeleteModalOpen(false)}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-lg px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 transition-colors"
                        onClick={handleDeleteConfirm}
                      >
                        Eliminar
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
    </div>
  );
}