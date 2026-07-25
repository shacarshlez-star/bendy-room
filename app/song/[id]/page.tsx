'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Bar {
  chord: string
  lyrics?: string
}

interface Section {
  title: string
  bars: Bar[]
}

interface SongData {
  id?: string
  title: string
  artist?: string
  key: string
  bpm?: number
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
        key: data.key || 'Cm',
        bpm: data.bpm || 120,
        sections: data.sections && data.sections.length > 0 ? data.sections : [
          { title: 'בית 1 🏠', bars: [{ chord: 'Cm' }, { chord: 'G#' }, { chord: 'D#' }, { chord: 'A#' }, { chord: 'C' }, { chord: 'G' }, { chord: 'Am' }, { chord: 'F' }] },
          { title: 'פזמון 🎤', bars: [{ chord: 'G#' }, { chord: 'A#' }, { chord: 'Cm' }, { chord: 'Gm' }] },
          { title: 'בדיקה 🎼', bars: [{ chord: 'Am' }, { chord: 'Dm' }, { chord: 'G' }, { chord: 'C' }] }
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
        key: song.key,
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

  if (loading) {
    return <div style={{ padding: '40px', color: '#00ff88', textAlign: 'center', backgroundColor: '#060d08', minHeight: '100vh', fontFamily: 'sans-serif' }}>טוען שיר...</div>
  }

  if (!song) {
    return <div style={{ padding: '40px', color: '#ff4d4d', textAlign: 'center', backgroundColor: '#060d08', minHeight: '100vh', fontFamily: 'sans-serif' }}>השיר לא נמצא</div>
  }

  return (
    <div style={{ backgroundColor: '#060d08', minHeight: '100vh', color: '#e0e0e0', fontFamily: 'sans-serif', direction: 'rtl', padding: '20px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '450px', margin: '0 auto', boxSizing: 'border-box' }}>
        
        {/* סרגל עליון */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button 
            onClick={() => router.push('/setlist')}
            style={{ background: 'transparent', border: 'none', color: '#00ff88', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' }}
          >
            ➔ חזרה לסטליסט
          </button>

          {role === 'admin' && (
            <button 
              onClick={() => setIsEditing(!isEditing)}
              style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: isEditing ? '#ff9800' : '#00ff88', color: '#000', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
            >
              {isEditing ? 'סגור עריכה' : '✏️ ערוך אקורדים'}
            </button>
          )}
        </div>

        {/* כותרת השיר והסולם */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <h1 style={{ fontSize: '26px', color: '#00ff88', margin: 0, fontWeight: 'bold' }}>{song.title}</h1>
          <span style={{ fontSize: '15px', color: '#00ff88', background: '#0d1810', padding: '6px 12px', borderRadius: '8px', border: '1px solid #1c3523' }}>
            סולם: {song.key}
          </span>
        </div>

        {/* חלק עריכת מנהל */}
        {isEditing && (
          <div style={{ background: '#0d1810', padding: '15px', borderRadius: '12px', border: '1px solid #00ff88', marginBottom: '20px' }}>
            <button 
              onClick={handleSave} 
              disabled={saving}
              style={{ width: '100%', padding: '12px', background: '#00ff88', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}
            >
              {saving ? 'שומר...' : '💾 שמור אקורדים מעודכנים'}
            </button>
          </div>
        )}

        {/* תצוגת סרגל התווים הירוק המקורי מהסרטון */}
        {song.sections.map((sec, sIdx) => (
          <div key={sIdx} style={{ marginBottom: '25px' }}>
            
            {/* כותרת החלק (בית / פזמון) */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <span style={{ background: '#1c3523', color: '#00ff88', padding: '4px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                {sec.title}
              </span>
            </div>

            {/* סרגל התווים */}
            <div style={{ 
              background: '#0a140d', 
              borderRadius: '12px', 
              border: '1px solid #1c3523', 
              padding: '15px',
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 11px, #1a3322 12px)',
              backgroundSize: '100% 12px',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              textAlign: 'center'
            }}>
              {sec.bars.map((bar, bIdx) => (
                <div key={bIdx} style={{ padding: '8px 0' }}>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={bar.chord} 
                      onChange={(e) => updateBarChord(sIdx, bIdx, e.target.value)}
                      style={{ width: '100%', background: '#000', border: '1px solid #00ff88', color: '#00ff88', textAlign: 'center', fontWeight: 'bold', fontSize: '18px', borderRadius: '6px' }}
                    />
                  ) : (
                    <span style={{ color: '#00ff88', fontWeight: 'bold', fontSize: '22px', textShadow: '0 0 5px rgba(0,255,136,0.3)' }}>
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

        {/* כפתור השמעת השיר המקורי בתחתית */}
        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <button style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #1c3523', background: '#0d1810', color: '#ff9800', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>
            🎧 השמעת השיר המקורי
          </button>
        </div>

      </div>
    </div>
  )
}