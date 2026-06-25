import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { pushMessage } from '@/lib/line';

export async function POST(request, { params }) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.lineUid) {
      return NextResponse.json({ error: 'Order not linked to LINE' }, { status: 400 });
    }

    const { sendAddressConfirmationRequest } = require('@/lib/line');
    await sendAddressConfirmationRequest(order);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Request confirmation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
