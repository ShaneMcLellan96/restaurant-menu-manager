import Restaurant from '@/lib/models/Restaurant';
import { connectDB } from '@/lib/db';

let cached = global._defaultRestaurant;
if (!cached) {
  cached = global._defaultRestaurant = { id: null, promise: null };
}

export async function getDefaultRestaurantId() {
  if (process.env.DEFAULT_RESTAURANT_ID) return process.env.DEFAULT_RESTAURANT_ID;
  if (cached.id) return cached.id;

  await connectDB();

  if (!cached.promise) {
    cached.promise = (async () => {
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
      ).lean();

      cached.id = doc._id.toString();
      return cached.id;
    })().finally(() => {
      cached.promise = null;
    });
  }

  return cached.promise;
}
