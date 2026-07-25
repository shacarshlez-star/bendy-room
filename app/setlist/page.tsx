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

  // הוספת שיר חדש (אדמין)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newKey, setNewKey] = useState('C')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    const savedRole = (localStorage.getItem('bendy_user_role') as 'admin' | 'viewer') || 'viewer'
    setRole(savedRole)
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
      { title: newTitle.trim(), key: newKey, bpm: 120, sections: [] }
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
    <div style={{ backgroundColor: '#0a0d0a', minHeight: '100vh', color: '#e0e0e0', fontFamily: 'sans-serif', direction: 'rtl', padding: '20px' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        
        {/* כותרת */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#00ff88', fontSize: '28px', margin: '0 0 5px 0' }}>🎸 סטליסט חזרה</h1>
          <p style={{ color: '#888', margin: 0, fontSize: '14px' }}>
            {role === 'admin' ? 'מצב מנהל (אפשרות עריכה)' : 'מצב נגן (צפייה בלבד)'}
          </p>
        </div>

        {/* אזור הוספת שיר מיושר ומאובטח */}
        {role === 'admin' && (
          <div style={{ marginBottom: '25px' }}>
            {!showAddForm ? (
              <button 
                onClick={() => setShowAddForm(true)}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: '#00ff88', color: '#0a0d0a', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}
              >
                + הוסף שיר חדש
              </button>
            ) : (
              <form onSubmit={handleAddSong} style={{ background: '#111813', padding: '15px', borderRadius: '12px', border: '1px solid #00ff88' }}>
                <div style={{ display: 'flex', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
                  <input 
                    type="text" 
                    placeholder="שם השיר..." 
                    value={newTitle} 
                    onChange={(e) => setNewTitle(e.target.value)}
                    style={{ flex: 1, minWidth: 0, padding: '10px', borderRadius: '8px', border: '1px solid #1a3322', background: '#0a0d0a', color: '#fff', boxSizing: 'border-box' }}
                  />
                  <input 
                    type="text" 
                    placeholder="סולם" 
                    value={newKey} 
                    onChange={(e) => setNewKey(e.target.value)}
                    style={{ width: '60px', padding: '10px', borderRadius: '8px', border: '1px solid #1a3322', background: '#0a0d0a', color: '#00ff88', textAlign: 'center', boxSizing: 'border-box' }}
                  />
                  <button 
                    type="submit" 
                    disabled={adding}
                    style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#00ff88', color: '#0a0d0a', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {adding ? '...' : 'הוסף'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* רשימת השירים */}
        <h2 style={{ fontSize: '18px', color: '#888', marginBottom: '15px' }}>שירים:</h2>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#666' }}>טוען רשימה...</div>
        ) : songs.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>אין שירים ברשימה עדיין</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {songs.map((song, index) => (
              <div 
                key={song.id}
                onClick={() => router.push(`/song/${song.id}`)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111813', padding: '16px', borderRadius: '12px', border: '1px solid #1a3322', cursor: 'pointer' }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#fff' }}>
                  {index + 1}. {song.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '13px', color: '#00ff88', background: '#0a0d0a', padding: '4px 8px', borderRadius: '6px' }}>
                    סולם: {song.key}
                  </span>
                  <span style={{ color: '#00ff88', fontSize: '18px' }}>➔</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}