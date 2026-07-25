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
  sections: Section[]
}

// לוגיקת טרנספוזיציה (שינוי סולם)
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
        sections: data.sections && data.sections.length > 0 ? data.sections : [
          { title: 'בית 1 🏠', bars: [{ chord: 'Cm' }, { chord: 'G#' }, { chord: 'D#' }, { chord: 'A#' }, { chord: 'C' }, { chord: 'G' }, { chord: 'Am' }, { chord: 'F' }] },
          { title: 'פזמון 🎤', bars: [{ chord: 'G#' }, { chord: 'A#' }, { chord: 'Cm' }, { chord: 'Gm' }] }
        ]
      })
    }
    setLoading(false)
  }

  // הפעלת מודולציית סולם (+1 / -1)
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
        sections: song.sections
      })
      .eq('id', songId)

    if (error) {
      alert('שגיאה בשמירה: ' + error.message)
    } else {
      alert('השיר עודכן ונשמר בהצלחה!')
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
              style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: isEditing ? '#ff9800' : '#00ff88', color: '#000', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
            >
              {isEditing ? 'סגור עריכה' : '✏️ ערוך שיר (אדמין)'}
            </button>
          )}
        </div>

        {/* כותרת, סולם ומודולציה (Transpose) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '22px', color: '#00ff88', margin: 0, fontWeight: 'bold' }}>{song.title}</h1>
            <span style={{ fontSize: '13px', color: '#888' }}>סולם נוכחי: <strong style={{ color: '#00ff88' }}>{song.key}</strong></span>
          </div>

          {/* כפתורי מודולציה / טרנספוזיציה בצד שמאל למעלה */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#0d1810', padding: '4px 8px', borderRadius: '8px', border: '1px solid #1c3523' }}>
            <span style={{ fontSize: '11px', color: '#888' }}>סולם:</span>
            <button onClick={() => handleTranspose(-1)} style={{ background: '#1c3523', color: '#00ff88', border: 'none', borderRadius: '4px', width: '26px', height: '26px', fontWeight: 'bold', cursor: 'pointer' }}>-1</button>
            <button onClick={() => handleTranspose(1)} style={{ background: '#1c3523', color: '#00ff88', border: 'none', borderRadius: '4px', width: '26px', height: '26px', fontWeight: 'bold', cursor: 'pointer' }}>+1</button>
          </div>
        </div>

        {/* פאנל שמירה לאדמין */}
        {isEditing && (
          <div style={{ background: '#0d1810', padding: '12px', borderRadius: '10px', border: '1px solid #00ff88', marginBottom: '16px' }}>
            <button 
              onClick={handleSave} 
              disabled={saving}
              style={{ width: '100%', padding: '10px', background: '#00ff88', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
            >
              {saving ? 'שומר...' : '💾 שמור שינויים ואקורדים'}
            </button>
          </div>
        )}

        {/* תצוגת הבתים והאקורדים */}
        {song.sections.map((sec, sIdx) => (
          <div key={sIdx} style={{ marginBottom: '20px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px' }}>
              {isEditing ? (
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
                <div key={bIdx} style={{ padding: '6px 0' }}>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={bar.chord} 
                      onChange={(e) => updateBarChord(sIdx, bIdx, e.target.value)}
                      style={{ width: '100%', background: '#000', border: '1px solid #00ff88', color: '#00ff88', textAlign: 'center', fontWeight: 'bold', fontSize: '16px', borderRadius: '4px' }}
                    />
                  ) : (
                    <span style={{ color: '#00ff88', fontWeight: 'bold', fontSize: '20px', textShadow: '0 0 5px rgba(0,255,136,0.3)' }}>
                      {bar.chord}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {isEditing && (
              <button 
                onClick={() => addBar(sIdx)}
                style={{ marginTop: '6px', background: 'transparent', color: '#00ff88', border: '1px dashed #00ff88', borderRadius: '6px', width: '100%', padding: '6px', cursor: 'pointer', fontSize: '12px' }}
              >
                + הוסף תיבה
              </button>
            )}
          </div>
        ))}

        {isEditing && (
          <button 
            onClick={addSection}
            style={{ width: '100%', padding: '10px', background: '#1c3523', color: '#00ff88', border: '1px solid #00ff88', borderRadius: '8px', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold' }}
          >
            + הוסף בית / פזמון جديد
          </button>
        )}

      </div>
    </div>
  )
}