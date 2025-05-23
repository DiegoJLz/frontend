import axios from 'axios';

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

interface ImagesResponse {
  status: number;
  message: string;
  data: ImageData[];
}

const API_URL = 'http://localhost:3001';

export const imagesService = {
  async getImages(token: string): Promise<ImageData[]> {
    try {
      const response = await axios.get<ImagesResponse>(`${API_URL}/images`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching images:', error);
      throw error;
    }
  },

  async uploadImage(file: File, token: string, transformations?: any): Promise<ImageData> {
    try {
      const formData = new FormData();
      formData.append('image', file);
      if (transformations) {
        formData.append('transformations', JSON.stringify(transformations));
      }

      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },
};

export type { ImageData };