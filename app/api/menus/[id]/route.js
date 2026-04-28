import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Menu from '@/lib/models/Menu';

export async function GET(request, { params }) {
  const { id } = await params;
  await connectDB();
  const menu = await Menu.findById(id).lean();
  if (!menu) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(menu);
}

export async function PUT(request, { params }) {
  const { id } = await params;
  await connectDB();
  const body = await request.json();
  const menu = await Menu.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  if (!menu) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(menu);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  await connectDB();
  const menu = await Menu.findByIdAndDelete(id);
  if (!menu) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
