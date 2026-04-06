import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/index.js';
import { logger } from '@handy-go/shared';
// Configure Cloudinary
cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
});
/**
 * Upload image to Cloudinary
 */
export const uploadImage = async (file, folder = 'handy-go') => {
    try {
        let uploadOptions = {
            folder,
            resource_type: 'image',
            transformation: [
                { width: 800, height: 800, crop: 'limit' },
                { quality: 'auto:good' },
            ],
        };
        let result;
        if (typeof file === 'string') {
            // File is a base64 string or URL
            result = await cloudinary.uploader.upload(file, uploadOptions);
        }
        else {
            // File is a Buffer
            result = await new Promise((resolve, reject) => {
                cloudinary.uploader
                    .upload_stream(uploadOptions, (error, result) => {
                    if (error)
                        reject(error);
                    else
                        resolve(result);
                })
                    .end(file);
            });
        }
        return {
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
        };
    }
    catch (error) {
        logger.error('Cloudinary upload error:', error);
        throw new Error('Failed to upload image');
    }
};
/**
 * Upload multiple images
 */
export const uploadImages = async (files, folder = 'handy-go') => {
    const results = await Promise.all(files.map((file) => uploadImage(file, folder)));
    return results;
};
/**
 * Delete image from Cloudinary
 */
export const deleteImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result.result === 'ok';
    }
    catch (error) {
        logger.error('Cloudinary delete error:', error);
        return false;
    }
};
/**
 * Delete multiple images
 */
export const deleteImages = async (publicIds) => {
    try {
        await cloudinary.api.delete_resources(publicIds);
        return true;
    }
    catch (error) {
        logger.error('Cloudinary bulk delete error:', error);
        return false;
    }
};
/**
 * Generate optimized URL for an image
 */
export const getOptimizedUrl = (publicId, options) => {
    const transformations = [];
    if (options?.width || options?.height) {
        transformations.push({
            width: options.width,
            height: options.height,
            crop: 'fill',
        });
    }
    transformations.push({
        quality: options?.quality || 'auto:good',
        fetch_format: 'auto',
    });
    return cloudinary.url(publicId, {
        transformation: transformations,
    });
};
export default {
    uploadImage,
    uploadImages,
    deleteImage,
    deleteImages,
    getOptimizedUrl,
};
//# sourceMappingURL=upload.service.js.map