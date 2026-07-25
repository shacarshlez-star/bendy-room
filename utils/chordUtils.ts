// רשימות התווים לחישוב המרחקים בין חצאי הטונים
const SHARPS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLATS = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

// פונקציה שמחשבת שינוי של אקורד בודד
export function transposeChord(chord: string, semitones: number): string {
    if (semitones === 0 || !chord) return chord;

    let root = chord;
    let extension = "";

    // הפרדה בין תו הבסיס לתוספות (למשל Am -> ה-A זה הבסיס, ה-m זה התוספת)
    if (chord.length > 1 && chord[1] !== '#' && chord[1] !== 'b') {
        root = chord.slice(0, 1);
        extension = chord.slice(1);
    } else if (chord.length > 2 && (chord[1] === '#' || chord[1] === 'b')) {
        root = chord.slice(0, 2);
        extension = chord.slice(2);
    }

    // מציאת המיקום הנוכחי של האקורד
    let index = SHARPS.indexOf(root);
    if (index === -1) {
        index = FLATS.indexOf(root);
    }

    if (index === -1) return chord;

    // חישוב המיקום החדש לפי מספר חצאי הטונים שביקשנו
    let newIndex = (index + semitones + 12) % 12;

    // חיבור מחדש של התו החדש עם התוספת המקורית שלו
    return SHARPS[newIndex] + extension;
}

// פונקציה שמשנה את כל האקורדים בשיר בבת אחת
export function transposeSongStructure(structure: any[], semitones: number): any[] {
    if (semitones === 0) return structure;

    return structure.map(part => ({
        title: part.title,
        chords: part.chords.map((chord: string) => transposeChord(chord, semitones))
    }));
}