import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    menuId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Menu', required: true, index: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name:         { type: String, required: true, trim: true },
    description:  { type: String, trim: true },
    sortOrder:    { type: Number, default: 0 },
    isVisible:    { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.index({ menuId: 1, sortOrder: 1 });

export default mongoose.models.Category ||
  mongoose.model('Category', categorySchema);
