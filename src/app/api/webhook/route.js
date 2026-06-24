import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { replyMessage, getImageContent, pushMessage, verifySignature } from '@/lib/line';

// LINE Webhook Endpoint
// POST: รับ events จาก LINE (ข้อความ, รูปภาพ, follow)
export async function POST(request) {
  try {
    const bodyText = await request.text();
    const signature = request.headers.get('x-line-signature');

    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const events = body.events || [];

    // สำหรับตอนกดปุ่ม Verify ในหน้าเว็บ LINE Developers (จะส่ง events ว่างๆ มา)
    if (events.length === 0) {
      return NextResponse.json({ status: 'ok', message: 'Webhook verified' });
    }

    // ตรวจสอบ Signature (ป้องกันการปลอมแปลง) เฉพาะตอนที่มี event จริงๆ
    if (signature && !verifySignature(bodyText, signature)) {
      console.error('Invalid LINE signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    for (const event of events) {
      const userId = event.source?.userId;
      const replyToken = event.replyToken;

      // จัดการ Cooldown 3 ชั่วโมงสำหรับข้อความบอทอัตโนมัติทั่วไป
      let lineUser = await prisma.lineUser.findUnique({ where: { uid: userId } });
      const now = new Date();
      let canSendGeneralReply = true;

      if (lineUser) {
        const diffHours = (now.getTime() - lineUser.lastActive.getTime()) / (1000 * 60 * 60);
        if (diffHours < 3) {
          canSendGeneralReply = false; // ยังไม่ถึง 3 ชั่วโมงนับจากที่ลูกค้าพิมพ์มาครั้งล่าสุด
        }
      }

      // อัปเดตเวลาใช้งานล่าสุด (Reset Timer)
      await prisma.lineUser.upsert({
        where: { uid: userId },
        update: { lastActive: now },
        create: { uid: userId, lastActive: now },
      });

      // === Event: ลูกค้าแอดไลน์ (Follow) ===
      if (event.type === 'follow') {
        if (canSendGeneralReply) {
          await replyMessage(replyToken, [{
            type: 'text',
            text: 'ได้สั่งซื้อสินค้าผ่านเว็บไซต์ของเราหรือยังคะ? 🛒\n\n- หากยังไม่ได้สั่งซื้อ สามารถเลือกชมและสั่งซื้อได้ที่: https://petme-pre-oder.vercel.app\n- หากมีข้อสงสัยหรือต้องการสอบถามเพิ่มเติม สามารถพิมพ์ถามไว้ได้เลยค่ะ แอดมินจะรีบมาตอบนะคะ 😊\n\n⚠️ แต่หากคุณลูกค้าสั่งซื้อเรียบร้อยแล้ว:\nรบกวนพิมพ์ "รหัสลับ" ที่ได้จากหน้าเว็บ (เช่น PETME-ABCDEF) ส่งมาในแชทนี้ เพื่อเชื่อมต่อออเดอร์ค่ะ'
          }]);
        }
        continue;
      }

      // === Event: ข้อความ (Message) ===
      if (event.type === 'message') {
        const msg = event.message;

        // --- ข้อความตัวอักษร (Text) ---
        if (msg.type === 'text') {
          const text = msg.text.trim().toUpperCase();

          // ตรวจสอบว่าเป็น Secure Token หรือไม่ (รูปแบบ: PETME-XXXXXX)
          if (text.startsWith('PETME-') && text.length >= 10) {
            const token = text;
            
            // ค้นหาออเดอร์จาก Token
            const order = await prisma.order.findFirst({
              where: { secureToken: token }
            });

            if (order) {
              // ผูก LINE UID กับออเดอร์
              await prisma.order.update({
                where: { id: order.id },
                data: { lineUid: userId }
              });

              await replyMessage(replyToken, [
                {
                  type: 'text',
                  text: `✅ เชื่อมต่อสำเร็จ!\n\n📦 ออเดอร์ #${order.id}\n👤 ${order.customerName}\n👕 ${order.productName} (${order.size} / ${order.color})\n💰 ยอดรวม ${order.totalPrice} บาท\n\nระบบจะแจ้งเตือนสถานะสินค้าอัตโนมัติผ่านแชทนี้ค่ะ`
                },
                {
                  type: 'text',
                  text: `💳 รบกวนชำระเงินโดยสแกน QR Code ด้านล่างนี้ค่ะ\n(ยอดโอน ${order.totalPrice} บาท)\n\nเมื่อโอนเงินเรียบร้อยแล้ว สามารถส่งรูปสลิปเข้ามาในแชทนี้ได้เลยนะคะ ระบบจะตรวจสอบให้อัตโนมัติค่ะ`
                },
                {
                  type: 'image',
                  originalContentUrl: 'https://petme-pre-oder.vercel.app/images/QRCODE.jpg',
                  previewImageUrl: 'https://petme-pre-oder.vercel.app/images/QRCODE.jpg'
                }
              ]);
            } else {
              await replyMessage(replyToken, [{
                type: 'text',
                text: '❌ ไม่พบออเดอร์ที่ตรงกับรหัสนี้ค่ะ\n\nกรุณาตรวจสอบรหัสอีกครั้ง หรือกดปุ่ม "รับแจ้งเตือนผ่าน LINE" จากหน้าเว็บไซต์ค่ะ'
              }]);
            }
            continue;
          }

          // ข้อความทั่วไป (ถ้าแชทกันอยู่ จะไม่ส่งข้อความซ้ำ จนกว่าจะเงียบไป 3 ชม.)
          if (canSendGeneralReply) {
            await replyMessage(replyToken, [{
              type: 'text',
              text: 'ได้สั่งซื้อสินค้าผ่านเว็บไซต์ของเราหรือยังคะ? 🛒\n\n- หากยังไม่ได้สั่งซื้อ สามารถเลือกชมและสั่งซื้อได้ที่: https://petme-pre-oder.vercel.app\n- หากมีข้อสงสัยหรือต้องการสอบถามเพิ่มเติม สามารถพิมพ์ถามไว้ได้เลยค่ะ แอดมินจะรีบมาตอบนะคะ 😊\n\n⚠️ แต่หากคุณลูกค้าสั่งซื้อเรียบร้อยแล้ว:\nรบกวนพิมพ์ "รหัสลับ" ที่ได้จากหน้าเว็บ (เช่น PETME-ABCDEF) ส่งมาในแชทนี้ เพื่อเชื่อมต่อออเดอร์ค่ะ'
            }]);
          }
          continue;
        }

        // --- รูปภาพ (Image) - ระบบตรวจสลิป ---
        if (msg.type === 'image') {
          // ค้นหาออเดอร์ล่าสุดที่ผูกกับ LINE UID นี้ และยังไม่ได้ยืนยัน
          const order = await prisma.order.findFirst({
            where: { lineUid: userId, status: 'pending' },
            orderBy: { createdAt: 'desc' }
          });

          if (!order) {
            await replyMessage(replyToken, [{
              type: 'text',
              text: '❌ ไม่พบออเดอร์ที่รอชำระเงินค่ะ\n\nกรุณาเชื่อมต่อออเดอร์ก่อนโดยกดปุ่ม "รับแจ้งเตือนผ่าน LINE" จากหน้าเว็บไซต์ค่ะ'
            }]);
            continue;
          }

          // ตรวจสอบว่ามี EasySlip API Key หรือไม่
          const easySlipKey = process.env.EASYSLIP_API_KEY;

          if (easySlipKey) {
            // === มี API Key → ตรวจสลิปอัตโนมัติ ===
            try {
              const imageBuffer = await getImageContent(msg.id);
              if (!imageBuffer) {
                await replyMessage(replyToken, [{
                  type: 'text',
                  text: '⚠️ ไม่สามารถโหลดรูปภาพได้ค่ะ กรุณาลองส่งใหม่อีกครั้งค่ะ'
                }]);
                continue;
              }

              // ส่งรูปไปตรวจที่ EasySlip API
              const formData = new FormData();
              const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
              formData.append('files', blob, 'slip.jpg');

              const slipRes = await fetch('https://developer.easyslip.com/api/v1/verify', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${easySlipKey}` },
                body: formData,
              });
              const slipData = await slipRes.json();

              if (slipData.status === 200 && slipData.data) {
                const slip = slipData.data;
                const slipAmount = parseFloat(slip.amount?.amount || 0);

                if (slipAmount >= order.totalPrice) {
                  // ✅ ยอดเงินตรง → อัปเดตสถานะอัตโนมัติ
                  await prisma.order.update({
                    where: { id: order.id },
                    data: { status: 'confirmed' }
                  });

                  await replyMessage(replyToken, [{
                    type: 'text',
                    text: `✅ ตรวจสอบสลิปสำเร็จ!\n\n💰 ยอดโอน: ${slipAmount.toFixed(2)} บาท\n📦 ออเดอร์ #${order.id}\n\nสถานะได้เปลี่ยนเป็น "ยืนยันแล้ว" ค่ะ\nทางร้านจะเริ่มดำเนินการผลิตสินค้าให้เร็วที่สุดค่ะ 🙏`
                  }]);
                } else {
                  // ❌ ยอดเงินไม่ตรง
                  await replyMessage(replyToken, [{
                    type: 'text',
                    text: `⚠️ ยอดเงินในสลิปไม่ตรงค่ะ\n\n💰 ยอดที่ต้องชำระ: ${order.totalPrice} บาท\n💰 ยอดในสลิป: ${slipAmount.toFixed(2)} บาท\n\nกรุณาตรวจสอบยอดเงินแล้วส่งสลิปใหม่ค่ะ`
                  }]);
                }
              } else {
                // ตรวจสลิปไม่สำเร็จ
                await replyMessage(replyToken, [{
                  type: 'text',
                  text: '⚠️ ไม่สามารถตรวจสอบสลิปได้ค่ะ\n\nกรุณาส่งรูปสลิปที่ชัดเจน (เห็น QR Code) อีกครั้งค่ะ\nหรือรอทางร้านตรวจสอบด้วยตนเองค่ะ 🙏'
                }]);
              }
            } catch (slipErr) {
              console.error('Slip verification error:', slipErr);
              await replyMessage(replyToken, [{
                type: 'text',
                text: '⚠️ ระบบตรวจสลิปขัดข้อง กรุณาลองใหม่อีกครั้ง หรือรอทางร้านตรวจสอบด้วยตนเองค่ะ 🙏'
              }]);
            }
          } else {
            // === ยังไม่มี API Key → แจ้งทางร้านเฉยๆ ===
            await replyMessage(replyToken, [{
              type: 'text',
              text: `📸 ได้รับสลิปเรียบร้อยแล้วค่ะ!\n\n📦 ออเดอร์ #${order.id}\n💰 ยอดรวม ${order.totalPrice} บาท\n\nทางร้านจะตรวจสอบสลิปและอัปเดตสถานะให้เร็วที่สุดค่ะ 🙏\nคุณจะได้รับแจ้งเตือนอัตโนมัติเมื่อสถานะเปลี่ยนแปลงค่ะ`
            }]);
          }
          continue;
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ status: 'ok' });
  }
}

// GET: LINE ใช้ตรวจสอบ Webhook URL
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
