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

const CHROMATIC_SCALE = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

const transposeChord = (chord: string, semitones: number) => {
  if (semitones === 0) return chord
  const isMinor = chord.endsWith("m")
  const root = isMinor ? chord.slice(0, -1) : chord
  let index = CHROMATIC_SCALE.indexOf(root)
  if (index === -1) {
    if (root === 'Db') index = 1
    else if (root === 'Eb') index = 3
    else if (root === 'Gb') index = 6
    else if (root === 'Ab') index = 8
    else if (root === 'Bb') index = 10
    else return chord
  }
  let newIndex = (index + semitones + 12) % 12
  return CHROMATIC_SCALE[newIndex] + (isMinor ? "m" : "")
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
  const [currentShift, setCurrentShift] = useState(0)

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
        key: data.key || 'Am',
        audio_url: data.audio_url || '',
        sections: data.sections && data.sections.length > 0 ? data.sections : [
          { title: '🏠 בית', bars: [{ chord: 'Am' }, { chord: 'F' }, { chord: 'C' }, { chord: 'G' }] },
          { title: '🎤 פזמון', bars: [{ chord: 'F' }, { chord: 'G' }, { chord: 'Am' }, { chord: 'Em' }] }
        ]
      })
    }
    setLoading(false)
  }

  const changeSemitone = (direction: number) => {
    const newShift = currentShift + direction
    if (newShift < -4 || newShift > 4) return
    setCurrentShift(newShift)
  }

  const toggleStructureEdit = async () => {
    if (isEditing) {
      // שמירה בסיס נתונים בסיום עריכה
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

      setSaving(false)
      if (error) {
        alert('שגיאה בשמירה: ' + error.message)
      } else {
        setIsEditing(false)
        setCurrentShift(0)
      }
    } else {
      setIsEditing(true)
    }
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

  const removeSection = (sIdx: number) => {
    if (!song) return
    const newSections = song.sections.filter((_, idx) => idx !== sIdx)
    setSong({ ...song, sections: newSections })
  }

  const addNewPart = () => {
    if (!song) return
    const newSections = [
      ...song.sections,
      { title: '🎸 חלק חדש', bars: [{ chord: 'Am' }, { chord: 'Dm' }, { chord: 'E' }, { chord: 'Am' }] }
    ]
    setSong({ ...song, sections: newSections })
  }

  if (loading) {
    return <div style={{ padding: '40px', color: '#2ecc71', textAlign: 'center', backgroundColor: '#0d1310', minHeight: '100vh', fontFamily: 'sans-serif' }}>טוען שיר...</div>
  }

  if (!song) {
    return <div style={{ padding: '40px', color: '#e74c3c', textAlign: 'center', backgroundColor: '#0d1310', minHeight: '100vh', fontFamily: 'sans-serif' }}>השיר לא נמצא</div>
  }

  return (
    <div style={{ backgroundColor: '#0d1310', minHeight: '100vh', color: '#e8f5e9', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif', direction: 'rtl', padding: '15px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '450px', backgroundColor: '#111a15', borderRadius: '20px', padding: '20px', boxSizing: 'border-box' }}>
        
        {/* כפתור חזרה לסטליסט */}
        <button 
          onClick={() => router.push('/setlist')}
          style={{ background: 'transparent', border: 'none', color: '#2ecc71', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '15px', padding: 0 }}
        >
          ➔ חזרה לסטליסט
        </button>

        {/* כותרת השיר והסולם - בדיוק כמו בקובץ Jam-On */}
        <div style={{ borderBottom: '2px solid #16221c', paddingBottom: '15px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {isEditing ? (
              <input 
                type="text" 
                value={song.title} 
                onChange={(e) => setSong({ ...song, title: e.target.value })}
                style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2ecc71', background: '#0d1310', border: '1px solid #3498db', padding: '4px 8px', borderRadius: '6px', width: '60%' }}
              />
            ) : (
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#2ecc71' }}>{song.title}</div>
            )}
            <div style={{ fontSize: '0.9rem', color: '#a4b3a9' }}>
              סולם נוכחי: {transposeChord(song.key, currentShift)}
            </div>
          </div>

          {/* פקד שינוי סולם זמני */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#16221c', padding: '10px', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>שינוי סולם זמני (+/-):</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                onClick={() => changeSemitone(-1)}
                style={{ backgroundColor: '#0d1310', color: '#2ecc71', border: '1px solid #4f685a', width: '35px', height: '35px', borderRadius: '6px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}
              >
                -
              </button>
              <span style={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 'bold', minWidth: '60px', textAlign: 'center' }}>
                {currentShift === 0 ? 'מקור' : (currentShift > 0 ? `+${currentShift}` : currentShift)}
              </span>
              <button 
                onClick={() => changeSemitone(1)}
                style={{ backgroundColor: '#0d1310', color: '#2ecc71', border: '1px solid #4f685a', width: '35px', height: '35px', borderRadius: '6px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* רשימת הבתים והפזמונים */}
        <div>
          {song.sections.map((sec, sIdx) => (
            <div key={sIdx} style={{ marginBottom: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={sec.title} 
                    onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                    style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', backgroundColor: '#0d1310', border: '1px dashed #3498db', padding: '6px 12px', borderRadius: '6px' }}
                  />
                ) : (
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', backgroundColor: '#1c2d24', padding: '6px 12px', borderRadius: '6px' }}>
                    {sec.title}
                  </span>
                )}

                {isEditing && (
                  <button 
                    onClick={() => removeSection(sIdx)}
                    style={{ background: 'none', border: 'none', color: '#e74c3c', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    ❌ מחק חלק
                  </button>
                )}
              </div>

              {/* צוואר הגיטרה והאקורדים (Fretboard UI) */}
              <div style={{ backgroundColor: '#0d1310', border: '1px solid #22332a', borderRadius: '10px', padding: '20px 10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', fontFamily: "'Courier New', Courier, monospace", fontSize: '1.8rem', fontWeight: 'bold', color: '#2ecc71' }}>
                  {sec.bars.map((bar, bIdx) => (
                    <span key={bIdx} style={{ backgroundColor: isEditing ? '#1c2d24' : '#111a15', padding: '2px 10px', borderRadius: '4px', border: isEditing ? '1px dashed #3498db' : 'none', color: isEditing ? '#fff' : '#2ecc71' }}>
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={bar.chord} 
                          onChange={(e) => updateBarChord(sIdx, bIdx, e.target.value)}
                          style={{ background: 'transparent', border: 'none', color: '#fff', textAlign: 'center', width: '50px', fontSize: '1.6rem', fontWeight: 'bold' }}
                        />
                      ) : (
                        transposeChord(bar.chord, currentShift)
                      )}
                    </span>
                  ))}
                </div>

                {/* מיתרי גיטרה */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '5px 0', marginTop: '10px' }}>
                  <div style={{ height: '2px', backgroundColor: '#4f685a', width: '100%' }}></div>
                  <div style={{ height: '2px', backgroundColor: '#4f685a', width: '100%' }}></div>
                  <div style={{ height: '2px', backgroundColor: '#4f685a', width: '100%' }}></div>
                  <div style={{ height: '2px', backgroundColor: '#4f685a', width: '100%' }}></div>
                  <div style={{ height: '2px', backgroundColor: '#4f685a', width: '100%' }}></div>
                  <div style={{ height: '2px', backgroundColor: '#4f685a', width: '100%' }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* סרגל כפתורי אדמין - מתחת לשיר */}
        {role === 'admin' && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button 
              onClick={toggleStructureEdit}
              disabled={saving}
              style={{ 
                flex: 1, 
                backgroundColor: 'transparent', 
                padding: '12px', 
                borderRadius: '8px', 
                fontWeight: 'bold', 
                fontSize: '0.95rem', 
                cursor: 'pointer',
                color: isEditing ? '#2ecc71' : '#e8f5e9',
                border: isEditing ? '2px solid #2ecc71' : '1px solid #4f685a'
              }}
            >
              {saving ? 'שומר...' : (isEditing ? '💾 שמור סולם, כותרות ומבנה' : '⚙️ ערוך מבנה ואקורדים')}
            </button>

            {isEditing && (
              <button 
                onClick={addNewPart}
                style={{ flex: 1, backgroundColor: 'transparent', padding: '12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', color: '#3498db', border: '2px dashed #3498db' }}
              >
                ➕ הוסף חלק
              </button>
            )}
          </div>
        )}

        {/* השמעת השיר המקורי */}
        {song.audio_url && (
          <div style={{ marginTop: '25px', textAlign: 'center' }}>
            <a 
              href={song.audio_url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', display: 'block', width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #22332a', background: '#16221c', color: '#ff9800', fontWeight: 'bold', fontSize: '0.95rem', boxSizing: 'border-box' }}
            >
              🎧 השמעת השיר המקורי
            </a>
          </div>
        )}

      </div>
    </div>
  )
}