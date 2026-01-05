// frontend/components/VerseDisplay.jsx
import { useState } from 'react';
import axios from 'axios';

export default function VerseDisplay() {
  const [verseText, setVerseText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/verse', {
        religion: 'Christianity',
        book: 'John',
        chapter: 3,
        verse: 16,
        version: 'NIV' // switch to KJV to get local
      });
      setVerseText(res.data.text);
    } catch (err) {
      console.error(err);
      setVerseText('Error fetching verse');
    }
    setLoading(false);
  };

  return (
    <div className="p-4 rounded-xl bg-gray-100 shadow-md">
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
        onClick={handleFetch}
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Fetch Verse'}
      </button>
      {verseText && (
        <p className="mt-4 text-lg italic">"{verseText}"</p>
      )}
    </div>
  );
}
