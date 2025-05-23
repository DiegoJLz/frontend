'use client';

import { useState } from 'react';
import { imagesService } from '@/services/images.service';
import styles from './ImageUpload.module.css';

interface ImageUploadProps {
  token: string;
  onUploadSuccess: () => void;
}

interface Transformations {
  resize: { width: number; height: number };
  rotate: number;
  flip: boolean;
  flop: boolean;
  grayscale: boolean;
}

export default function ImageUpload({ token, onUploadSuccess }: ImageUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transformations, setTransformations] = useState<Transformations>({
    resize: { width: 800, height: 600 },
    rotate: 0,
    flip: false,
    flop: false,
    grayscale: false,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleTransformationChange = (
    key: keyof Transformations,
    value: any,
    nestedKey?: string
  ) => {
    setTransformations((prev) => ({
      ...prev,
      [key]: nestedKey && typeof prev[key] === 'object'
        ? { ...prev[key] as object, [nestedKey]: value }
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    try {
      await imagesService.uploadImage(file, token, transformations);
      setFile(null);
      onUploadSuccess();
      setError(null);
      // Reset the file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError('Failed to upload image');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.uploadForm}>
      <div className={styles.fileInput}>
        <input
          type="file"
          onChange={handleFileChange}
          accept="image/*"
          disabled={loading}
        />
      </div>

      <div className={styles.transformations}>
        <h3>Image Transformations</h3>

        <div className={styles.transformationGroup}>
          <label>
            Width:
            <input
              type="number"
              value={transformations.resize.width}
              onChange={(e) =>
                handleTransformationChange('resize', parseInt(e.target.value), 'width')
              }
              min="1"
              max="2000"
            />
          </label>

          <label>
            Height:
            <input
              type="number"
              value={transformations.resize.height}
              onChange={(e) =>
                handleTransformationChange('resize', parseInt(e.target.value), 'height')
              }
              min="1"
              max="2000"
            />
          </label>
        </div>

        <div className={styles.transformationGroup}>
          <label>
            Rotation:
            <input
              type="number"
              value={transformations.rotate}
              onChange={(e) =>
                handleTransformationChange('rotate', parseInt(e.target.value))
              }
              step="90"
              min="0"
              max="360"
            />
          </label>
        </div>

        <div className={styles.transformationGroup}>
          <label>
            <input
              type="checkbox"
              checked={transformations.flip}
              onChange={(e) => handleTransformationChange('flip', e.target.checked)}
            />
            Flip Vertical
          </label>

          <label>
            <input
              type="checkbox"
              checked={transformations.flop}
              onChange={(e) => handleTransformationChange('flop', e.target.checked)}
            />
            Flip Horizontal
          </label>

          <label>
            <input
              type="checkbox"
              checked={transformations.grayscale}
              onChange={(e) =>
                handleTransformationChange('grayscale', e.target.checked)
              }
            />
            Grayscale
          </label>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <button
        type="submit"
        disabled={loading || !file}
        className={styles.uploadButton}
      >
        {loading ? 'Uploading...' : 'Upload Image'}
      </button>
    </form>
  );
}