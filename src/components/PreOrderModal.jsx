'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const SearchableSelect = ({ name, label, options, value, onChange, placeholder, disabled, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const filteredOptions = options
    .filter(opt => opt.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 100);

  return (
    <>
      <div 
        className={error ? 'invalid-field' : ''}
        onClick={() => !disabled && setIsOpen(true)}
        style={{
           padding: '14px 14px',
           background: disabled ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.3)',
           border: error ? '1px solid #ef4444' : '1px solid var(--line)',
           borderRadius: '8px',
           color: value ? '#fff' : '#888',
           cursor: disabled ? 'not-allowed' : 'pointer',
           display: 'flex',
           justifyContent: 'space-between',
           alignItems: 'center',
           fontSize: '14px'
        }}
      >
        <span>{value || placeholder}</span>
        <span style={{ fontSize: '12px', opacity: 0.5 }}>▼</span>
      </div>

      {isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', zIndex: 99999,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '20px',
          backdropFilter: 'blur(4px)'
        }} onClick={() => { setIsOpen(false); setSearch(''); }}>
          <div style={{
            background: 'var(--bg-dark)', width: '100%', maxWidth: '500px',
            borderRadius: '24px', 
            height: '70vh', display: 'flex', flexDirection: 'column',
            border: '1px solid var(--gold)',
            boxShadow: '0 10px 50px rgba(0,0,0,0.5)',
            animation: 'popUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }} onClick={e => e.stopPropagation()}>
            <style>{`
              @keyframes popUp {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
              }
            `}</style>
            <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, color: 'var(--gold)', fontSize: '18px' }}>เลือก{label}</h3>
                <button onClick={() => { setIsOpen(false); setSearch(''); }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>✕</button>
              </div>
              <input 
                type="text" 
                placeholder="🔍 ค้นหา..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ 
                  width: '100%', padding: '14px 16px', borderRadius: '12px', 
                  border: '1px solid var(--gold)', background: 'rgba(0,0,0,0.5)', 
                  color: '#fff', fontSize: '16px', outline: 'none'
                }}
              />
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
              {filteredOptions.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#888' }}>ไม่พบข้อมูลที่คุณค้นหา</div>
              ) : (
                filteredOptions.map(opt => (
                  <div 
                    key={opt} 
                    onClick={() => { onChange({ target: { name, value: opt } }); setIsOpen(false); setSearch(''); }}
                    style={{ 
                      padding: '16px 24px', 
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      cursor: 'pointer',
                      color: value === opt ? 'var(--gold)' : '#fff',
                      fontWeight: value === opt ? 'bold' : 'normal',
                      backgroundColor: value === opt ? 'rgba(212,175,55,0.05)' : 'transparent',
                      display: 'flex', justifyContent: 'space-between'
                    }}
                  >
                    <span>{opt}</span>
                    {value === opt && <span>✓</span>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default function PreOrderModal({ product, onClose, user }) {
  const [form, setForm] = useState({
    customerName: user?.name || '', phone: user?.phone || '', lineId: '', 
    houseNo: '', moo: '', soi: '', subDistrict: '', district: '', province: '', postalCode: '',
    color: 'สีขาว', size: 'M', quantity: 1, note: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [secureToken, setSecureToken] = useState(null);
  const [error, setError] = useState('');
  const [missingFields, setMissingFields] = useState([]);

  // Thai Address Cascading State
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subDistricts, setSubDistricts] = useState([]);
  
  // Master lists for unlocked dropdowns
  const [allDistricts, setAllDistricts] = useState([]);
  const [allSubDistricts, setAllSubDistricts] = useState([]);

  useEffect(() => {
    import('@krizad/thai-address-helper').then((ah) => {
      setProvinces(ah.getUniqueProvinces());
    });
    import('@/lib/thaiAddressData.json').then((data) => {
      setAllDistricts(data.default.districts);
      setAllSubDistricts(data.default.subDistricts);
    });
  }, []);

  useEffect(() => {
    if (form.province) {
      import('@krizad/thai-address-helper').then((ah) => {
        setDistricts(ah.getDistrictsByProvince(form.province));
      });
    } else {
      setDistricts([]);
    }
  }, [form.province]);

  useEffect(() => {
    if (form.province && form.district) {
      import('@krizad/thai-address-helper').then((ah) => {
        const raw = ah.getSubDistrictsByDistrict(form.province, form.district);
        setSubDistricts(raw.map(item => item.subDistrict));
      });
    } else {
      setSubDistricts([]);
    }
  }, [form.province, form.district]);

  useEffect(() => {
    if (form.province && form.district && form.subDistrict) {
      import('@krizad/thai-address-helper').then((ah) => {
        const zip = ah.getZipcodeByHierarchy(form.province, form.district, form.subDistrict);
        setForm(prev => ({ ...prev, postalCode: zip || '' }));
        if (zip) {
          setMissingFields(prev => prev.filter(f => f !== 'postalCode'));
        }
      });
    }
  }, [form.province, form.district, form.subDistrict]);

  const formatPhoneNumber = (value) => {
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
    
    setForm(prev => {
      const next = { ...prev, [name]: value };
      
      if (name === 'province') {
        next.district = '';
        next.subDistrict = '';
        next.postalCode = '';
      } else if (name === 'district') {
        next.subDistrict = '';
        next.postalCode = '';
        // Auto-fill province if missing
        if (!next.province && value) {
          import('@krizad/thai-address-helper').then(ah => {
            const p = ah.getUniqueProvinces().find(prov => ah.getDistrictsByProvince(prov).includes(value));
            if (p) setForm(curr => ({ ...curr, province: p }));
          });
        }
      } else if (name === 'subDistrict') {
        next.postalCode = '';
        // Auto-fill province and district if missing
        if ((!next.province || !next.district) && value) {
          import('@krizad/thai-address-helper').then(ah => {
             let foundProv = next.province;
             let foundDist = next.district;
             const provs = ah.getUniqueProvinces();
             for (const p of provs) {
               if (foundProv && p !== foundProv) continue;
               const dists = ah.getDistrictsByProvince(p);
               for (const d of dists) {
                 if (foundDist && d !== foundDist) continue;
                 if (ah.getSubDistrictsByDistrict(p, d).some(item => item.subDistrict === value)) {
                   foundProv = p;
                   foundDist = d;
                   break;
                 }
               }
               if (foundProv && foundDist) break;
             }
             if (foundProv && foundDist) {
               setForm(curr => ({ 
                 ...curr, 
                 province: foundProv, 
                 district: foundDist,
                 postalCode: ah.getZipcodeByHierarchy(foundProv, foundDist, value) || ''
               }));
             }
          });
        }
      }
      return next;
    });

    if (missingFields.includes(name)) {
      setMissingFields(prev => prev.filter(f => f !== name));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    // Check required fields manually
    const requiredFields = ['customerName', 'phone', 'houseNo', 'subDistrict', 'district', 'province', 'postalCode'];
    const missing = requiredFields.filter(field => !form[field] || String(form[field]).trim() === '');
    
    if (missing.length > 0) {
      setMissingFields(missing);
      setError('กรุณากรอกข้อมูลในช่องที่มีแถบสีแดงให้ครบถ้วน');
      setSubmitting(false);
      return;
    }

    if (form.phone.length !== 12) {
      setMissingFields(['phone']);
      setError('กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก');
      setSubmitting(false);
      return;
    }

    setMissingFields([]);

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
      const data = await res.json();
      if (!res.ok) throw new Error('Failed');
      
      setOrderId(data.id);
      setSecureToken(data.secureToken);
      setSuccess(true);
    } catch (err) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
    setSubmitting(false);
  };

  if (!user) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>×</button>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <h2 style={{ color: 'var(--gold)' }}>ต้องเข้าสู่ระบบก่อนสั่งจอง</h2>
            <p style={{ marginTop: '10px', marginBottom: '20px', color: '#ccc' }}>
              กรุณาเข้าสู่ระบบ หรือ สมัครสมาชิก เพื่อบันทึกคำสั่งซื้อ<br/>และเพื่อให้คุณติดตามสถานะออเดอร์ได้
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <Link href="/login" className="btn btn-ghost">เข้าสู่ระบบ</Link>
              <Link href="/register" className="btn btn-primary" style={{ background: 'var(--gold)', color: '#000' }}>สมัครสมาชิก</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    const lineLink = `https://line.me/R/oaMessage/@248nhztl/?${encodeURIComponent(secureToken || '')}`;
    
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
          <button className="modal-close" onClick={onClose}>×</button>
          <div className="success-msg" style={{ padding: '20px 0' }}>
            <h2 style={{ color: 'var(--gold)', marginBottom: '10px', fontSize: '28px' }}>✅ บันทึกคำสั่งซื้อสำเร็จ!</h2>
            
            <div style={{ background: 'rgba(212,175,55,0.1)', border: '2px dashed var(--gold)', borderRadius: '12px', padding: '20px', margin: '20px auto', display: 'inline-block', minWidth: '250px' }}>
              <span style={{ display: 'block', fontSize: '14px', color: '#aaa', marginBottom: '8px' }}>รหัสออเดอร์ของคุณ</span>
              <span style={{ fontSize: '42px', fontWeight: '900', color: 'var(--gold)', letterSpacing: '2px', textShadow: '0 2px 10px rgba(212,175,55,0.3)' }}>#{orderId}</span>
            </div>

            <div style={{ background: 'rgba(0,185,0,0.08)', border: '1px solid rgba(0,185,0,0.3)', borderRadius: '12px', padding: '20px', margin: '20px 0' }}>
              <p style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>📱 รับแจ้งเตือนสถานะผ่าน LINE</p>
              <p style={{ color: '#ccc', fontSize: '14px', marginBottom: '16px', lineHeight: '1.6' }}>
                กดปุ่มด้านล่างเพื่อเชื่อมต่อออเดอร์กับ LINE ของคุณ<br/>
                ระบบจะส่งข้อความให้อัตโนมัติ คุณแค่กด "ส่ง" เท่านั้น!<br/>
                หลังจากนั้นสามารถส่งสลิปชำระเงินผ่านแชทได้เลย
              </p>
              <a 
                href={lineLink}
                target="_blank" 
                className="btn btn-primary"
                style={{ display: 'inline-block', backgroundColor: '#00B900', color: 'white', border: 'none', padding: '16px 32px', fontSize: '18px', fontWeight: 'bold', borderRadius: '50px', boxShadow: '0 4px 15px rgba(0, 185, 0, 0.4)', textDecoration: 'none' }}
              >
                🔔 รับแจ้งเตือนผ่าน LINE
              </a>
            </div>

            <p style={{ fontSize: '13px', marginTop: '16px', color: '#888' }}>
              * หากใช้งานบนคอมพิวเตอร์และปุ่มไม่เปิดแอป LINE<br/>
              กรุณาก๊อปปี้รหัส <b>{secureToken}</b> ไปพิมพ์ส่งใน LINE ของร้านได้เลยค่ะ
            </p>
            <p style={{ fontSize: '13px', marginTop: '8px', color: '#888' }}>
              * สถานะจะเปลี่ยนอัตโนมัติเมื่อทางร้านตรวจสอบสลิปเรียบร้อย
            </p>
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
        <form onSubmit={handleSubmit} noValidate>
          {/* ข้อมูลลูกค้า */}
          <div className="form-group">
            <label>ชื่อ-นามสกุล *</label>
            <input name="customerName" className={missingFields.includes('customerName') ? 'invalid-field' : ''} value={form.customerName} onChange={handleChange} placeholder="ชื่อผู้รับ" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>เบอร์โทร * (10 หลัก)</label>
              <input name="phone" className={missingFields.includes('phone') ? 'invalid-field' : ''} value={form.phone} onChange={handleChange} placeholder="000-000-0000" maxLength="12" />
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
              <input name="houseNo" className={missingFields.includes('houseNo') ? 'invalid-field' : ''} value={form.houseNo} onChange={handleChange} placeholder="เช่น 123/4" />
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
              <SearchableSelect 
                name="subDistrict" 
                label="ตำบล / แขวง"
                options={form.district ? subDistricts : allSubDistricts} 
                value={form.subDistrict} 
                onChange={handleChange} 
                placeholder="เลือกตำบล"
                error={missingFields.includes('subDistrict')}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>อำเภอ / เขต *</label>
              <SearchableSelect 
                name="district" 
                label="อำเภอ / เขต"
                options={form.province ? districts : allDistricts} 
                value={form.district} 
                onChange={handleChange} 
                placeholder="เลือกอำเภอ"
                error={missingFields.includes('district')}
              />
            </div>
            <div className="form-group">
              <label>จังหวัด *</label>
              <SearchableSelect 
                name="province" 
                label="จังหวัด"
                options={provinces} 
                value={form.province} 
                onChange={handleChange} 
                placeholder="เลือกจังหวัด"
                error={missingFields.includes('province')}
              />
            </div>
          </div>
          <div className="form-group">
            <label>รหัสไปรษณีย์ *</label>
            <input name="postalCode" className={missingFields.includes('postalCode') ? 'invalid-field' : ''} value={form.postalCode} onChange={handleChange} placeholder="รหัสไปรษณีย์ (เติมอัตโนมัติ)" maxLength="5" style={{ background: 'rgba(255,255,255,0.05)', color: '#aaa' }} readOnly />
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

          {error && (
            <div className="alert-error">
              <span>⚠️</span> {error}
            </div>
          )}
          
          <button type="submit" className="btn btn-primary" disabled={submitting} style={{marginTop: '20px', width: '100%', justifyContent: 'center'}}>
            {submitting ? 'กำลังบันทึกคำสั่งซื้อ...' : 'ยืนยันสั่งจอง'}
          </button>
        </form>
      </div>
    </div>
  );
}
