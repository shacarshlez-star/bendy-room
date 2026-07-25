'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Song {
  id: string
  title: string
}

export default function SetlistPage() {
  const router = useRouter()
  const [role, setRole] = useState<'admin' | 'viewer'>('viewer')
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)

  const [showAddRow, setShowAddRow] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    const savedRole = localStorage.getItem('bendy_user_role')
    if (savedRole === 'admin') {
      setRole('admin')
    } else {
      setRole('viewer')
    }
    fetchSongs()
  }, [])

  const fetchSongs = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('songs').select('id, title')
    if (error) {
      console.error('Error loading songs:', error)
    } else if (data) {
      setSongs(data)
    }
    setLoading(false)
  }

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    setAdding(true)
    const { error } = await supabase.from('songs').insert([
      { 
        title: newTitle.trim(), 
        key: 'Am', 
        bpm: 120, 
        sections: [
          { title: '🏠 בית', bars: [{ chord: 'Am' }, { chord: 'Dm' }, { chord: 'E' }, { chord: 'Am' }] }
        ] 
      }
    ])

    if (error) {
      alert('שגיאה בהוספת שיר: ' + error.message)
    } else {
      setNewTitle('')
      setShowAddRow(false)
      fetchSongs()
    }
    setAdding(false)
  }

  return (
    <div style={{ backgroundColor: '#0d1310', minHeight: '100vh', color: '#e8f5e9', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif', direction: 'rtl', padding: '15px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '450px', backgroundColor: '#111a15', borderRadius: '20px', padding: '20px', boxSizing: 'border-box' }}>
        
        {/* כותרת וכפתור הוספת שיר בצד שמאל למעלה (לאדמין) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #16221c', paddingBottom: '12px' }}>
          <div>
            <h1 style={{ color: '#2ecc71', fontSize: '1.4rem', margin: 0, fontWeight: 'bold' }}>סטליסט חזרה 🎸</h1>
            <span style={{ fontSize: '0.8rem', color: '#a4b3a9' }}>
              {role === 'admin' ? 'מצב מנהל' : 'מצב נגן'}
            </span>
          </div>

          {role === 'admin' && (
            <button 
              onClick={() => setShowAddRow(!showAddRow)}
              style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#2ecc71', color: '#0d1310', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              {showAddRow ? 'ביטול' : '+ הוסף שיר'}
            </button>
          )}
        </div>

        {/* שורת קלט מהירה ופרקטית להוספת שיר (לאדמין) - מופיעה ישירות מעל הסטליסט */}
        {role === 'admin' && showAddRow && (
          <form onSubmit={handleQuickAdd} style={{ display: 'flex', gap: '8px', marginBottom: '15px', width: '100%', boxSizing: 'border-box' }}>
            <input 
              type="text" 
              placeholder="שם השיר..." 
              value={newTitle} 
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
              style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #3498db', background: '#0d1310', color: '#fff', fontSize: '1rem', boxSizing: 'border-box' }}
            />
            <button 
              type="submit" 
              disabled={adding}
              style={{ padding: '12px 18px', borderRadius: '8px', border: 'none', background: '#3498db', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}
            >
              {adding ? '...' : 'הוסף'}
            </button>
          </form>
        )}

        {/* רשימת השירים */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#2ecc71', padding: '20px' }}>טוען שירים...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
            {songs.map((song, index) => (
              <div 
                key={song.id}
                onClick={() => router.push(`/song/${song.id}`)}
                style={{ background: '#0d1310', padding: '14px 16px', borderRadius: '10px', border: '1px solid #22332a', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}
              >
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#e8f5e9' }}>
                  {index + 1}. {song.title}
                </div>
                <div style={{ color: '#2ecc71', fontSize: '1.2rem' }}>➔</div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}