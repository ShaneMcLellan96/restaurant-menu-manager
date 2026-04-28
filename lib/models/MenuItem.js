import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
  {
    restaurantId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    menuId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Menu', required: true, index: true },
    categoryId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    name:          { type: String, required: true, trim: true },
    description:   { type: String, trim: true },
    price:         { type: Number, required: true, min: 0 },
    allergens:     [{ type: String, trim: true }],
    dietaryTags:   [{ type: String, trim: true }], // vegan, gluten-free, etc.
    ingredients:   [{ type: String, trim: true }],
    isAvailable:   { type: Boolean, default: true },
    isFeatured:    { type: Boolean, default: false },
    calories:      { type: Number, min: 0 },
  },
  { timestamps: true }
);

menuItemSchema.index({ menuId: 1, categoryId: 1 });
menuItemSchema.index({ restaurantId: 1, isAvailable: 1 });

export default mongoose.models.MenuItem ||
  mongoose.model('MenuItem', menuItemSchema);
