import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev_petme';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await prisma.customer.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true, name: true, phone: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const latestOrder = await prisma.order.findFirst({
      where: { customerId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { 
        houseNo: true, moo: true, soi: true, 
        subDistrict: true, district: true, province: true, 
        postalCode: true, lineId: true 
      }
    });

    if (latestOrder) {
      user.lastAddress = latestOrder;
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
