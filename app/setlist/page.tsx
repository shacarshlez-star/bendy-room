'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface Song {
  id: string;
  title: string;
  current_key?: string;
}

export default function SetlistPage() {
  const router = useRouter();
  const [songs, setSongs] = useState<Song[]>([]);
  const [showAddSong, setShowAddSong] = useState(false);
  const [newSongTitle, setNewSongTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSetlistData();
  }, []);

  const fetchSetlistData = async () => {
    setIsLoading(true);

    const { data: songsData } = await supabase
      .from('songs')
      .select('id, title, current_key')
      .order('created_at', { ascending: true });

    if (songsData) {
      setSongs(songsData);
    }

    setIsLoading(false);
  };

  const handleAddSong = async () => {
    if (!newSongTitle.trim()) return;

    const { error } = await supabase
      .from('songs')
      .insert([
        {
          title: newSongTitle,
          current_key: 'Am',
          parts: [
            { id: 'p1', title: 'בית 1', icon: '🏠', chordLines: [['Am', 'F', 'C', 'G']] },
            { id: 'p2', title: 'פזמון', icon: '🎤', chordLines: [['F', 'G', 'Am', 'Em']] }
          ]
        }
      ]);

    if (error) {
      alert('שגיאה בהוספת השיר: ' + error.message);
    } else {
      setNewSongTitle('');
      setShowAddSong(false);
      fetchSetlistData();
    }
  };

  return (
    <div style={{ backgroundColor: '#0d1310', color: '#e8f5e9', minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '15px', fontFamily: 'sans-serif', direction: 'rtl' }}>
      <div style={{ width: '100%', maxWidth: '500px', backgroundColor: '#111a15', borderRadius: '20px', padding: '20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* כותרת סטליסט */}
        <div style={{ borderBottom: '2px solid #16221c', paddingBottom: '12px' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#2ecc71', margin: 0 }}>🎸 סטליסט חזרה</h1>
        </div>

        {/* רשימת השירים */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 'bold', color: '#2ecc71', fontSize: '1.1rem' }}>שירים:</div>
            <button 
              onClick={() => setShowAddSong(!showAddSong)} 
              style={{ backgroundColor: '#27ae60', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              ➕ הוסף שיר
            </button>
          </div>

          {showAddSong && (
            <div style={{ backgroundColor: '#16221c', padding: '12px', borderRadius: '10px', border: '1px solid #27ae60', display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="שם השיר החדש..." 
                value={newSongTitle} 
                onChange={e => setNewSongTitle(e.target.value)} 
                style={{ flex: 1, backgroundColor: '#0d1310', border: '1px solid #22332a', color: '#fff', padding: '10px', borderRadius: '6px' }} 
              />
              <button 
                onClick={handleAddSong} 
                style={{ backgroundColor: '#27ae60', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                הוסף
              </button>
            </div>
          )}

          {isLoading ? (
            <div style={{ color: '#a4b3a9', textAlign: 'center', padding: '20px' }}>טוען שירים...</div>
          ) : songs.length === 0 ? (
            <div style={{ color: '#a4b3a9', textAlign: 'center', padding: '30px', backgroundColor: '#16221c', borderRadius: '12px' }}>הסטליסט ריק. לחץ על "הוסף שיר" כדי להתחיל.</div>
          ) : (
            songs.map((song, index) => (
              <div 
                key={song.id}
                onClick={() => router.push(`/song/${song.id}`)}
                style={{
                  backgroundColor: '#16221c',
                  padding: '16px',
                  borderRadius: '12px',
                  borderRight: '4px solid #2ecc71',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.15rem' }}>{index + 1}. {song.title}</div>
                  <div style={{ fontSize: '0.85rem', color: '#a4b3a9', marginTop: '4px' }}>סולם: <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>{song.current_key || 'Am'}</span></div>
                </div>
                <div style={{ color: '#2ecc71', fontSize: '1.3rem' }}>➔</div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}