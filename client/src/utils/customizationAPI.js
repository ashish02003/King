// import axios from 'axios';

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// // Upload image to Cloudinary first
// export const uploadImage = async (file) => {
//     const formData = new FormData();
//     formData.append('image', file);

//     const response = await axios.post(`${API_URL}/upload`, formData);
//     return response.data.url;
// };

// // Clip uploaded image to shape
// export const clipImageToShape = async (imageUrl, shapeType, width, height) => {
//     const response = await axios.post(`${API_URL}/customization/clip-image`, {
//         imageUrl,
//         shapeType,
//         width: width || 400,
//         height: height || 400
//     });
//     return response.data.data;
// };

// // Process image: upload then clip
// export const processImageForShape = async (file, shapeType, width, height) => {
//     try {
//         // Step 1: Upload original image
//         const originalUrl = await uploadImage(file);

//         // Step 2: Clip to shape
//         const clippedData = await clipImageToShape(originalUrl, shapeType, width, height);

//         return {
//             originalUrl,
//             clippedUrl: clippedData.clippedUrl,
//             publicId: clippedData.publicId
//         };
//     } catch (error) {
//         console.error('Error processing image:', error);
//         throw error;
//     }
// };

// // Add to cart
// export const addToCart = async (userId, cartData, token) => {
//     const response = await axios.post(
//         `${API_URL}/customization/cart`,
//         { userId, ...cartData },
//         { headers: { Authorization: `Bearer ${token}` } }
//     );
//     return response.data;
// };

// // Get cart
// export const getCart = async (userId, token) => {
//     const response = await axios.get(
//         `${API_URL}/customization/cart/${userId}`,
//         { headers: { Authorization: `Bearer ${token}` } }
//     );
//     return response.data.data;
// };

// export default {
//     uploadImage,
//     clipImageToShape,
//     processImageForShape,
//     addToCart,
//     getCart
// };


import axios from 'axios';
import { API_BASE as API_URL } from './api';

// Upload image to Cloudinary with progress tracking
export const uploadImage = async (file, onProgress) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await axios.post(`${API_URL}/upload`, formData, {
        onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(percentCompleted);
            }
        }
    });
    return response.data.url;
};

// Clip image to shape using backend
export const clipImageToShape = async (imageUrl, shapeData) => {
    const response = await axios.post(`${API_URL}/customization/clip-image`, {
        imageUrl,
        shapeData
    });
    return response.data.data;
};

// Complete process: Upload + Clip with progress tracking
export const processImageForShape = async (file, shapeData, onProgress) => {
    try {
        // Step 1: Upload original image to Cloudinary (0-70% progress)
        const uploadProgress = (percent) => {
            if (onProgress) {
                // Upload is 70% of total process
                onProgress(Math.round(percent * 0.7));
            }
        };
        const originalUrl = await uploadImage(file, uploadProgress);

        // Step 2: Send to backend for shape clipping (70-100% progress)
        if (onProgress) onProgress(85);
        const clippedData = await clipImageToShape(originalUrl, shapeData);
        if (onProgress) onProgress(100);

        return {
            originalUrl,
            clippedUrl: clippedData.clippedUrl,
            publicId: clippedData.publicId
        };
    } catch (error) {
        console.error('Error processing image:', error);
        throw error;
    }
};

export default {
    uploadImage,
    clipImageToShape,
    processImageForShape
};


