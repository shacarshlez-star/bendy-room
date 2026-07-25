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
  key: string
}

export default function SetlistPage() {
  const router = useRouter()
  const [role, setRole] = useState<'admin' | 'viewer'>('viewer')
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)

  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newKey, setNewKey] = useState('Cm')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    // טעינת תפקיד מבוטחת
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
    const { data, error } = await supabase.from('songs').select('*')
    if (error) {
      console.error('Error loading songs:', error)
    } else if (data) {
      setSongs(data)
    }
    setLoading(false)
  }

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    setAdding(true)
    const { error } = await supabase.from('songs').insert([
      { 
        title: newTitle.trim(), 
        key: newKey, 
        bpm: 120, 
        sections: [
          { title: 'בית 1 🏠', bars: [{ chord: newKey }] }
        ] 
      }
    ])

    if (error) {
      alert('שגיאה בהוספת שיר: ' + error.message)
    } else {
      setNewTitle('')
      setShowAddForm(false)
      fetchSongs()
    }
    setAdding(false)
  }

  return (
    <div style={{ backgroundColor: '#060d08', minHeight: '100vh', color: '#00ff88', fontFamily: 'sans-serif', direction: 'rtl', padding: '16px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto', boxSizing: 'border-box' }}>
        
        {/* כותרת וכפתור הוספה מאוזנים */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ color: '#00ff88', fontSize: '22px', margin: 0, fontWeight: 'bold' }}>סטליסט חזרה 🎸</h1>
            <span style={{ fontSize: '12px', color: '#888' }}>
              {role === 'admin' ? 'מצב מנהל מערכת' : 'מצב נגן (צפייה בלבד)'}
            </span>
          </div>

          {role === 'admin' && (
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#00ff88', color: '#000', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
            >
              {showAddForm ? 'ביטול' : '+ הוסף שיר'}
            </button>
          )}
        </div>

        {/* טופס הוספה מתוחם בדיוק ללא זליגה */}
        {role === 'admin' && showAddForm && (
          <form onSubmit={handleAddSong} style={{ background: '#0d1810', padding: '14px', borderRadius: '12px', border: '1px solid #00ff88', marginBottom: '20px', boxSizing: 'border-box', width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
              <input 
                type="text" 
                placeholder="שם השיר החדש..." 
                value={newTitle} 
                onChange={(e) => setNewTitle(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #1c3523', background: '#060d08', color: '#fff', boxSizing: 'border-box', fontSize: '14px' }}
              />
              <div style={{ display: 'flex', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
                <input 
                  type="text" 
                  placeholder="סולם" 
                  value={newKey} 
                  onChange={(e) => setNewKey(e.target.value)}
                  style={{ width: '80px', padding: '10px', borderRadius: '6px', border: '1px solid #1c3523', background: '#060d08', color: '#00ff88', textAlign: 'center', fontWeight: 'bold', boxSizing: 'border-box' }}
                />
                <button 
                  type="submit" 
                  disabled={adding}
                  style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', background: '#00ff88', color: '#000', fontWeight: 'bold', cursor: 'pointer', boxSizing: 'border-box' }}
                >
                  {adding ? 'שומר...' : 'הוסף שיר'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* רשימת השירים */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#00ff88', padding: '20px' }}>טוען שירים...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            {songs.map((song, index) => (
              <div 
                key={song.id}
                onClick={() => router.push(`/song/${song.id}`)}
                style={{ background: '#0d1810', padding: '14px 16px', borderRadius: '12px', border: '1px solid #1c3523', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}
              >
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', marginBottom: '2px' }}>
                    {index + 1}. {song.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#00ff88' }}>
                    סולם: {song.key}
                  </div>
                </div>
                <div style={{ color: '#00ff88', fontSize: '18px' }}>➔</div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}