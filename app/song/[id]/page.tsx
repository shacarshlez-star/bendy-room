'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { transposeChord } from '../../../utils/chordUtils';

export default function SongPage() {
  const router = useRouter();
  const params = useParams();
  const songId = params?.id as string;

  const [isAdmin, setIsAdmin] = useState(false);
  const [songTitle, setSongTitle] = useState('טוען שיר...');
  const [currentKey, setCurrentKey] = useState('Am');
  const [transpose, setTranspose] = useState(0);
  const [songLink, setSongLink] = useState('');

  const [parts, setParts] = useState([
    { id: 'p1', title: 'בית 1', icon: '🏠', chordLines: [['Am', 'F', 'C', 'G']] },
    { id: 'p2', title: 'פזמון', icon: '🎤', chordLines: [['F', 'G', 'Am', 'Em']] }
  ]);

  const [isAdminEditing, setIsAdminEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newPartTitle, setNewPartTitle] = useState('');
  const [showAddPartInput, setShowAddPartInput] = useState(false);

  useEffect(() => {
    const savedRole = localStorage.getItem('bendy_role');
    if (savedRole === 'admin') setIsAdmin(true);

    if (songId) fetchSongData();
  }, [songId]);

  const fetchSongData = async () => {
    setIsLoading(true);

    const { data: songData } = await supabase
      .from('songs')
      .select('*')
      .eq('id', songId)
      .single();

    if (songData) {
      if (songData.title) setSongTitle(songData.title);
      if (songData.current_key) setCurrentKey(songData.current_key);
      if (songData.media_link) setSongLink(songData.media_link);
      if (songData.parts && Array.isArray(songData.parts) && songData.parts.length > 0) {
        setParts(songData.parts);
      }
    }

    setIsLoading(false);
  };

  const addNewPart = () => {
    if (!newPartTitle) return;
    setParts([...parts, { id: Date.now().toString(), title: newPartTitle, icon: '🎵', chordLines: [['Am', 'Dm', 'G', 'C']] }]);
    setNewPartTitle('');
    setShowAddPartInput(false);
  };

  const addChordLineToPart = (partId: string) => {
    setParts(parts.map(p => p.id === partId ? { ...p, chordLines: [...p.chordLines, ['C', 'G', 'Am', 'F']] } : p));
  };

  const updateChord = (partId: string, lineIdx: number, chordIdx: number, val: string) => {
    setParts(parts.map(p => {
      if (p.id === partId) {
        const newLines = [...p.chordLines];
        newLines[lineIdx][chordIdx] = val;
        return { ...p, chordLines: newLines };
      }
      return p;
    }));
  };

  const handleSaveStructure = async () => {
    let finalKey = currentKey;
    let finalParts = parts;

    // עדכון אקורדים וסולם במידה ונעשה שינוי טרנספוזיציה (+/-)
    if (transpose !== 0) {
      finalKey = transposeChord(currentKey, transpose);
      finalParts = parts.map(p => ({
        ...p,
        chordLines: p.chordLines.map(line => line.map(chord => transposeChord(chord, transpose)))
      }));

      setCurrentKey(finalKey);
      setParts(finalParts);
      setTranspose(0);
    }

    const { error } = await supabase
      .from('songs')
      .update({
        title: songTitle,
        current_key: finalKey,
        media_link: songLink,
        parts: finalParts
      })
      .eq('id', songId);

    if (error) {
      alert('שגיאה בשמירה ל-DB: ' + error.message);
    } else {
      setIsAdminEditing(false);
      alert('השיר נשמר בהצלחה ב-DB!');
    }
  };

  return (
    <div style={{ backgroundColor: '#0a120d', color: '#e8f5e9', minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '15px', fontFamily: 'sans-serif', direction: 'rtl' }}>
      <div style={{ width: '100%', maxWidth: '450px', backgroundColor: '#0e1812', borderRadius: '20px', padding: '20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid #16281e' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => router.push('/setlist')} style={{ background: 'none', border: 'none', color: '#a4b3a9', cursor: 'pointer', fontSize: '0.9rem' }}>
            ➔ חזרה לסטליסט
          </button>
        </div>

        {/* כותרת וסולם */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {isAdminEditing ? (
            <input type="text" value={songTitle} onChange={e => setSongTitle(e.target.value)} style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2ecc71', backgroundColor: '#16281e', border: '1px solid #2ecc71', padding: '4px 8px', borderRadius: '6px', width: '60%' }} />
          ) : (
            <div style={{ fontSize: '1.7rem', fontWeight: 'bold', color: '#2ecc71' }}>{songTitle}</div>
          )}
          <div style={{ fontSize: '0.95rem', color: '#a4b3a9' }}>
            סולם: <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>{currentKey}</span>
          </div>
        </div>

        {/* בקרת טרנספוזיציה (העלאה בטון / הורדה בחצי טון) */}
        {isAdmin && isAdminEditing && (
          <div style={{ backgroundColor: '#132219', padding: '12px 15px', borderRadius: '12px', border: '1px solid #2ecc71', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#2ecc71' }}>שינוי סולם לשיר (+/-):</span>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button onClick={() => setTranspose(t => t - 1)} style={{ backgroundColor: '#1c3325', color: '#2ecc71', border: '1px solid #2ecc71', width: '36px', height: '36px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.3rem' }}>-</button>
              <span style={{ fontWeight: 'bold', color: '#2ecc71', minWidth: '30px', textAlign: 'center', fontSize: '1.1rem' }}>{transpose > 0 ? `+${transpose}` : transpose}</span>
              <button onClick={() => setTranspose(t => t + 1)} style={{ backgroundColor: '#1c3325', color: '#2ecc71', border: '1px solid #2ecc71', width: '36px', height: '36px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.3rem' }}>+</button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: 'center', color: '#a4b3a9', padding: '20px' }}>טוען שיר...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            {parts.map((part) => (
              <div key={part.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ backgroundColor: '#183626', color: '#ffffff', padding: '6px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span>{part.icon}</span>
                  <span>{part.title}</span>
                </div>

                <div style={{ width: '100%', backgroundColor: '#111f17', border: '1px solid #1b3325', borderRadius: '14px', padding: '20px 15px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {part.chordLines.map((line, lineIdx) => (
                    <div key={lineIdx} style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '10px 0', direction: 'ltr' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', opacity: 0.25, pointerEvents: 'none' }}>
                        <div style={{ height: '1px', backgroundColor: '#a4b3a9' }} />
                        <div style={{ height: '1px', backgroundColor: '#a4b3a9' }} />
                        <div style={{ height: '1px', backgroundColor: '#a4b3a9' }} />
                        <div style={{ height: '1px', backgroundColor: '#a4b3a9' }} />
                        <div style={{ height: '1px', backgroundColor: '#a4b3a9' }} />
                      </div>

                      {line.map((chord, cIdx) => (
                        <div key={cIdx} style={{ zIndex: 2 }}>
                          {isAdmin && isAdminEditing ? (
                            <input type="text" value={transposeChord(chord, transpose)} onChange={e => updateChord(part.id, lineIdx, cIdx, e.target.value)} style={{ backgroundColor: '#183626', color: '#2ecc71', border: '1px solid #2ecc71', fontWeight: 'bold', fontSize: '1.2rem', textAlign: 'center', width: '55px', padding: '6px', borderRadius: '8px' }} />
                          ) : (
                            <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#2ecc71', fontFamily: 'monospace', textShadow: '0 0 10px rgba(46,204,113,0.3)' }}>{transposeChord(chord, transpose)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}

                  {isAdmin && isAdminEditing && (
                    <button onClick={() => addChordLineToPart(part.id)} style={{ backgroundColor: '#183626', color: '#2ecc71', border: '1px dashed #2ecc71', padding: '8px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' }}>
                      ➕ הוסף שורת אקורדים ל{part.title}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* הוספת חלק לשיר */}
        {isAdmin && isAdminEditing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {!showAddPartInput ? (
              <button onClick={() => setShowAddPartInput(true)} style={{ backgroundColor: '#183626', color: '#3498db', border: '1px dashed #3498db', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>➕ הוסף חלק חדש</button>
            ) : (
              <div style={{ backgroundColor: '#16281e', padding: '12px', borderRadius: '10px', border: '1px solid #3498db', display: 'flex', gap: '8px' }}>
                <input type="text" placeholder="שם החלק..." value={newPartTitle} onChange={e => setNewPartTitle(e.target.value)} style={{ flex: 1, backgroundColor: '#0d1310', border: '1px solid #22332a', color: '#fff', padding: '8px', borderRadius: '6px' }} />
                <button onClick={addNewPart} style={{ backgroundColor: '#3498db', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>הוסף</button>
              </div>
            )}
          </div>
        )}

        {/* לינק לשיר */}
        {isAdmin && isAdminEditing && (
          <div style={{ backgroundColor: '#132219', padding: '12px', borderRadius: '10px', border: '1px solid #e67e22', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.85rem', color: '#e67e22', fontWeight: 'bold' }}>🔗 קישור לשיר (YouTube / Spotify):</span>
            <input type="text" placeholder="הדבק לינק..." value={songLink} onChange={e => setSongLink(e.target.value)} style={{ backgroundColor: '#0d1310', border: '1px solid #22332a', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.9rem', direction: 'ltr' }} />
          </div>
        )}

        {/* כפתור עריכה ושמירה ל-DB */}
        {isAdmin && (
          <button 
            onClick={() => isAdminEditing ? handleSaveStructure() : setIsAdminEditing(true)}
            style={{ backgroundColor: isAdminEditing ? '#27ae60' : '#132219', color: '#fff', border: '1px solid #2ecc71', padding: '14px', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}
          >
            ⚙️ {isAdminEditing ? 'שמור שיר ל-DB' : 'ערוך מבנה ואקורדים'}
          </button>
        )}

        {!isAdminEditing && songLink && (
          <div style={{ borderTop: '1px solid #16281e', paddingTop: '15px', textAlign: 'center' }}>
            <a href={songLink} target="_blank" rel="noopener noreferrer" style={{ display: 'block', backgroundColor: '#16281e', color: '#e67e22', border: '1px solid #e67e22', padding: '12px', borderRadius: '10px', fontWeight: 'bold', textDecoration: 'none' }}>
              🎧 השמעת השיר המקורי
            </a>
          </div>
        )}

      </div>
    </div>
  );
}