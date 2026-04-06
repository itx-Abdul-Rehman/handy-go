export interface UploadResult {
    url: string;
    publicId: string;
    width?: number;
    height?: number;
    format?: string;
}
/**
 * Upload image to Cloudinary
 */
export declare const uploadImage: (file: string | Buffer, folder?: string) => Promise<UploadResult>;
/**
 * Upload multiple images
 */
export declare const uploadImages: (files: (string | Buffer)[], folder?: string) => Promise<UploadResult[]>;
/**
 * Delete image from Cloudinary
 */
export declare const deleteImage: (publicId: string) => Promise<boolean>;
/**
 * Delete multiple images
 */
export declare const deleteImages: (publicIds: string[]) => Promise<boolean>;
/**
 * Generate optimized URL for an image
 */
export declare const getOptimizedUrl: (publicId: string, options?: {
    width?: number;
    height?: number;
    quality?: string;
}) => string;
declare const _default: {
    uploadImage: (file: string | Buffer, folder?: string) => Promise<UploadResult>;
    uploadImages: (files: (string | Buffer)[], folder?: string) => Promise<UploadResult[]>;
    deleteImage: (publicId: string) => Promise<boolean>;
    deleteImages: (publicIds: string[]) => Promise<boolean>;
    getOptimizedUrl: (publicId: string, options?: {
        width?: number;
        height?: number;
        quality?: string;
    }) => string;
};
export default _default;
//# sourceMappingURL=upload.service.d.ts.map