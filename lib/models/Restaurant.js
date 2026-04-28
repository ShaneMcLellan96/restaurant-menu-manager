import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true },
    slug:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    timezone:     { type: String, default: 'UTC' },
    currency:     { type: String, default: 'USD' },
    logoUrl:      { type: String },
    contactEmail: { type: String, trim: true, lowercase: true },
  },
  { timestamps: true }
);

export default mongoose.models.Restaurant ||
  mongoose.model('Restaurant', restaurantSchema);
