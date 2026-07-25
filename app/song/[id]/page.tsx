'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Bar {
  chord: string
  lyrics: string
}

interface Section {
  title: string
  bars: Bar[]
}

interface SongData {
  id?: string
  title: string
  artist: string
  key: string
  bpm: number
  sections: Section[]
}

export default function SongPage() {
  const params = useParams()
  const router = useRouter()
  const songId = params.id as string

  const [role, setRole] = useState<'admin' | 'viewer'>('viewer')
  const [song, setSong] = useState<SongData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const savedRole = (localStorage.getItem('bendy_user_role') as 'admin' | 'viewer') || 'viewer'
    setRole(savedRole)
    fetchSong()
  }, [songId])

  const fetchSong = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('id', songId)
      .single()

    if (error) {
      console.error('Error fetching song:', error)
    } else if (data) {
      setSong({
        id: data.id,
        title: data.title || '',
        artist: data.artist || '',
        key: data.key || 'C',
        bpm: data.bpm || 120,
        sections: data.sections || [
          { title: 'בית 1', bars: [{ chord: 'C', lyrics: 'מילים ראשונות...' }] }
        ]
      })
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!song) return
    setSaving(true)
    const { error } = await supabase
      .from('songs')
      .update({
        title: song.title,
        artist: song.artist,
        key: song.key,
        bpm: song.bpm,
        sections: song.sections
      })
      .eq('id', songId)

    if (error) {
      alert('שגיאה בשמירה: ' + error.message)
    } else {
      alert('השיר עודכן בהצלחה!')
      setIsEditing(false)
    }
    setSaving(false)
  }

  const updateSongField = (field: keyof SongData, value: any) => {
    if (!song) return
    setSong({ ...song, [field]: value })
  }

  const addSection = () => {
    if (!song) return
    const newSections = [
      ...song.sections,
      { title: `בית ${song.sections.length + 1}`, bars: [{ chord: 'C', lyrics: '' }] }
    ]
    setSong({ ...song, sections: newSections })
  }

  const removeSection = (sIndex: number) => {
    if (!song) return
    const newSections = song.sections.filter((_, idx) => idx !== sIndex)
    setSong({ ...song, sections: newSections })
  }

  const updateSectionTitle = (sIndex: number, title: string) => {
    if (!song) return
    const newSections = [...song.sections]
    newSections[sIndex].title = title
    setSong({ ...song, sections: newSections })
  }

  const addBar = (sIndex: number) => {
    if (!song) return
    const newSections = [...song.sections]
    newSections[sIndex].bars.push({ chord: '', lyrics: '' })
    setSong({ ...song, sections: newSections })
  }

  const removeBar = (sIndex: number, bIndex: number) => {
    if (!song) return
    const newSections = [...song.sections]
    newSections[sIndex].bars = newSections[sIndex].bars.filter((_, idx) => idx !== bIndex)
    setSong({ ...song, sections: newSections })
  }

  const updateBar = (sIndex: number, bIndex: number, field: 'chord' | 'lyrics', value: string) => {
    if (!song) return
    const newSections = [...song.sections]
    newSections[sIndex].bars[bIndex][field] = value
    setSong({ ...song, sections: newSections })
  }

  if (loading) {
    return <div style={{ padding: '40px', color: '#00ff88', textAlign: 'center', backgroundColor: '#0a0d0a', minHeight: '100vh', fontFamily: 'sans-serif' }}>טוען שיר...</div>
  }

  if (!song) {
    return <div style={{ padding: '40px', color: '#ff4d4d', textAlign: 'center', backgroundColor: '#0a0d0a', minHeight: '100vh', fontFamily: 'sans-serif' }}>השיר לא נמצא</div>
  }

  return (
    <div style={{ backgroundColor: '#0a0d0a', minHeight: '100vh', color: '#e0e0e0', fontFamily: 'sans-serif', direction: 'rtl', padding: '20px' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        
        {/* סרגל עליון */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <button 
            onClick={() => router.push('/setlist')}
            style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #1a3322', background: '#111813', color: '#00ff88', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ➔ חזרה לסטליסט
          </button>

          {role === 'admin' && (
            <button 
              onClick={() => setIsEditing(!isEditing)}
              style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: isEditing ? '#ff9800' : '#00ff88', color: '#0a0d0a', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {isEditing ? 'סגור עריכה' : '✏️ ערוך שיר'}
            </button>
          )}
        </div>

        {/* עריכת אדמין */}
        {isEditing ? (
          <div style={{ background: '#111813', padding: '20px', borderRadius: '16px', border: '1px solid #00ff88' }}>
            <h2 style={{ color: '#00ff88', marginTop: 0, textAlign: 'center' }}>עריכת שיר</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#888', marginBottom: '5px' }}>שם השיר:</label>
              <input 
                type="text" 
                value={song.title} 
                onChange={(e) => updateSongField('title', e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #1a3322', background: '#0a0d0a', color: '#fff', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#888', marginBottom: '5px' }}>אמן:</label>
                <input 
                  type="text" 
                  value={song.artist} 
                  onChange={(e) => updateSongField('artist', e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #1a3322', background: '#0a0d0a', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ width: '90px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#888', marginBottom: '5px' }}>סולם:</label>
                <input 
                  type="text" 
                  value={song.key} 
                  onChange={(e) => updateSongField('key', e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #1a3322', background: '#0a0d0a', color: '#00ff88', fontWeight: 'bold', textAlign: 'center', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ width: '90px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#888', marginBottom: '5px' }}>BPM:</label>
                <input 
                  type="number" 
                  value={song.bpm} 
                  onChange={(e) => updateSongField('bpm', parseInt(e.target.value) || 0)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #1a3322', background: '#0a0d0a', color: '#00ff88', fontWeight: 'bold', textAlign: 'center', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <hr style={{ borderColor: '#1a3322', margin: '20px 0' }} />

            <h3 style={{ color: '#00ff88' }}>מבנה ותיבות נגינה</h3>

            {song.sections.map((sec, sIdx) => (
              <div key={sIdx} style={{ background: '#0a0d0a', padding: '15px', borderRadius: '12px', marginBottom: '15px', border: '1px solid #1a3322' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <input 
                    type="text" 
                    value={sec.title} 
                    onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                    style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #00ff88', color: '#00ff88', fontWeight: 'bold', fontSize: '16px' }}
                  />
                  <button onClick={() => removeSection(sIdx)} style={{ background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}>מחק</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                  {sec.bars.map((bar, bIdx) => (
                    <div key={bIdx} style={{ background: '#111813', padding: '8px', borderRadius: '8px', border: '1px solid #1a3322', position: 'relative' }}>
                      <button 
                        onClick={() => removeBar(sIdx, bIdx)} 
                        style={{ position: 'absolute', top: '2px', left: '2px', background: 'transparent', color: '#666', border: 'none', cursor: 'pointer', fontSize: '10px' }}
                      >
                        ✕
                      </button>
                      <input 
                        type="text" 
                        placeholder="אקורד" 
                        value={bar.chord} 
                        onChange={(e) => updateBar(sIdx, bIdx, 'chord', e.target.value)}
                        style={{ width: '100%', background: '#0a0d0a', border: '1px solid #1a3322', color: '#00ff88', fontWeight: 'bold', borderRadius: '4px', textAlign: 'center', marginBottom: '4px', padding: '4px', boxSizing: 'border-box' }}
                      />
                      <input 
                        type="text" 
                        placeholder="מילים" 
                        value={bar.lyrics} 
                        onChange={(e) => updateBar(sIdx, bIdx, 'lyrics', e.target.value)}
                        style={{ width: '100%', background: 'transparent', border: 'none', color: '#ccc', fontSize: '12px', textAlign: 'center', boxSizing: 'border-box' }}
                      />
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => addBar(sIdx)}
                  style={{ background: 'transparent', color: '#00ff88', border: '1px dashed #00ff88', borderRadius: '6px', width: '100%', padding: '8px', cursor: 'pointer', fontSize: '13px' }}
                >
                  + הוסף תיבת נגינה
                </button>
              </div>
            ))}

            <button 
              onClick={addSection}
              style={{ background: '#1a3322', color: '#00ff88', border: '1px solid #00ff88', borderRadius: '10px', padding: '12px', width: '100%', marginBottom: '20px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              + הוסף חלק חדש (בית / פזמון)
            </button>

            <button 
              onClick={handleSave}
              disabled={saving}
              style={{ background: '#00ff88', color: '#0a0d0a', border: 'none', borderRadius: '10px', padding: '15px', width: '100%', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
            >
              {saving ? 'שומר שינויים...' : '💾 שמור שינויים בשיר'}
            </button>
          </div>
        ) : (
          /* תצוגה נקייה לנגן */
          <div>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', color: '#ffffff', fontWeight: 'bold' }}>{song.title}</h1>
              {song.artist && <p style={{ color: '#888', margin: 0, fontSize: '16px' }}>{song.artist}</p>}
              
              <div style={{ marginTop: '15px', display: 'inline-flex', gap: '20px', background: '#111813', padding: '10px 20px', borderRadius: '20px', border: '1px solid #1a3322', color: '#00ff88', fontSize: '14px', fontWeight: 'bold' }}>
                <span>🎼 סולם: {song.key}</span>
                <span>⏱️ קצב: {song.bpm} BPM</span>
              </div>
            </div>

            {song.sections.map((sec, sIdx) => (
              <div key={sIdx} style={{ marginBottom: '25px', background: '#111813', padding: '18px', borderRadius: '16px', border: '1px solid #1a3322' }}>
                <h3 style={{ color: '#00ff88', marginTop: 0, marginBottom: '15px', borderBottom: '1px solid #1a3322', paddingBottom: '8px', fontSize: '18px' }}>{sec.title}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                  {sec.bars.map((bar, bIdx) => (
                    <div key={bIdx} style={{ background: '#0a0d0a', padding: '12px 8px', borderRadius: '10px', border: '1px solid #1a3322', textAlign: 'center' }}>
                      <div style={{ color: '#00ff88', fontWeight: 'bold', fontSize: '20px', marginBottom: '4px' }}>{bar.chord || '-'}</div>
                      <div style={{ color: '#aaa', fontSize: '13px' }}>{bar.lyrics}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}