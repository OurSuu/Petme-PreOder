'use client';
import { useState } from 'react';

export default function PreOrderModal({ product, onClose }) {
  const [form, setForm] = useState({
    customerName: '', phone: '', lineId: '', 
    houseNo: '', moo: '', soi: '', subDistrict: '', district: '', province: '', postalCode: '',
    color: 'สีขาว', size: 'M', quantity: 1, note: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const formatPhoneNumber = (value) => {
    // Remove all non-digits
    const phoneNumber = value.replace(/\D/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength === 0) return '';
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
    }
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'phone') {
      value = formatPhoneNumber(value);
    }
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    // Check phone length (must be 12 characters including dashes: 000-000-0000)
    if (form.phone.length !== 12) {
      setError('กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          productName: product.name,
          quantity: parseInt(form.quantity),
        }),
      });
      if (!res.ok) throw new Error('Failed');
      setSuccess(true);
    } catch (err) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>×</button>
          <div className="success-msg">
            <h2>✅ สั่งจองสำเร็จ!</h2>
            <p>ขอบคุณที่สั่งจอง {product.name} (สี: {form.color})<br/>เราจะติดต่อกลับเพื่อยืนยันคำสั่งซื้อครับ</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth: '600px'}}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>สั่งจองพรีออเดอร์</h2>
        <div className="modal-product">
          <img src={product.image} alt={product.name} />
          <div className="modal-product-info">
            <h3>{product.name}</h3>
            <span className="price-new">{product.price} <sup>฿</sup></span>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          {/* ข้อมูลลูกค้า */}
          <div className="form-group">
            <label>ชื่อ-นามสกุล *</label>
            <input name="customerName" value={form.customerName} onChange={handleChange} required placeholder="ชื่อผู้รับ" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>เบอร์โทร * (10 หลัก)</label>
              <input name="phone" value={form.phone} onChange={handleChange} required placeholder="000-000-0000" maxLength="12" />
            </div>
            <div className="form-group">
              <label>LINE ID</label>
              <input name="lineId" value={form.lineId} onChange={handleChange} placeholder="@line_id" />
            </div>
          </div>

          {/* ที่อยู่แบบแยก */}
          <div style={{marginTop: '20px', marginBottom: '10px'}}>
            <label style={{fontSize: '14px', fontWeight: 'bold', color: 'var(--gold)'}}>ที่อยู่จัดส่ง</label>
            <div style={{borderBottom: '1px solid var(--line)', marginTop: '4px'}}></div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>บ้านเลขที่ *</label>
              <input name="houseNo" value={form.houseNo} onChange={handleChange} required placeholder="เช่น 123/4" />
            </div>
            <div className="form-group">
              <label>หมู่</label>
              <input name="moo" value={form.moo} onChange={handleChange} placeholder="เช่น 5" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>ซอย / ถนน</label>
              <input name="soi" value={form.soi} onChange={handleChange} placeholder="เช่น ซอยสุขุมวิท 1" />
            </div>
            <div className="form-group">
              <label>ตำบล / แขวง *</label>
              <input name="subDistrict" value={form.subDistrict} onChange={handleChange} required placeholder="ตำบล" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>อำเภอ / เขต *</label>
              <input name="district" value={form.district} onChange={handleChange} required placeholder="อำเภอ" />
            </div>
            <div className="form-group">
              <label>จังหวัด *</label>
              <input name="province" value={form.province} onChange={handleChange} required placeholder="จังหวัด" />
            </div>
          </div>
          <div className="form-group">
            <label>รหัสไปรษณีย์ *</label>
            <input name="postalCode" value={form.postalCode} onChange={handleChange} required placeholder="เช่น 10110" maxLength="5" />
          </div>

          {/* ข้อมูลสินค้า */}
          <div style={{marginTop: '20px', marginBottom: '10px'}}>
            <label style={{fontSize: '14px', fontWeight: 'bold', color: 'var(--gold)'}}>ตัวเลือกสินค้า</label>
            <div style={{borderBottom: '1px solid var(--line)', marginTop: '4px'}}></div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>สีเสื้อ *</label>
              <select name="color" value={form.color} onChange={handleChange}>
                <option value="สีขาว">สีขาว</option>
                <option value="สีดำ">สีดำ</option>
                <option value="สีครีม">สีครีม</option>
              </select>
            </div>
            <div className="form-group">
              <label>ไซส์ *</label>
              <select name="size" value={form.size} onChange={handleChange}>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>จำนวน</label>
              <input type="number" name="quantity" value={form.quantity} onChange={handleChange} min="1" max="10" />
            </div>
          </div>
          <div className="form-group">
            <label>หมายเหตุ</label>
            <textarea name="note" value={form.note} onChange={handleChange} placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)" />
          </div>

          {error && <p style={{color:'var(--red)', fontSize:'13px', textAlign:'center', marginTop:'10px'}}>{error}</p>}
          
          <button type="submit" className="btn btn-primary" disabled={submitting} style={{marginTop: '20px', width: '100%', justifyContent: 'center'}}>
            {submitting ? 'กำลังส่งข้อมูล...' : 'ยืนยันสั่งจอง'}
          </button>
        </form>
      </div>
    </div>
  );
}
