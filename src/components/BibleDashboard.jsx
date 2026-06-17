import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { useAuth } from "@/context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

const oldTestament = [
  "Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth",
  "1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra",
  "Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon",
  "Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos",
  "Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi"
];

const newTestament = [
  "Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians",
  "Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians",
  "1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter",
  "1 John","2 John","3 John","Jude","Revelation"
];

export default function BibleDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [bibleData, setBibleData] = useState({});
  const [bookKeys, setBookKeys] = useState([]);
  const [selectedBookKey, setSelectedBookKey] = useState('');
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(null);
  const [verses, setVerses] = useState([]);
  const [viewLevel, setViewLevel] = useState('books');
  const [searchInput, setSearchInput] = useState('');
  const [highlightedVerseIndex, setHighlightedVerseIndex] = useState(null);
  const [searchError, setSearchError] = useState('');

  // Load offline Bible JSON
  useEffect(() => {
    const fetchBibleData = async () => {
      try {
        const res = await fetch('/data/kjv.json');
        const data = await res.json();
        setBibleData(data);
        setBookKeys(Object.keys(data));
      } catch (err) {
        console.error('📦 Failed to load Bible data:', err);
      }
    };
    fetchBibleData();
  }, []);
  const openVerseReference = (reference) => {
    if (!reference || !bibleData || !bookKeys.length)
      return false;

    const match = reference.match(
      /^(.+?)\s+(\d+):(\d+)$/
    );

    if (!match)
      return false;

    const [, bookNameRaw, chapterNum, verseNum] = match;

    const normalizedBook = bookNameRaw
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();

    const bookKey = bookKeys.find(
      (key) =>
        bibleData[key]?.book
          .toLowerCase()
          .replace(/\s+/g, " ") === normalizedBook
    );

    if (!bookKey)
      return false;

    const chapterIndex = parseInt(chapterNum, 10) - 1;
    const verseIndex = parseInt(verseNum, 10) - 1;

    const versesArray =
      bibleData[bookKey]?.chapters?.[chapterIndex]?.verses || [];

    if (!versesArray.length)
      return false;

    setSelectedBookKey(bookKey);
    setSelectedChapterIndex(chapterIndex);
    setVerses(versesArray);
    setViewLevel("verses");
    setHighlightedVerseIndex(verseIndex);

    setTimeout(() => {
      document
        .getElementById(`verse-${verseIndex}`)
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 300);

    return true;
  };

  const handleSearch = () => {
    if (!searchInput.trim()) return;

    setSearchError("");

    const success = openVerseReference(searchInput.trim());

    if (!success) {
      setSearchError(
        "❌ Verse not found. Example: John 3:16"
      );
    }
  };
  
  useEffect(() => {
    if (!bookKeys.length) return;

    const params = new URLSearchParams(location.search);

    const verse = params.get("verse");

    if (verse) {
      openVerseReference(decodeURIComponent(verse));
    }
  }, [location.search, bookKeys]);

  const askAI = () => {
    if (!searchInput.trim()) return;
    // Send the searchInput to RevelaAI endpoint
    fetch(`${import.meta.env.VITE_REVELAAI_URL}/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: searchInput }),
    })
      .then((res) => res.json())
      .then((data) => {
        alert(`🤖 RevelaAI says:\n${data.data?.content || JSON.stringify(data)}`);
      })
      .catch((err) => console.error('❌ AI request failed:', err));
  };

  const handleBookClick = (key) => {
    setSelectedBookKey(key);
    setSelectedChapterIndex(null);
    setVerses([]);
    setViewLevel('chapters');
    setHighlightedVerseIndex(null);
  };

  const handleChapterClick = (index) => {
    setSelectedChapterIndex(index);
    setVerses(bibleData[selectedBookKey].chapters[index].verses);
    setViewLevel('verses');
    setHighlightedVerseIndex(null);
  };

  const handleBack = () => {
    if (viewLevel === 'verses') setViewLevel('chapters');
    else if (viewLevel === 'chapters') setViewLevel('books');
  };

  const selectedBook = bibleData[selectedBookKey];
  const oldBooks = bookKeys
    .filter((key) => oldTestament.includes(bibleData[key]?.book))
    .sort((a, b) => oldTestament.indexOf(bibleData[a].book) - oldTestament.indexOf(bibleData[b].book));
  const newBooks = bookKeys
    .filter((key) => newTestament.includes(bibleData[key]?.book))
    .sort((a, b) => newTestament.indexOf(bibleData[a].book) - newTestament.indexOf(bibleData[b].book));

  return (
    <div className="p-4 space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="🔍 e.g. John 3:16 or Genesis 1:1"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 p-2 border rounded dark:bg-black-800 dark:text-white"
        />
        <button
          onClick={handleSearch}
          disabled={!searchInput.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Search
        </button>
        <button
          onClick={askAI}
          disabled={!searchInput.trim()}
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Ask RevelaAI
        </button>
      </div>

      {searchError && <p className="text-sm text-red-500">{searchError}</p>}
      {viewLevel !== 'books' && (
        <button onClick={handleBack} className="text-blue-500 underline text-sm">← Back</button>
      )}

      {/* Books */}
      {viewLevel === 'books' && (
        <ScrollArea className="h-[70vh] space-y-4">
          <h2 className="font-bold">📖 Bible Books</h2>
          <div>
            <h3 className="text-sm font-bold">📜 Old Testament</h3>
            <ul className="space-y-1">
              {oldBooks.map((key) => (
                <li key={key} onClick={() => handleBookClick(key)}
                  className={`cursor-pointer p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-800 ${
                    selectedBookKey === key ? 'bg-blue-200 dark:bg-blue-700 font-semibold' : ''
                  }`}>
                  {bibleData[key]?.book}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold mt-4">✝️ New Testament</h3>
            <ul className="space-y-1">
              {newBooks.map((key) => (
                <li key={key} onClick={() => handleBookClick(key)}
                  className={`cursor-pointer p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-800 ${
                    selectedBookKey === key ? 'bg-blue-200 dark:bg-blue-700 font-semibold' : ''
                  }`}>
                  {bibleData[key]?.book}
                </li>
              ))}
            </ul>
          </div>
        </ScrollArea>
      )}

      {/* Chapters */}
      {viewLevel === 'chapters' && selectedBook && (
        <div>
          <h3 className="text-lg font-bold mb-2">📘 {selectedBook.book}</h3>
          <div className="flex flex-wrap gap-2">
            {selectedBook.chapters.map((chapter, idx) => (
              <button key={idx} onClick={() => handleChapterClick(idx)}
                className={`px-3 py-1 rounded ${
                  selectedChapterIndex === idx ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
                }`}>
                {chapter.chapter}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Verses */}
      {viewLevel === 'verses' && selectedBook && (
        <Card>
          <CardContent className="max-h-[60vh] overflow-y-auto space-y-2">
            <h4 className="font-semibold mb-2">{selectedBook.book} {selectedBook.chapters[selectedChapterIndex].chapter}</h4>
            {verses.map((v, idx) => (
              <div key={idx} id={`verse-${idx}`}
                className={`p-1 rounded text-sm ${
                  highlightedVerseIndex === idx ? 'bg-yellow-200 dark:bg-yellow-600' : ''
                }`}>
                <strong>{v.verse}</strong>. {v.text}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
