import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      customerName, phone, houseNo, moo, soi, subDistrict, district, province, postalCode, 
      lineId, productName, color, size, quantity, note 
    } = body;
    
    // Required fields check
    if (!customerName || !phone || !houseNo || !subDistrict || !district || !province || !postalCode || !productName || !color || !size) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const qty = quantity || 1;
    const totalPrice = qty * 390;
    
    const order = await prisma.order.create({
      data: { 
        customerName, phone, houseNo, moo: moo || null, soi: soi || null, subDistrict, district, province, postalCode, 
        lineId: lineId || null, productName, color, size, quantity: qty, totalPrice, note: note || null 
      }
    });
    
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
