'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', password: '', name: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Format phone if provided
    let phoneNum = form.phone.replace(/\D/g, '');
    if (phoneNum.length > 0 && phoneNum.length !== 10) {
      setError('กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก');
      setLoading(false);
      return;
    }
    if (phoneNum.length === 10) {
      phoneNum = `${phoneNum.slice(0, 3)}-${phoneNum.slice(3, 6)}-${phoneNum.slice(6, 10)}`;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, phone: phoneNum || form.phone })
      });
      const data = await res.json();
      
      if (res.ok) {
        // Force refresh to update header state
        window.location.href = '/';
      } else {
        setError(data.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="login-box" style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-card)', padding: '40px', borderRadius: '16px', border: '1px solid var(--line)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        <h2 style={{ textAlign: 'center', color: 'var(--gold)', marginBottom: '30px' }}>สมัครสมาชิก</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Username * <small>(ใช้สำหรับ Login)</small></label>
            <input 
              type="text" 
              required 
              value={form.username}
              onChange={(e) => setForm({...form, username: e.target.value})}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--bg)', color: '#fff' }}
              placeholder="ตัวอักษรภาษาอังกฤษหรือตัวเลข"
            />
          </div>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Password *</label>
            <input 
              type="password" 
              required 
              value={form.password}
              onChange={(e) => setForm({...form, password: e.target.value})}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--bg)', color: '#fff' }}
              placeholder="รหัสผ่าน"
            />
          </div>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>ชื่อ-นามสกุล *</label>
            <input 
              type="text" 
              required 
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--bg)', color: '#fff' }}
              placeholder="สำหรับใช้จัดส่งสินค้า"
            />
          </div>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>เบอร์โทรศัพท์ * (10 หลัก)</label>
            <input 
              type="text" 
              required 
              maxLength="10"
              value={form.phone}
              onChange={(e) => setForm({...form, phone: e.target.value.replace(/\D/g, '')})}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--bg)', color: '#fff' }}
              placeholder="0891234567"
            />
          </div>
          {error && (
            <div className="alert-error" style={{ marginBottom: '20px' }}>
              <span>⚠️</span> {error}
            </div>
          )}
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: '16px' }}>
            {loading ? 'กำลังสมัครสมาชิก...' : 'ยืนยันการสมัคร'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#888' }}>
          มีบัญชีอยู่แล้วใช่หรือไม่? <Link href="/login" style={{ color: 'var(--gold)' }}>เข้าสู่ระบบที่นี่</Link>
        </p>
      </div>
    </div>
  );
}
