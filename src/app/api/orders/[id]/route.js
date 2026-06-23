import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const order = await prisma.order.update({
      where: { id: parseInt(id) },
      data: body,
    });

    // Webhook Trigger: Only if status changed to 'paid', 'confirmed', or 'shipped'
    if ((body.status === 'paid' || body.status === 'confirmed' || body.status === 'shipped') && process.env.EXTERNAL_BACKEND_URL) {
      try {
        await fetch(process.env.EXTERNAL_BACKEND_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-api-key': process.env.PETME_SECRET_TOKEN || ''
          },
          body: JSON.stringify(order)
        });
      } catch (webhookErr) {
        console.error('Failed to send webhook to external backend:', webhookErr);
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.order.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
