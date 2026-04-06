import mongoose, { Document, Model } from 'mongoose';
/**
 * Category Ratings Interface
 */
export interface ICategoryRatings {
    punctuality?: number;
    quality?: number;
    professionalism?: number;
    value?: number;
}
/**
 * Review Document Interface
 */
export interface IReview extends Document {
    _id: mongoose.Types.ObjectId;
    booking: mongoose.Types.ObjectId;
    customer: mongoose.Types.ObjectId;
    worker: mongoose.Types.ObjectId;
    rating: number;
    review?: string;
    categories?: ICategoryRatings;
    isVerified: boolean;
    adminModerated: boolean;
    createdAt: Date;
}
/**
 * Review Model Interface
 */
export interface IReviewModel extends Model<IReview> {
    getWorkerReviews(workerId: mongoose.Types.ObjectId | string, options?: {
        page?: number;
        limit?: number;
    }): Promise<IReview[]>;
    getWorkerAverageRating(workerId: mongoose.Types.ObjectId | string): Promise<{
        average: number;
        count: number;
        breakdown: Record<number, number>;
    }>;
}
/**
 * Review Model
 */
export declare const Review: IReviewModel;
export default Review;
//# sourceMappingURL=Review.d.ts.map