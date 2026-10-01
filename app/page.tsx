// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Flashcard from '@/components/Flashcard';
import AddFlashcardForm from '@/components/AddFlashcardForm';
import StudyMode from '@/components/StudyMode';

interface Folder {
  id: string;
  name: string;
}

interface FlashcardData {
  id: string;
  question: string;
  answer: string;
  folder_id?: string;
}

export default function Home() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [cards, setCards] = useState<FlashcardData[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'study' | 'grid'>('study');

  // Kunin ang lahat ng Folders at Flashcards mula sa Supabase
  const fetchData = async () => {
    setLoading(true);

    const { data: foldersData } = await supabase.from('folders').select('*').order('created_at', { ascending: true });
    const { data: cardsData } = await supabase.from('flashcards').select('*').order('created_at', { ascending: false });

    setFolders(foldersData || []);
    setCards(cardsData || []);

    // Kung bagong gawa ang unang folder at naka-'all' pa, pwede itong i-set
    if (foldersData && foldersData.length > 0 && selectedFolderId === 'all') {
      // Retain 'all' or select first folder
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter cards ayon sa napiling folder
  const filteredCards =
    selectedFolderId === 'all'
      ? cards
      : cards.filter((card) => card.folder_id === selectedFolderId);

  // Function para magbura ng folder
  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    if (confirm(`Sigurado ka bang gusto mong burahin ang folder na "${folderName}"? Mabubura rin ang lahat ng cards sa loob nito.`)) {
      await supabase.from('folders').delete().eq('id', folderId);
      setSelectedFolderId('all');
      fetchData();
    }
  };

  return (
    <main style={mainContainerStyle}>
      <h1>⚡ DLFlashcards</h1>

      {/* Form para sa Folder Creation & Flashcard Addition */}
      <AddFlashcardForm
        folders={folders}
        selectedFolderId={selectedFolderId === 'all' ? (folders[0]?.id || '') : selectedFolderId}
        onRefresh={fetchData}
      />

      <hr style={{ margin: '24px 0', borderColor: '#e2e8f0' }} />

      {/* 📁 FOLDER SELECTOR TABS */}
      <div style={{ marginBottom: '20px' }}>
        <span style={folderLabelStyle}>📁 Pumili ng Subject / Folder:</span>
        <div style={folderContainerStyle}>
          <button
            onClick={() => setSelectedFolderId('all')}
            style={{
              ...folderTabStyle,
              backgroundColor: selectedFolderId === 'all' ? '#0f172a' : '#f1f5f9',
              color: selectedFolderId === 'all' ? '#ffffff' : '#334155',
            }}
          >
            🌐 All Subjects ({cards.length})
          </button>

          {folders.map((folder) => {
            const count = cards.filter((c) => c.folder_id === folder.id).length;
            const isSelected = selectedFolderId === folder.id;

            return (
              <div key={folder.id} style={{ display: 'inline-flex', alignItems: 'center' }}>
                <button
                  onClick={() => setSelectedFolderId(folder.id)}
                  style={{
                    ...folderTabStyle,
                    backgroundColor: isSelected ? '#0f172a' : '#f1f5f9',
                    color: isSelected ? '#ffffff' : '#334155',
                  }}
                >
                  📂 {folder.name} ({count})
                </button>
                {isSelected && (
                  <button
                    onClick={() => handleDeleteFolder(folder.id, folder.name)}
                    style={deleteFolderBtnStyle}
                    title="Delete Folder"
                  >
                    🗑️
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* View Switcher Buttons */}
      <div style={tabContainerStyle}>
        <button
          onClick={() => setMode('study')}
          style={{
            ...tabButtonStyle,
            backgroundColor: mode === 'study' ? '#2563eb' : '#e2e8f0',
            color: mode === 'study' ? '#ffffff' : '#334155',
          }}
        >
          🎯 Study Mode
        </button>
        <button
          onClick={() => setMode('grid')}
          style={{
            ...tabButtonStyle,
            backgroundColor: mode === 'grid' ? '#2563eb' : '#e2e8f0',
            color: mode === 'grid' ? '#ffffff' : '#334155',
          }}
        >
          📋 View All ({filteredCards.length})
        </button>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <p>Loading data...</p>
      ) : folders.length === 0 ? (
        <p>Wala pang folder. Gumawa muna ng folder sa taas!</p>
      ) : filteredCards.length === 0 ? (
        <p>Wala pang flashcards sa folder na ito. Magdagdag gamit ang form sa taas!</p>
      ) : mode === 'study' ? (
        <StudyMode cards={filteredCards} onRefresh={fetchData} />
      ) : (
        <div style={gridContainerStyle}>
          {filteredCards.map((card) => (
            <Flashcard
              key={card.id}
              id={card.id}
              question={card.question}
              answer={card.answer}
              onRefresh={fetchData}
            />
          ))}
        </div>
      )}
    </main>
  );
}

// Inline Styles
const mainContainerStyle: React.CSSProperties = {
  padding: '20px 12px',
  maxWidth: '800px',
  margin: '0 auto',
  textAlign: 'center',
  fontFamily: 'sans-serif',
  boxSizing: 'border-box',
};

const folderLabelStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 'bold',
  color: '#64748b',
  display: 'block',
  marginBottom: '8px',
};

const folderContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '8px',
  flexWrap: 'wrap',
  alignItems: 'center',
};

const folderTabStyle: React.CSSProperties = {
  padding: '8px 14px',
  fontSize: '0.85rem',
  fontWeight: 600,
  border: '1px solid #cbd5e1',
  borderRadius: '20px',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const deleteFolderBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  marginLeft: '2px',
  fontSize: '0.8rem',
};

const tabContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '8px',
  marginBottom: '20px',
  flexWrap: 'wrap',
};

const tabButtonStyle: React.CSSProperties = {
  padding: '10px 16px',
  fontSize: '0.9rem',
  fontWeight: 600,
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  minHeight: '42px',
};

const gridContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '16px',
  justifyContent: 'center',
  width: '100%',
};