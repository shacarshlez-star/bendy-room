'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [role, setRole] = useState<'admin' | 'viewer'>('viewer');

  const handleContinue = () => {
    // שמירת התפקיד ב-localStorage לשימוש בשאר חלקי האפליקציה במידת הצורך
    localStorage.setItem('user_role', role);
    
    // מעבר ישיר לסטליסט
    router.push('/setlist');
  };

  return (
    <div style={{ backgroundColor: '#0d1310', color: '#e8f5e9', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px', fontFamily: 'sans-serif', direction: 'rtl' }}>
      <div style={{ width: '100%', maxWidth: '400px', backgroundColor: '#111a15', borderRadius: '20px', padding: '30px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center', border: '1px solid #16221c' }}>
        
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2ecc71', margin: '0 0 8px 0' }}>BendyRoom 🎸</h1>
          <p style={{ color: '#a4b3a9', fontSize: '0.95rem', margin: 0 }}>בחירת הרשאה לכניסה לסטליסט</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'right' }}>
          <label style={{ color: '#2ecc71', fontWeight: 'bold', fontSize: '0.9rem' }}>תפקיד:</label>
          <select 
            value={role} 
            onChange={(e) => setRole(e.target.value as 'admin' | 'viewer')}
            style={{ backgroundColor: '#0d1310', border: '1px solid #22332a', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer', outline: 'none' }}
          >
            <option value="viewer">👁️ נגן (צפייה בלבד)</option>
            <option value="admin">✏️ מנהל (עריכת סטליסט)</option>
          </select>
        </div>

        <button 
          onClick={handleContinue}
          style={{ backgroundColor: '#2ecc71', color: '#0d1310', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold', fontSize: '1.05rem', cursor: 'pointer', marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        >
          כניסה לסטליסט ➔
        </button>

      </div>
    </div>
  );
}