import mongoose from 'mongoose';

const availableHoursSchema = new mongoose.Schema(
  {
    day:   { type: String, enum: ['mon','tue','wed','thu','fri','sat','sun'] },
    open:  { type: String }, // "09:00"
    close: { type: String }, // "22:00"
  },
  { _id: false }
);

const menuSchema = new mongoose.Schema(
  {
    restaurantId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name:           { type: String, required: true, trim: true },
    isActive:       { type: Boolean, default: true },
    availableHours: [availableHoursSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Menu || mongoose.model('Menu', menuSchema);
