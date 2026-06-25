import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { replyMessage, getImageContent, pushMessage, verifySignature, sendNotify } from '@/lib/line';

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

              // อัปเดตเวลาให้เป็นออเดอร์ล่าสุดที่ถูก Active
              await prisma.$executeRaw`UPDATE "Order" SET "updatedAt" = NOW() WHERE id = ${order.id}`;

              const replyMessages = [
                {
                  type: 'text',
                  text: `✅ เชื่อมต่อสำเร็จ!\n\n📦 ออเดอร์ #${order.id}\n👤 ${order.customerName}\n👕 ${order.productName} (${order.size} / ${order.color})\n💰 ยอดรวม ${order.totalPrice} บาท\n\nระบบจะแจ้งเตือนสถานะสินค้าอัตโนมัติผ่านแชทนี้ค่ะ`
                }
              ];

              if (order.status === 'pending') {
                replyMessages.push({
                  type: 'text',
                  text: `คุณพร้อมชำระเงินเลยไหมคะ?\nหากพร้อมชำระเงิน รบกวนพิมพ์คำว่า "ชำระเงิน" เข้ามาได้เลยค่ะ เพื่อรับ QR Code โอนเงินค่ะ\n(หรือพิมพ์ "ยกเลิกออเดอร์" หากต้องการยกเลิกค่ะ)`
                });
              } else {
                let statusText = '✅ ยืนยันการชำระเงินแล้ว';
                if (order.status === 'producing') statusText = '⚙️ กำลังดำเนินการผลิต';
                if (order.status === 'shipped') statusText = '📦 จัดส่งเรียบร้อยแล้ว';
                if (order.status === 'cancelled') statusText = '❌ ถูกยกเลิกแล้ว';
                
                replyMessages.push({
                  type: 'text',
                  text: `📌 สถานะออเดอร์ปัจจุบัน: ${statusText}\n(ไม่ต้องชำระเงินซ้ำค่ะ)`
                });
              }

              await replyMessage(replyToken, replyMessages);
            } else {
              await replyMessage(replyToken, [{
                type: 'text',
                text: '❌ ไม่พบออเดอร์ที่ตรงกับรหัสนี้ค่ะ\n\nกรุณาตรวจสอบรหัสอีกครั้ง หรือกดปุ่ม "เชื่อมต่อ LINE" จากหน้าเว็บไซต์อีกครั้งค่ะ'
              }]);
            }
            continue;
          }

          // ตรวจสอบว่าเป็นคำสั่งขอ QR Code ชำระเงินหรือไม่
          if (text.includes('ชำระเงิน') || text.includes('พร้อมชำระ') || text.includes('แจ้งชำระ') || text.includes('ส่งสลิป')) {
            const pendingOrders = await prisma.order.findMany({
              where: { lineUid: userId, status: 'pending' },
              orderBy: { createdAt: 'asc' }
            });

            if (pendingOrders.length === 0) {
              await replyMessage(replyToken, [{
                type: 'text',
                text: 'คุณไม่มีออเดอร์ที่รอชำระเงินค่ะ\n\n(หากเพิ่งสั่งซื้อ กรุณาพิมพ์ "รหัสลับ" เพื่อเชื่อมต่อออเดอร์ก่อนนะคะ)'
              }]);
            } else if (pendingOrders.length === 1) {
              const o = pendingOrders[0];
              await replyMessage(replyToken, [
                {
                  type: 'text',
                  text: `💳 สำหรับออเดอร์ #${o.id}\nรบกวนชำระเงินโดยสแกน QR Code ด้านล่างนี้ค่ะ\n(ยอดโอน ${o.totalPrice} บาท)\n\nเมื่อโอนเงินเรียบร้อยแล้ว สามารถส่งรูปสลิปเข้ามาในแชทนี้ได้เลยนะคะ ระบบจะตรวจสอบให้อัตโนมัติค่ะ`
                },
                {
                  type: 'image',
                  originalContentUrl: `https://petme-pre-oder.vercel.app/api/qr?amount=${o.totalPrice}`,
                  previewImageUrl: `https://petme-pre-oder.vercel.app/api/qr?amount=${o.totalPrice}`
                }
              ]);
            } else {
              const totalSum = pendingOrders.reduce((sum, o) => sum + o.totalPrice, 0);
              const orderDetails = pendingOrders.map(o => `- ออเดอร์ #${o.id} (${o.productName}): ${o.totalPrice} บาท`).join('\n');
              
              await replyMessage(replyToken, [
                {
                  type: 'text',
                  text: `คุณมีออเดอร์รอชำระเงิน ${pendingOrders.length} รายการ:\n\n${orderDetails}\n\n💡 ยอดรวมทั้งหมด: ${totalSum} บาท\n\nคุณสามารถโอนรวบยอดทั้งหมดในครั้งเดียว หรือโอนแยกทีละออเดอร์ก็ได้ค่ะ (ใช้สแกน QR Code หรือโอนเข้าบัญชีเดิม)\n\nเมื่อโอนเรียบร้อยแล้ว ส่งสลิปเข้ามาได้เลยค่ะ ระบบจะจับคู่ให้อัตโนมัติ!`
                },
                {
                  type: 'image',
                  originalContentUrl: `https://petme-pre-oder.vercel.app/api/qr?amount=${totalSum}`,
                  previewImageUrl: `https://petme-pre-oder.vercel.app/api/qr?amount=${totalSum}`
                }
              ]);
            }
            continue;
          }

          // ตรวจสอบคำสั่ง เช็คสถานะออเดอร์ (สำหรับ Unified Rich Menu)
          if (text === 'เช็คสถานะออเดอร์' || text === 'เช็คสถานะ') {
            const activeOrders = await prisma.order.findMany({
              where: { lineUid: userId, status: { not: 'cancelled' } },
              orderBy: { createdAt: 'desc' },
              take: 5
            });

            if (activeOrders.length === 0) {
              await replyMessage(replyToken, [{ type: 'text', text: 'ไม่พบออเดอร์ที่กำลังดำเนินการของคุณค่ะ' }]);
            } else {
              const bubbles = activeOrders.map(o => {
                let statusColor = '#aaaaaa';
                let statusText = 'รอดำเนินการ';
                if (o.status === 'confirmed') { statusColor = '#3b82f6'; statusText = 'ยืนยันแล้ว (รอผลิต)'; }
                if (o.status === 'producing') { statusColor = '#eab308'; statusText = 'กำลังผลิต'; }
                if (o.status === 'shipped') { statusColor = '#22c55e'; statusText = 'จัดส่งแล้ว'; }

                const trackingText = (o.status === 'shipped' && o.trackingNumbers?.length > 0) 
                  ? `เลขพัสดุ: ${o.trackingNumbers.join(', ')}` 
                  : (o.status === 'shipped' ? 'กำลังรอเลขพัสดุ' : '-');

                return {
                  type: 'bubble',
                  size: 'kilo',
                  header: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                      { type: 'text', text: `ออเดอร์ #${o.id}`, weight: 'bold', color: '#ffffff', size: 'sm' }
                    ],
                    backgroundColor: statusColor
                  },
                  body: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                      { type: 'text', text: `${o.productName}`, weight: 'bold', size: 'sm', wrap: true },
                      { type: 'text', text: `ไซส์: ${o.size} / สี: ${o.color}`, size: 'xs', color: '#888888', margin: 'sm' },
                      { type: 'text', text: `จำนวน: ${o.quantity} | ยอดรวม: ${o.totalPrice} ฿`, size: 'xs', color: '#888888' },
                      { type: 'separator', margin: 'md' },
                      { type: 'text', text: `สถานะ: ${statusText}`, size: 'sm', color: statusColor, weight: 'bold', margin: 'md' },
                      { type: 'text', text: trackingText, size: 'xs', color: '#555555', wrap: true, margin: 'sm' }
                    ]
                  }
                };
              });

              await replyMessage(replyToken, [{
                type: 'flex',
                altText: 'สถานะออเดอร์ของคุณ',
                contents: {
                  type: 'carousel',
                  contents: bubbles
                }
              }]);
            }
            continue;
          }

          // ตรวจสอบคำสั่ง ยืนยันที่อยู่ / แก้ไขที่อยู่
          if (text === 'ยืนยันที่อยู่') {
            const orderToConfirm = await prisma.order.findFirst({
              where: { lineUid: userId, status: { notIn: ['shipped', 'cancelled'] }, addressConfirmed: false },
              orderBy: { updatedAt: 'desc' }
            });

            if (orderToConfirm) {
              await prisma.order.update({
                where: { id: orderToConfirm.id },
                data: { addressConfirmed: true }
              });
              await replyMessage(replyToken, [{ type: 'text', text: '✅ ขอบคุณค่ะ ทางร้านบันทึกการยืนยันที่อยู่เรียบร้อยแล้ว และจะรีบดำเนินการจัดส่งให้เร็วที่สุดค่ะ 🚚' }]);
            } else {
              await replyMessage(replyToken, [{ type: 'text', text: 'ไม่มีออเดอร์ที่รอการยืนยันที่อยู่ค่ะ' }]);
            }
            continue;
          }

          if (text === 'แก้ไขที่อยู่') {
            await replyMessage(replyToken, [{ type: 'text', text: 'หากต้องการแก้ไขที่อยู่ รบกวนพิมพ์ **ชื่อ, เบอร์โทร, และที่อยู่ใหม่ที่ถูกต้อง** ส่งมาในแชทนี้ได้เลยค่ะ แอดมินจะรีบทำการแก้ไขให้ค่ะ 📝' }]);
            continue;
          }

          // ตรวจสอบว่าเป็นคำสั่งยกเลิกออเดอร์หรือไม่
          if (text === 'ยกเลิกออเดอร์' || text === 'ยกเลิกสินค้า') {
            const order = await prisma.order.findFirst({
              where: { lineUid: userId },
              orderBy: { updatedAt: 'desc' }
            });

            if (order) {
              if (order.status === 'pending') {
                // ยกเลิกได้เฉพาะตอนที่ยังไม่ชำระเงิน
                await prisma.order.update({
                  where: { id: order.id },
                  data: { status: 'cancelled' }
                });
                await replyMessage(replyToken, [{
                  type: 'text',
                  text: `✅ ยกเลิกออเดอร์ #${order.id} เรียบร้อยแล้วค่ะ\n\nหากต้องการสั่งซื้อสินค้าใหม่ สามารถทำรายการผ่านหน้าเว็บไซต์ได้เลยนะคะ`
                }]);
              } else {
                let statusText = 'ได้รับการยืนยันแล้ว';
                if (order.status === 'producing') statusText = 'อยู่ระหว่างดำเนินการผลิต';
                if (order.status === 'shipped') statusText = 'ถูกจัดส่งเรียบร้อยแล้ว';
                if (order.status === 'cancelled') statusText = 'ถูกยกเลิกไปแล้ว';

                await replyMessage(replyToken, [{
                  type: 'text',
                  text: `❌ ไม่สามารถยกเลิกออเดอร์ #${order.id} ได้ค่ะ\nเนื่องจากสถานะปัจจุบันคือ "${statusText}"\n\nหากมีข้อสงสัยเพิ่มเติม รบกวนติดต่อแอดมินโดยตรงนะคะ`
                }]);
              }
            } else {
              await replyMessage(replyToken, [{
                type: 'text',
                text: '❌ ไม่พบออเดอร์ของคุณค่ะ'
              }]);
            }
            continue;
          }

          // ตรวจสอบคำสั่ง ติดต่อแอดมิน (จากปุ่ม Rich Menu) - ทำงานเสมอโดยข้าม cooldown
          if (text === 'สอบถามแอดมิน') {
            await replyMessage(replyToken, [{
              type: 'text',
              text: 'สวัสดีค่ะ 🙏 แอดมินได้รับข้อความของคุณลูกค้าแล้วนะคะ\n\nตอนนี้แอดมินอาจจะกำลังติดธุระ หรือให้บริการลูกค้าท่านอื่นอยู่ แต่ไม่ต้องห่วงนะคะ แอดมินจะรีบกลับมาตอบคำถามให้เร็วที่สุดเลยค่ะ 💖\n\nระหว่างนี้ คุณลูกค้าสามารถพิมพ์คำถามหรือรายละเอียดทิ้งไว้ได้เลยนะคะ ขอบพระคุณที่สนใจสินค้าของทางร้านค่ะ 😊'
            }]);
            continue;
          }

          // ข้อความทั่วไป (ถ้าแชทกันอยู่ จะไม่ส่งข้อความซ้ำ จนกว่าจะเงียบไป 3 ชม.)
          if (canSendGeneralReply) {
            const isQuestion = text.includes('สอบถาม') || text.includes('ถามหน่อย') || text.includes('สงสัย') || text.includes('คำถาม') || text.includes('รบกวน');
            
            if (isQuestion) {
              await replyMessage(replyToken, [{
                type: 'text',
                text: 'สวัสดีค่ะ 🙏 แอดมินได้รับข้อความของคุณลูกค้าแล้วนะคะ\n\nตอนนี้แอดมินอาจจะกำลังติดธุระ หรือให้บริการลูกค้าท่านอื่นอยู่ แต่ไม่ต้องห่วงนะคะ แอดมินจะรีบกลับมาตอบคำถามให้เร็วที่สุดเลยค่ะ 💖\n\nระหว่างนี้ คุณลูกค้าสามารถพิมพ์คำถามหรือรายละเอียดทิ้งไว้ได้เลยนะคะ ขอบพระคุณที่สนใจสินค้าของทางร้านค่ะ 😊'
              }]);
            } else {
              await replyMessage(replyToken, [{
                type: 'text',
                text: 'ได้สั่งซื้อสินค้าผ่านเว็บไซต์ของเราหรือยังคะ? 🛒\n\n- หากยังไม่ได้สั่งซื้อ สามารถเลือกชมและสั่งซื้อได้ที่: https://petme-pre-oder.vercel.app\n- หากมีข้อสงสัยหรือต้องการสอบถามเพิ่มเติม สามารถพิมพ์ถามไว้ได้เลยค่ะ แอดมินจะรีบมาตอบนะคะ 😊\n\n⚠️ แต่หากคุณลูกค้าสั่งซื้อเรียบร้อยแล้ว:\nรบกวนพิมพ์ "รหัสลับ" ที่ได้จากหน้าเว็บ (เช่น PETME-ABCDEF) ส่งมาในแชทนี้ เพื่อเชื่อมต่อออเดอร์ค่ะ'
              }]);
            }
          }
          continue;
        }

        // --- รูปภาพ (Image) - ระบบตรวจสลิป ---
        if (msg.type === 'image') {
          const pendingOrders = await prisma.order.findMany({
            where: { lineUid: userId, status: 'pending' },
            orderBy: { createdAt: 'asc' } // Oldest first
          });

          if (pendingOrders.length === 0) {
            await replyMessage(replyToken, [{
              type: 'text',
              text: 'คุณไม่มีออเดอร์ที่รอการชำระเงินค่ะ\n\n(หากเพิ่งสั่งซื้อ กรุณาพิมพ์ "รหัสลับ" เพื่อเชื่อมต่อออเดอร์ก่อนนะคะ หรือหากชำระไปแล้ว กรุณารอแอดมินตรวจสอบค่ะ)'
            }]);
            continue;
          }

          const easySlipKey = process.env.EASYSLIP_API_KEY;

          if (easySlipKey) {
            // === มี API Key → ตรวจสลิปอัตโนมัติ ===
            try {
              const imageBuffer = await getImageContent(msg.id);
              if (!imageBuffer) {
                await replyMessage(replyToken, [{ type: 'text', text: '⚠️ ไม่สามารถโหลดรูปภาพได้ค่ะ กรุณาลองส่งใหม่อีกครั้งค่ะ' }]);
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
                const totalSum = pendingOrders.reduce((sum, o) => sum + o.totalPrice, 0);

                let matchedOrders = [];
                let matchType = '';

                // Step 1: Check Combined Payment (โอนรวบยอด)
                if (Math.abs(slipAmount - totalSum) < 0.01) {
                  matchedOrders = pendingOrders;
                  matchType = 'combined';
                } 
                // Step 2: Check Individual Payment (โอนแยก)
                else {
                  const matchingOrder = pendingOrders.find(o => Math.abs(slipAmount - o.totalPrice) < 0.01);
                  if (matchingOrder) {
                    matchedOrders = [matchingOrder];
                    matchType = 'single';
                  }
                }

                if (matchedOrders.length > 0) {
                  // ✅ ยอดเงินตรง → อัปเดตสถานะอัตโนมัติ
                  await prisma.order.updateMany({
                    where: { id: { in: matchedOrders.map(o => o.id) } },
                    data: { status: 'confirmed' }
                  });

                  const orderIdsStr = matchedOrders.map(o => `#${o.id}`).join(', ');
                  
                  await replyMessage(replyToken, [{
                    type: 'text',
                    text: `✅ ตรวจสอบสลิปสำเร็จ!\n\n💰 ยอดโอน: ${slipAmount.toFixed(2)} บาท\n📦 ชำระให้ออเดอร์: ${orderIdsStr}\n\nสถานะได้เปลี่ยนเป็น "ยืนยันแล้ว" ค่ะ\nทางร้านจะเริ่มดำเนินการผลิตสินค้าให้เร็วที่สุดค่ะ 🙏`
                  }]);

                  await sendNotify(`💸 ลูกค้าส่งสลิปแล้ว!\nจากคุณ: ${matchedOrders[0].customerName}\nยอดโอน: ${slipAmount.toFixed(2)} บาท\nชำระให้ออเดอร์: ${orderIdsStr}\n(ระบบยืนยันสลิปอัตโนมัติแล้ว)`);

                  // ส่งคำขอยืนยันที่อยู่อัตโนมัติ (ข้ามอันที่ยืนยันแล้ว)
                  const { sendAddressConfirmationRequest } = require('@/lib/line');
                  for (const o of matchedOrders) {
                    if (!o.addressConfirmed) {
                      await sendAddressConfirmationRequest(o);
                    }
                  }
                } else {
                  // ❌ ยอดเงินไม่ตรงกับอะไรเลย
                  await replyMessage(replyToken, [{
                    type: 'text',
                    text: `⚠️ ยอดเงินในสลิปไม่ตรงกับออเดอร์ค่ะ\n\n💰 ยอดโอนของคุณ: ${slipAmount.toFixed(2)} บาท\n\nระบบไม่พบออเดอร์ที่มียอดนี้ หรือยอดรวมไม่ตรงกับที่ค้างชำระค่ะ กรุณาติดต่อแอดมินเพื่อตรวจสอบค่ะ`
                  }]);

                  await sendNotify(`⚠️ มีสลิปยอดไม่ตรงเข้า!\nยอดในสลิป: ${slipAmount.toFixed(2)} บาท\n(หาออเดอร์ที่ยอดตรงกันไม่เจอ รบกวนแอดมินตรวจสอบในแชทค่ะ)`);
                }
              } else {
                // ตรวจสลิปไม่สำเร็จ (สลิปปลอม/สแกนไม่ติด)
                await replyMessage(replyToken, [{
                  type: 'text',
                  text: '⚠️ ไม่สามารถตรวจสอบสลิปได้ค่ะ\n\nกรุณาส่งรูปสลิปที่ชัดเจน (เห็น QR Code) อีกครั้งค่ะ\nหรือรอทางร้านตรวจสอบด้วยตนเองค่ะ 🙏'
                }]);
              }
            } catch (slipErr) {
              console.error('Slip verification error:', slipErr);
              await replyMessage(replyToken, [{ type: 'text', text: '⚠️ ระบบตรวจสลิปขัดข้อง กรุณาลองใหม่อีกครั้ง หรือรอทางร้านตรวจสอบด้วยตนเองค่ะ 🙏' }]);
            }
          } else {
            // === ยังไม่มี API Key → แจ้งทางร้านเฉยๆ ===
            const orderIdsStr = pendingOrders.map(o => `#${o.id}`).join(', ');
            await replyMessage(replyToken, [{
              type: 'text',
              text: `📸 ได้รับสลิปเรียบร้อยแล้วค่ะ!\n\nทางร้านจะนำสลิปนี้ไปตรวจสอบกับออเดอร์ที่ค้างชำระของคุณค่ะ (${orderIdsStr})\nคุณจะได้รับแจ้งเตือนอัตโนมัติเมื่อสถานะเปลี่ยนแปลงค่ะ`
            }]);

            await sendNotify(`📸 ลูกค้าส่งสลิปมาแล้ว!\n(เนื่องจากยังไม่เปิดระบบตรวจอัตโนมัติ รบกวนแอดมินเข้าไปตรวจสอบในแชทและอัปเดตสถานะด้วยครับ)`);
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
