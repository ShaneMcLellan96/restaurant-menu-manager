import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Menu from '@/lib/models/Menu';
import { getDefaultRestaurantId } from '@/lib/defaultRestaurant';

export async function GET(request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get('restaurantId');

  const filter = restaurantId ? { restaurantId } : {};
  const menus = await Menu.find(filter).sort({ createdAt: -1 }).lean();
  return NextResponse.json(menus);
}

export async function POST(request) {
  await connectDB();
  const body = await request.json();

  if (!body.restaurantId) {
    body.restaurantId = await getDefaultRestaurantId();
  }

  const menu = await Menu.create(body);
  return NextResponse.json(menu, { status: 201 });
}
