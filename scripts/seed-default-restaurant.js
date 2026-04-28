const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not set');
}

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    timezone: { type: String, default: 'UTC' },
    currency: { type: String, default: 'USD' },
    logoUrl: { type: String },
    contactEmail: { type: String, trim: true, lowercase: true },
  },
  { timestamps: true }
);

const Restaurant = mongoose.models.Restaurant || mongoose.model('Restaurant', restaurantSchema);

async function main() {
  await mongoose.connect(MONGODB_URI, { bufferCommands: false });

  const doc = await Restaurant.findOneAndUpdate(
    { slug: 'default' },
    {
      $setOnInsert: {
        name: 'Default Restaurant',
        slug: 'default',
        timezone: 'UTC',
        currency: 'USD',
      },
    },
    { new: true, upsert: true }
  );

  console.log('Default restaurant id:', doc._id.toString());
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
