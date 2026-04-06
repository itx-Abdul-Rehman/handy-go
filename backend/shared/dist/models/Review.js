import mongoose, { Schema } from 'mongoose';
/**
 * Category Ratings Sub-Schema
 */
const categoryRatingsSchema = new Schema({
    punctuality: {
        type: Number,
        min: [1, 'Rating must be between 1 and 5'],
        max: [5, 'Rating must be between 1 and 5'],
    },
    quality: {
        type: Number,
        min: [1, 'Rating must be between 1 and 5'],
        max: [5, 'Rating must be between 1 and 5'],
    },
    professionalism: {
        type: Number,
        min: [1, 'Rating must be between 1 and 5'],
        max: [5, 'Rating must be between 1 and 5'],
    },
    value: {
        type: Number,
        min: [1, 'Rating must be between 1 and 5'],
        max: [5, 'Rating must be between 1 and 5'],
    },
}, { _id: false });
/**
 * Review Schema
 */
const reviewSchema = new Schema({
    booking: {
        type: Schema.Types.ObjectId,
        ref: 'Booking',
        required: [true, 'Booking is required'],
        unique: true,
    },
    customer: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
        required: [true, 'Customer is required'],
    },
    worker: {
        type: Schema.Types.ObjectId,
        ref: 'Worker',
        required: [true, 'Worker is required'],
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be between 1 and 5'],
        max: [5, 'Rating must be between 1 and 5'],
    },
    review: {
        type: String,
        trim: true,
        maxlength: [500, 'Review cannot exceed 500 characters'],
    },
    categories: {
        type: categoryRatingsSchema,
    },
    isVerified: {
        type: Boolean,
        default: true,
    },
    adminModerated: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
        transform: (_doc, ret) => {
            const { __v, ...rest } = ret;
            return rest;
        },
    },
});
// Indexes
reviewSchema.index({ worker: 1, createdAt: -1 });
reviewSchema.index({ customer: 1, createdAt: -1 });
/**
 * Post-save hook to update worker's average rating
 */
reviewSchema.post('save', async function () {
    const Worker = mongoose.model('Worker');
    const workerId = this.worker;
    // Calculate new average rating
    const result = await mongoose.model('Review').aggregate([
        { $match: { worker: workerId, isVerified: true } },
        {
            $group: {
                _id: '$worker',
                avgRating: { $avg: '$rating' },
                count: { $sum: 1 },
            },
        },
    ]);
    if (result.length > 0) {
        await Worker.findByIdAndUpdate(workerId, {
            'rating.average': Math.round(result[0].avgRating * 10) / 10,
            'rating.count': result[0].count,
        });
    }
});
/**
 * Static method to get reviews for a worker with pagination
 */
reviewSchema.statics.getWorkerReviews = function (workerId, options = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;
    return this.find({ worker: workerId, isVerified: true })
        .populate('customer', 'firstName lastName profileImage')
        .populate('booking', 'serviceCategory scheduledDateTime')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
};
/**
 * Static method to get worker's average rating with breakdown
 */
reviewSchema.statics.getWorkerAverageRating = async function (workerId) {
    const reviews = await this.find({ worker: workerId, isVerified: true }).select('rating');
    const count = reviews.length;
    if (count === 0) {
        return {
            average: 0,
            count: 0,
            breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
    }
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const average = Math.round((sum / count) * 10) / 10;
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
        const rating = review.rating;
        if (rating !== undefined && rating >= 1 && rating <= 5) {
            breakdown[rating] = (breakdown[rating] ?? 0) + 1;
        }
    });
    return { average, count, breakdown };
};
/**
 * Review Model
 */
export const Review = mongoose.model('Review', reviewSchema);
export default Review;
//# sourceMappingURL=Review.js.map