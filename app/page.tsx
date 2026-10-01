// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Flashcard from '@/components/Flashcard';
import CreateSetForm from '@/components/CreateSetForm';
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
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchData = async () => {
    setLoading(true);

    const { data: foldersData } = await supabase.from('folders').select('*').order('created_at', { ascending: true });
    const { data: cardsData } = await supabase.from('flashcards').select('*').order('created_at', { ascending: false });

    setFolders(foldersData || []);
    setCards(cardsData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredCards =
    selectedFolderId === 'all'
      ? cards
      : cards.filter((card) => card.folder_id === selectedFolderId);

  return (
    <main style={mainContainerStyle}>
      {/* Navbar / App Title */}
      <header style={navHeaderStyle}>
        <h1 style={{ color: '#800000', margin: 0 }}>⚡ DLFlashcards</h1>
        {!showCreateForm && (
          <button onClick={() => setShowCreateForm(true)} style={createSetBtnStyle}>
            ➕ Gumawa ng Set
          </button>
        )}
      </header>

      {/* CREATE SET FORM VIEW */}
      {showCreateForm ? (
        <CreateSetForm
          onSetCreated={() => {
            setShowCreateForm(false);
            fetchData();
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      ) : (
        <>
          {/* FOLDER TABS */}
          <div style={{ marginBottom: '24px' }}>
            <span style={folderLabelStyle}>📁 Subject / Folders:</span>
            <div style={folderContainerStyle}>
              <button
                onClick={() => setSelectedFolderId('all')}
                style={{
                  ...folderTabStyle,
                  backgroundColor: selectedFolderId === 'all' ? '#800000' : '#ffffff',
                  color: selectedFolderId === 'all' ? '#ffffff' : '#800000',
                  borderColor: '#800000',
                }}
              >
                🌐 All Sets ({cards.length})
              </button>

              {folders.map((folder) => {
                const count = cards.filter((c) => c.folder_id === folder.id).length;
                const isSelected = selectedFolderId === folder.id;

                return (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolderId(folder.id)}
                    style={{
                      ...folderTabStyle,
                      backgroundColor: isSelected ? '#800000' : '#ffffff',
                      color: isSelected ? '#ffffff' : '#800000',
                      borderColor: '#800000',
                    }}
                  >
                    📂 {folder.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* VIEW SWITCHER */}
          <div style={tabContainerStyle}>
            <button
              onClick={() => setMode('study')}
              style={{
                ...tabButtonStyle,
                backgroundColor: mode === 'study' ? '#800000' : '#f3f4f6',
                color: mode === 'study' ? '#ffffff' : '#374155',
              }}
            >
              🎯 Study Mode
            </button>
            <button
              onClick={() => setMode('grid')}
              style={{
                ...tabButtonStyle,
                backgroundColor: mode === 'grid' ? '#800000' : '#f3f4f6',
                color: mode === 'grid' ? '#ffffff' : '#374155',
              }}
            >
              📋 View All ({filteredCards.length})
            </button>
          </div>

          {/* CONTENT RENDERING */}
          {loading ? (
            <p>Loading flashcards...</p>
          ) : filteredCards.length === 0 ? (
            <p>Wala pang flashcards. I-click ang "➕ Gumawa ng Set" sa taas para magdagdag!</p>
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
        </>
      )}
    </main>
  );
}

// 🎨 MAROON & WHITE STYLES
const mainContainerStyle: React.CSSProperties = {
  padding: '20px 16px',
  maxWidth: '900px',
  margin: '0 auto',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  boxSizing: 'border-box',
};

const navHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '24px',
  paddingBottom: '12px',
  borderBottom: '2px solid #800000',
};

const createSetBtnStyle: React.CSSProperties = {
  padding: '10px 18px',
  backgroundColor: '#800000',
  color: '#ffffff',
  fontWeight: 'bold',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
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
  gap: '8px',
  flexWrap: 'wrap',
};

const folderTabStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: '0.85rem',
  fontWeight: 600,
  border: '1px solid #800000',
  borderRadius: '20px',
  cursor: 'pointer',
};

const tabContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  marginBottom: '20px',
};

const tabButtonStyle: React.CSSProperties = {
  padding: '10px 16px',
  fontSize: '0.9rem',
  fontWeight: 600,
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
};

const gridContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '16px',
  justifyContent: 'center',
  width: '100%',
};