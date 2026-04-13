import { model, Model, Schema } from 'mongoose';
import { ISellerGig } from '@kariru-k/gigconnect-shared';

const gigSchema: Schema<ISellerGig> = new Schema(
    {
        sellerId: { type: Schema.Types.ObjectId, index: true },
        username: { type: String, required: true },
        profilePicture: { type: String, required: true },
        email: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        basicTitle: { type: String, required: true },
        basicDescription: { type: String, required: true },
        categories: { type: String, required: true },
        subCategories: [{ type: String, required: true }],
        tags: [{ type: String }],
        active: { type: Boolean, default: true },
        expectedDelivery: { type: String, default: '' },
        ratingsCount: { type: Number, default: 0 },
        ratingSum: { type: Number, default: 0 },
        ratingCategories: {
            five: { value: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
            four: { value: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
            three: { value: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
            two: { value: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
            one: { value: { type: Number, default: 0 }, count: { type: Number, default: 0 } }
        },
        price: { type: Number, default: 0 },
        sortId: { type: Number },
        coverImage: { type: String, required: true },
        createdAt: { type: Date, default: Date.now() }
    },
    {
        versionKey: false,
        toJSON: {
            transform(_doc, ret: Partial<ISellerGig>) {
                ret.id = ret._id;
                delete ret._id; // 👈 TS is fine with this
                return ret;
            }
        }
    }
);

gigSchema.virtual('id').get(function () {
    return this._id;
});

export const gigModel: Model<ISellerGig> = model<ISellerGig>('Gig', gigSchema, 'Gig');
