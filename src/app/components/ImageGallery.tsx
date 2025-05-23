'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { imagesService, ImageData } from '@/services/images.service';
import styles from './ImageGallery.module.css';

interface ImageGalleryProps {
  token: string;
}

export default function ImageGallery({ token }: ImageGalleryProps) {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const data = await imagesService.getImages(token);
        setImages(data);
        setError(null);
      } catch (err) {
        setError('Failed to load images');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [token]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className={styles.gallery}>
      {images.map((image) => (
        <div key={image.id} className={styles.imageContainer}>
          <div className={styles.imageWrapper}>
            <Image
              src={image.processedUrl}
              alt={image.originalName}
              width={300}
              height={300}
              className={styles.image}
              priority
              unoptimized
            />
          </div>
          <div className={styles.imageInfo}>
            <p>Original: {image.originalName}</p>
            <p>Size: {(image.size / 1024).toFixed(2)} KB</p>
            <p>Uploaded: {new Date(image.uploadedAt).toLocaleDateString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}