'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Bar {
  chord: string
}

interface Section {
  title: string
  bars: Bar[]
}

interface SongData {
  id?: string
  title: string
  key: string
  audio_url?: string
  sections: Section[]
}

const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const transposeChord = (chord: string, semitones: number) => {
  return chord.replace(/[A-G][#b]?/g, (match) => {
    let index = CHROMATIC_SCALE.indexOf(match)
    if (index === -1) {
      if (match === 'Db') index = 1
      else if (match === 'Eb') index = 3
      else if (match === 'Gb') index = 6
      else if (match === 'Ab') index = 8
      else if (match === 'Bb') index = 10
      else return match
    }
    let newIndex = (index + semitones) % 12
    if (newIndex < 0) newIndex += 12
    return CHROMATIC_SCALE[newIndex]
  })
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
    const savedRole = localStorage.getItem('bendy_user_role')
    if (savedRole === 'admin') {
      setRole('admin')
    } else {
      setRole('viewer')
    }
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
        key: data.key || 'Cm',
        audio_url: data.audio_url || '',
        sections: data.sections && data.sections.length > 0 ? data.sections : [
          { title: 'בית 1 🏠', bars: [{ chord: 'Cm' }, { chord: 'G#' }, { chord: 'D#' }, { chord: 'A#' }] }
        ]
      })
    }
    setLoading(false)
  }

  const handleTranspose = (semitones: number) => {
    if (!song) return
    const updatedSections = song.sections.map(sec => ({
      ...sec,
      bars: sec.bars.map(bar => ({
        ...bar,
        chord: transposeChord(bar.chord, semitones)
      }))
    }))
    const updatedKey = transposeChord(song.key, semitones)
    setSong({ ...song, key: updatedKey, sections: updatedSections })
  }

  const handleSave = async () => {
    if (!song) return
    setSaving(true)
    const { error } = await supabase
      .from('songs')
      .update({
        title: song.title,
        key: song.key,
        audio_url: song.audio_url,
        sections: song.sections
      })
      .eq('id', songId)

    if (error) {
      alert('שגיאה בשמירה: ' + error.message)
    } else {
      alert('השיר נשמר בהצלחה!')
      setIsEditing(false)
    }
    setSaving(false)
  }

  const updateSectionTitle = (sIdx: number, title: string) => {
    if (!song) return
    const newSections = [...song.sections]
    newSections[sIdx].title = title
    setSong({ ...song, sections: newSections })
  }

  const updateBarChord = (sIdx: number, bIdx: number, chord: string) => {
    if (!song) return
    const newSections = [...song.sections]
    newSections[sIdx].bars[bIdx].chord = chord
    setSong({ ...song, sections: newSections })
  }

  const addBar = (sIdx: number) => {
    if (!song) return
    const newSections = [...song.sections]
    newSections[sIdx].bars.push({ chord: 'C' })
    setSong({ ...song, sections: newSections })
  }

  const removeBar = (sIdx: number, bIdx: number) => {
    if (!song) return
    const newSections = [...song.sections]
    newSections[sIdx].bars = newSections[sIdx].bars.filter((_, idx) => idx !== bIdx)
    setSong({ ...song, sections: newSections })
  }

  const addSection = () => {
    if (!song) return
    const newSections = [
      ...song.sections,
      { title: `בית ${song.sections.length + 1}`, bars: [{ chord: 'C' }] }
    ]
    setSong({ ...song, sections: newSections })
  }

  if (loading) {
    return <div style={{ padding: '40px', color: '#00ff88', textAlign: 'center', backgroundColor: '#060d08', minHeight: '100vh', fontFamily: 'sans-serif' }}>טוען שיר...</div>
  }

  if (!song) {
    return <div style={{ padding: '40px', color: '#ff4d4d', textAlign: 'center', backgroundColor: '#060d08', minHeight: '100vh', fontFamily: 'sans-serif' }}>השיר לא נמצא</div>
  }

  return (
    <div style={{ backgroundColor: '#060d08', minHeight: '100vh', color: '#e0e0e0', fontFamily: 'sans-serif', direction: 'rtl', padding: '16px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto', boxSizing: 'border-box' }}>
        
        {/* סרגל עליון */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <button 
            onClick={() => router.push('/setlist')}
            style={{ background: 'transparent', border: 'none', color: '#00ff88', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
          >
            ➔ חזרה לסטליסט
          </button>

          {role === 'admin' && (
            <button 
              onClick={() => setIsEditing(!isEditing)}
              style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: isEditing ? '#ff9800' : '#00ff88', color: '#000', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
            >
              {isEditing ? 'סגור עריכה' : '✏️ ערוך שיר (אדמין)'}
            </button>
          )}
        </div>

        {/* כותרת השיר */}
        <div style={{ marginBottom: '20px' }}>
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input 
                type="text" 
                value={song.title} 
                onChange={(e) => setSong({ ...song, title: e.target.value })}
                style={{ background: '#0d1810', border: '1px solid #00ff88', color: '#00ff88', padding: '8px', borderRadius: '6px', fontSize: '20px', fontWeight: 'bold' }}
              />
              <input 
                type="text" 
                placeholder="קישור לשיר המקורי (Audio/YouTube URL)" 
                value={song.audio_url || ''} 
                onChange={(e) => setSong({ ...song, audio_url: e.target.value })}
                style={{ background: '#0d1810', border: '1px solid #1c3523', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '12px' }}
              />
            </div>
          ) : (
            <h1 style={{ fontSize: '24px', color: '#00ff88', margin: 0, fontWeight: 'bold' }}>{song.title}</h1>
          )}
        </div>

        {/* פאנל עריכה לאדמין בלבד (כולל מודולציה) */}
        {role === 'admin' && isEditing && (
          <div style={{ background: '#0d1810', padding: '12px', borderRadius: '10px', border: '1px solid #00ff88', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: '#fff' }}>סולם: <strong style={{ color: '#00ff88' }}>{song.key}</strong></span>
              
              {/* מודולציה - פתוחה לאדמין בעריכה בלבד */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#888' }}>מודולציה:</span>
                <button onClick={() => handleTranspose(-1)} style={{ background: '#1c3523', color: '#00ff88', border: 'none', borderRadius: '4px', width: '28px', height: '28px', fontWeight: 'bold', cursor: 'pointer' }}>-1</button>
                <button onClick={() => handleTranspose(1)} style={{ background: '#1c3523', color: '#00ff88', border: 'none', borderRadius: '4px', width: '28px', height: '28px', fontWeight: 'bold', cursor: 'pointer' }}>+1</button>
              </div>
            </div>

            <button 
              onClick={handleSave} 
              disabled={saving}
              style={{ width: '100%', padding: '10px', background: '#00ff88', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
            >
              {saving ? 'שומר...' : '💾 שמור שינויים'}
            </button>
          </div>
        )}

        {/* תצוגת הבתים והאקורדים */}
        {song.sections.map((sec, sIdx) => (
          <div key={sIdx} style={{ marginBottom: '20px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px' }}>
              {role === 'admin' && isEditing ? (
                <input 
                  type="text" 
                  value={sec.title} 
                  onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                  style={{ background: '#0d1810', border: '1px solid #00ff88', color: '#00ff88', padding: '4px 8px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', textAlign: 'right' }}
                />
              ) : (
                <span style={{ background: '#1c3523', color: '#00ff88', padding: '3px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}>
                  {sec.title}
                </span>
              )}
            </div>

            {/* סרגל התווים */}
            <div style={{ 
              background: '#0a140d', 
              borderRadius: '10px', 
              border: '1px solid #1c3523', 
              padding: '12px',
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 11px, #1a3322 12px)',
              backgroundSize: '100% 12px',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '10px',
              textAlign: 'center'
            }}>
              {sec.bars.map((bar, bIdx) => (
                <div key={bIdx} style={{ padding: '6px 0', position: 'relative' }}>
                  {role === 'admin' && isEditing ? (
                    <div>
                      <button 
                        onClick={() => removeBar(sIdx, bIdx)} 
                        style={{ position: 'absolute', top: '-4px', left: '0px', background: 'transparent', color: '#ff4d4d', border: 'none', cursor: 'pointer', fontSize: '10px' }}
                      >
                        ✕
                      </button>
                      <input 
                        type="text" 
                        value={bar.chord} 
                        onChange={(e) => updateBarChord(sIdx, bIdx, e.target.value)}
                        style={{ width: '100%', background: '#000', border: '1px solid #00ff88', color: '#00ff88', textAlign: 'center', fontWeight: 'bold', fontSize: '16px', borderRadius: '4px' }}
                      />
                    </div>
                  ) : (
                    <span style={{ color: '#00ff88', fontWeight: 'bold', fontSize: '20px', textShadow: '0 0 5px rgba(0,255,136,0.3)' }}>
                      {bar.chord}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {role === 'admin' && isEditing && (
              <button 
                onClick={() => addBar(sIdx)}
                style={{ marginTop: '6px', background: 'transparent', color: '#00ff88', border: '1px dashed #00ff88', borderRadius: '6px', width: '100%', padding: '6px', cursor: 'pointer', fontSize: '12px' }}
              >
                + הוסף תיבה
              </button>
            )}
          </div>
        ))}

        {role === 'admin' && isEditing && (
          <button 
            onClick={addSection}
            style={{ width: '100%', padding: '10px', background: '#1c3523', color: '#00ff88', border: '1px solid #00ff88', borderRadius: '8px', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold' }}
          >
            + הוסף בית / פזמון
          </button>
        )}

        {/* השמעת השיר המקורי */}
        {song.audio_url && (
          <div style={{ marginTop: '25px', textAlign: 'center' }}>
            <a 
              href={song.audio_url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', display: 'block', width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #1c3523', background: '#0d1810', color: '#ff9800', fontWeight: 'bold', fontSize: '14px', boxSizing: 'border-box' }}
            >
              🎧 השמעת השיר המקורי
            </a>
          </div>
        )}

      </div>
    </div>
  )
}