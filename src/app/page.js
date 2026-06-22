'use client';
import { useState } from 'react';
import PreOrderModal from '@/components/PreOrderModal';

const products = [
  { id: 1, name: 'PET ME — หน้างอ', desc: 'หน้าเอียงงงๆ เหมือนถามว่า "จะลูบเมื่อไหร่" ลายเด่นด้านหลังเสื้อ', image: '/images/PetMe_Chan01.png', price: 390, originalPrice: 550 },
  { id: 2, name: 'PET ME — ง่วงนอน', desc: 'หลับปุ๋ยไม่สนโลก ลายชิลๆ สำหรับวันที่อยากอยู่เฉยๆ', image: '/images/PetMe_Chan02.png', price: 390, originalPrice: 550 },
  { id: 3, name: 'PET ME — กอดหัวใจ', desc: 'โผกอดหัวใจสีแดง ลายคิวต์สุดในคอลเล็กชันนี้', image: '/images/PetMe_Chan03.png', price: 390, originalPrice: 550 },
];

export default function Home() {
  const [selectedProduct, setSelectedProduct] = useState(null);

  return (
    <>
      {/* NAV */}
      <nav>
        <div className="brand">
          <img src="/images/Petme_MainLogo.png" alt="PM" />
          <span>PET ME SHIRT</span>
        </div>
        <div className="navlinks">
          <a href="#shop">คอลเล็กชัน</a>
          <a href="#story">เรื่องราว</a>
          <a href="#lookbook">ลุคบุ๊ก</a>
          <a href="#info">ข้อมูลสั่งซื้อ</a>
        </div>
        <a href="#shop" className="nav-cta">พรีออเดอร์เลย</a>
      </nav>

      {/* MARQUEE */}
      <div className="marquee">
        <div className="marquee-track">
          <span>PET ME SHIRT — DROP 01 — งานลายมือจริง — สุนัขตัวจริง — จำกัดจำนวน — MADE TO ORDER — PET ME SHIRT — DROP 01 — งานลายมือจริง — สุนัขตัวจริง — จำกัดจำนวน — MADE TO ORDER — </span>
          <span>PET ME SHIRT — DROP 01 — งานลายมือจริง — สุนัขตัวจริง — จำกัดจำนวน — MADE TO ORDER — PET ME SHIRT — DROP 01 — งานลายมือจริง — สุนัขตัวจริง — จำกัดจำนวน — MADE TO ORDER — </span>
        </div>
      </div>

      {/* HERO */}
      <header className="hero">
        <div className="hero-bg"></div>
        <div className="hero-fade"></div>
        <div className="hero-grain"></div>
        <div className="sticker">
          <div className="s-top">ราคาเปิดตัว</div>
          <div className="s-num">390.-</div>
          <div className="s-bot">จาก 550.-</div>
        </div>
        <div className="hero-inner">
          <img className="hero-logo" src="/images/Logo_Shirt2.png" alt="PET ME" />
          <p className="hero-sub">เสื้อยืดจากลายเส้นมือจริง วาดจากหมาตัวจริงของเพื่อนเรา ทุกตัวผลิตเมื่อมีคำสั่งซื้อ ไม่ผลิตซ้ำเมื่อหมดล็อต — นี่คือ DROP แรกของ PET ME SHIRT</p>
          <div className="hero-row">
            <a href="#shop" className="btn btn-primary">ดูคอลเล็กชัน DROP 01</a>
            <a href="#story" className="btn btn-ghost">อ่านเรื่องราวแบรนด์</a>
          </div>
        </div>
      </header>

      {/* STORY */}
      <section className="story" id="story">
        <div className="wrap story-grid">
          <div className="story-copy">
            <span className="eyebrow on-paper">เรื่องราว</span>
            <h2>ลายมือจริง<br />คนวาดจริง<br />หมาตัวจริง</h2>
            <p style={{ marginTop: '22px' }}>PET ME SHIRT ไม่ได้เริ่มจากโรงงาน แต่เริ่มจากดินสอกับกระดาษ ลายเส้นทุกแบบวาดด้วยมือจากหมาตัวจริงของเพื่อนเรา ไม่มีการสั่งคอมมิชชันจากที่ไหน ทุกคาแรกเตอร์ผ่านมือเราเองทั้งหมด</p>
            <p><strong>เราไม่ใช่ Fast Fashion</strong> — แต่ละคอลเล็กชันคือ "DROP" ที่จำกัดจำนวน ผลิตเมื่อมีคำสั่งซื้อเท่านั้น เพื่อให้ทุกตัวที่ออกมามีคุณภาพ ไม่ใช่งานสต๊อกกองโกดัง</p>
            <p>เสื้อทรงโอเวอร์ไซส์ ใส่ได้ทั้งผู้ชายผู้หญิง สวมสบาย เน้นเล่าเรื่องผ่านงานภาพมากกว่าโลโก้ใหญ่เกินจำเป็น</p>
          </div>
          <div className="story-art">
            <div className="story-tag">DROP 01</div>
            <img src="/images/Post2.png" alt="PET ME shirt back detail" />
            <img className="pm-watermark" src="/images/Logo_Shirt2.png" alt="PM mark" />
          </div>
        </div>
      </section>

      {/* SHOP */}
      <section className="shop" id="shop">
        <div className="wrap">
          <div className="drop-row">
            <div>
              <span className="eyebrow">DROP 01 · มีจำกัด</span>
              <h2 style={{ marginTop: '10px' }}>3 ลายแรก<br />ของ PET ME</h2>
            </div>
            <div className="drop-meta">เสื้อยืดคอกลม ทรงโอเวอร์ไซส์<br /><b>ราคาเปิดตัว 390 ฿</b> จากราคาปกติ 550 ฿<br />พรีออเดอร์ทุกตัว · ผลิต 7–10 วัน</div>
          </div>
          <div className="product-grid">
            {products.map(p => (
              <div className="card" key={p.id}>
                <div className="card-img">
                  <span className="card-badge">-30%</span>
                  <img src={p.image} alt={p.name} />
                </div>
                <div className="card-body">
                  <h3>{p.name}</h3>
                  <p className="desc">{p.desc}</p>
                  <div className="price-row">
                    <span className="price-old">{p.originalPrice} ฿</span>
                    <span className="price-new">{p.price} <sup>฿</sup></span>
                  </div>
                  <div className="sizes"><span>S</span><span>M</span><span>L</span><span>XL</span><span>XXL</span></div>
                  <button className="card-cta" onClick={() => setSelectedProduct(p)}>สั่งจองลายนี้</button>
                </div>
              </div>
            ))}
          </div>
          <div className="hoodie-teaser" id="hoodie">
            <div className="hoodie-teaser-img">
              <span className="card-badge badge-soon">เร็วๆนี้</span>
              <img src="/images/Post3.png" alt="PET ME Hoodie" />
            </div>
            <div className="hoodie-teaser-body">
              <span className="eyebrow" style={{ color: 'var(--gold)' }}>NEXT UP · ของใหม่</span>
              <h3>PET ME HOODIE</h3>
              <p>เวอร์ชั่นฮู้ดอุ่นกว่าเดิม ปักโลโก้ "PET ME" เรียบๆ หน้าอก มีให้เลือก 2 สี — ครีม และ ดำ ทรงโอเวอร์ไซส์เหมือนเดิม เตรียมเปิดให้พรีออเดอร์เร็วๆนี้</p>
              <div className="sizes"><span>S</span><span>M</span><span>L</span><span>XL</span><span>XXL</span></div>
              <a href="#info" className="btn btn-ghost" style={{ marginTop: '6px' }}>แจ้งเตือนเมื่อเปิดขาย</a>
            </div>
          </div>
        </div>
      </section>

      {/* LOOKBOOK */}
      <section className="lookbook" id="lookbook">
        <div className="wrap">
          <div className="section-head on-paper">
            <span className="eyebrow on-paper">ลุคบุ๊ก</span>
            <h2>ใส่จริง ถ่ายจริง</h2>
            <p>ทรงโอเวอร์ไซส์ใส่ได้ทุกเพศ เน้นความสบายแบบสตรีทแวร์ ไม่ใช่งานสำเร็จรูปจากแคตตาล็อก</p>
          </div>
          <div className="lb-feature">
            <img src="/images/Post1.png" alt="PET ME Hoodie lookbook" />
            <div className="lb-feature-cap">
              <span className="eyebrow">พรีวิวฮู้ดใหม่</span>
              <h3>PET ME HOODIE — สีครีม &amp; สีดำ</h3>
            </div>
          </div>
          <div className="lb-grid">
            <div className="lb-card">
              <img src="/images/PetMe_Chan02.png" alt="PET ME สีดำ" />
              <div className="lb-cap">
                <span className="eyebrow">สีดำ</span>
                <h3>ลาย "ง่วงนอน" ด้านหลัง</h3>
              </div>
            </div>
            <div className="lb-card">
              <img src="/images/PetMe_Chan01.png" alt="PET ME สีขาว" />
              <div className="lb-cap">
                <span className="eyebrow">สีขาว</span>
                <h3>โลโก้เล็กหน้าอก มินิมอล</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INFO */}
      <section className="info" id="info">
        <div className="wrap">
          <div className="info-grid">
            <div className="info-item"><span className="num">01</span><h4>พรีออเดอร์ทุกตัว</h4><p>ไม่มีสต๊อกล่วงหน้า ผลิตเมื่อมีคำสั่งซื้อ เพื่อคุมคุณภาพทุกตัวที่ส่งถึงมือคุณ</p></div>
            <div className="info-item"><span className="num">02</span><h4>ใช้เวลา 7–10 วัน</h4><p>นับจากวันที่ยืนยันคำสั่งซื้อ ก่อนจัดส่งทั่วประเทศ</p></div>
            <div className="info-item"><span className="num">03</span><h4>ทรงโอเวอร์ไซส์ ยูนิเซ็กซ์</h4><p>ไซส์ S–XXL ใส่ได้ทั้งผู้ชายผู้หญิง เช็คตารางไซส์ก่อนสั่งได้ทางแชต</p></div>
            <div className="info-item"><span className="num">04</span><h4>DROP จำกัดจำนวน</h4><p>เมื่อ DROP 01 หมด จะไม่มีการผลิตซ้ำในลายเดิม รอ DROP ต่อไปเท่านั้น</p></div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="wrap">
          <div className="foot-top">
            <div className="foot-brand">
              <div className="brand">
                <img src="/images/Petme_MainLogo.png" alt="PM" />
                <span style={{ fontSize: '18px' }}>PET ME SHIRT</span>
              </div>
              <p>แบรนด์สตรีทแวร์จากลายเส้นมือจริง ผลิตแบบจำกัดจำนวนทุก DROP งานทำมือ ไม่ใช่งานโรงงาน</p>
            </div>
            <div className="foot-cols">
              <div className="foot-col">
                <h5>ช้อป</h5>
                <a href="#shop">DROP 01</a>
                <a href="#lookbook">ลุคบุ๊ก</a>
                <a href="#info">วิธีสั่งซื้อ</a>
              </div>
              <div className="foot-col">
                <h5>ติดตามเรา</h5>
                <span>IG · @petme.shirt</span>
                <span>TikTok · @petme.shirt</span>
                <span>LINE OA · @petmeshirt</span>
              </div>
            </div>
          </div>
          <div className="foot-bottom">
            <span>© 2026 PET ME SHIRT — All rights reserved.</span>
            <span>เว็บไซต์ตัวอย่าง (Draft Mockup) สำหรับพรีเซนต์แบรนด์</span>
          </div>
        </div>
      </footer>

      {/* MODAL */}
      {selectedProduct && (
        <PreOrderModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </>
  );
}
