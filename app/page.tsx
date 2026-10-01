// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Flashcard from '@/components/Flashcard';
import CreateSetForm from '@/components/CreateSetForm';
import StudyMode, { FlashcardData } from '@/components/StudyMode';

interface Folder {
  id: string;
  name: string;
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

    const { data: foldersData } = await supabase
      .from('folders')
      .select('*')
      .order('created_at', { ascending: true });

    const { data: cardsData } = await supabase
      .from('flashcards')
      .select('*')
      .order('created_at', { ascending: false });

    setFolders(foldersData || []);
    setCards(cardsData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete folder "${folderName}" and all its flashcards?`
    );

    if (!confirmDelete) return;

    await supabase.from('flashcards').delete().eq('folder_id', folderId);
    const { error } = await supabase.from('folders').delete().eq('id', folderId);

    if (error) {
      alert('Error deleting folder: ' + error.message);
    } else {
      if (selectedFolderId === folderId) {
        setSelectedFolderId('all');
      }
      fetchData();
    }
  };

  const filteredCards =
    selectedFolderId === 'all'
      ? cards
      : cards.filter((card) => card.folder_id === selectedFolderId);

  const activeFolderName =
    selectedFolderId === 'all'
      ? 'All Sets'
      : folders.find((f) => f.id === selectedFolderId)?.name || 'Folder';

  return (
    <div style={pageWrapperStyle}>
      <main style={mainContainerStyle}>
        <header style={navHeaderStyle}>
          <div style={logoGroupStyle}>
            <h1 style={logoTitleStyle}>⚡ DLFlashcards</h1>
            <span style={badgeStyle}>By Luigi Dela Rosa</span>
          </div>
          {!showCreateForm && (
            <button onClick={() => setShowCreateForm(true)} style={createSetBtnStyle}>
              ➕ Create / Add Flashcards
            </button>
          )}
        </header>

        {showCreateForm ? (
          <CreateSetForm
            folders={folders}
            initialFolderId={selectedFolderId}
            onSetCreated={() => {
              setShowCreateForm(false);
              fetchData();
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        ) : (
          <>
            <section style={sectionBoxStyle}>
              <span style={folderLabelStyle}>📁 Subject Folders:</span>
              <div style={folderContainerStyle}>
                <button
                  onClick={() => setSelectedFolderId('all')}
                  style={{
                    ...folderTabStyle,
                    backgroundColor: selectedFolderId === 'all' ? '#800000' : '#ffffff',
                    color: selectedFolderId === 'all' ? '#ffffff' : '#800000',
                  }}
                >
                  🌐 All Sets ({cards.length})
                </button>

                {folders.map((folder) => {
                  const count = cards.filter((c) => c.folder_id === folder.id).length;
                  const isSelected = selectedFolderId === folder.id;

                  return (
                    <div
                      key={folder.id}
                      style={{
                        ...folderTabWrapperStyle,
                        backgroundColor: isSelected ? '#800000' : '#ffffff',
                        borderColor: '#800000',
                      }}
                    >
                      <button
                        onClick={() => setSelectedFolderId(folder.id)}
                        style={{
                          ...folderBtnStyle,
                          color: isSelected ? '#ffffff' : '#800000',
                        }}
                      >
                        📂 {folder.name} ({count})
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(folder.id, folder.name);
                        }}
                        style={{
                          ...deleteFolderBtnStyle,
                          color: isSelected ? '#ffaaaa' : '#999999',
                        }}
                        title="Delete Folder"
                      >
                        🗑️
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            <div style={actionHeaderStyle}>
              <div style={tabContainerStyle}>
                <button
                  onClick={() => setMode('study')}
                  style={{
                    ...tabButtonStyle,
                    backgroundColor: mode === 'study' ? '#800000' : '#ffffff',
                    color: mode === 'study' ? '#ffffff' : '#374155',
                    border: mode === 'study' ? '2px solid #800000' : '1px solid #d1d5db',
                  }}
                >
                  🎯 Study Mode
                </button>
                <button
                  onClick={() => setMode('grid')}
                  style={{
                    ...tabButtonStyle,
                    backgroundColor: mode === 'grid' ? '#800000' : '#ffffff',
                    color: mode === 'grid' ? '#ffffff' : '#374155',
                    border: mode === 'grid' ? '2px solid #800000' : '1px solid #d1d5db',
                  }}
                >
                  📋 View All ({filteredCards.length})
                </button>
              </div>

              {selectedFolderId !== 'all' && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  style={addMoreToFolderBtnStyle}
                >
                  ➕ Add Cards to "{activeFolderName}"
                </button>
              )}
            </div>

            {loading ? (
              <div style={statusMessageStyle}>Loading flashcards...</div>
            ) : filteredCards.length === 0 ? (
              <div style={statusMessageStyle}>
                No flashcards in this folder yet. Click <b>"➕ Create / Add Flashcards"</b> to get started!
              </div>
            ) : mode === 'study' ? (
              <div style={studyWrapperStyle}>
                <StudyMode cards={filteredCards} onRefresh={fetchData} />
              </div>
            ) : (
              <div style={responsiveGridStyle}>
                {filteredCards.map((card) => (
                  <Flashcard
                    key={card.id}
                    id={card.id}
                    question={card.question}
                    answer={card.answer}
                    imageUrl={card.image_url}
                    cardType={card.card_type}
                    onRefresh={fetchData}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// Styles
const pageWrapperStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#f8fafc',
  padding: '16px 12px',
  boxSizing: 'border-box',
};

const mainContainerStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '1200px',
  margin: '0 auto',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  boxSizing: 'border-box',
};

const navHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '12px',
  marginBottom: '20px',
  padding: '16px 20px',
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
  borderLeft: '6px solid #800000',
};

const logoGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap',
};

const logoTitleStyle: React.CSSProperties = {
  color: '#800000',
  margin: 0,
  fontSize: '1.5rem',
  fontWeight: 800,
};

const badgeStyle: React.CSSProperties = {
  backgroundColor: '#fff0f0',
  color: '#800000',
  fontSize: '0.75rem',
  fontWeight: 700,
  padding: '3px 8px',
  borderRadius: '20px',
  border: '1px solid #800000',
};

const createSetBtnStyle: React.CSSProperties = {
  padding: '10px 18px',
  backgroundColor: '#800000',
  color: '#ffffff',
  fontWeight: 'bold',
  fontSize: '0.9rem',
  border: 'none',
  borderRadius: '10px',
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(128, 0, 0, 0.2)',
};

const sectionBoxStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  padding: '16px',
  borderRadius: '16px',
  marginBottom: '20px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
  border: '1px solid #e2e8f0',
};

const folderLabelStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 700,
  color: '#475569',
  display: 'block',
  marginBottom: '10px',
};

const folderContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
  alignItems: 'center',
};

const folderTabStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: '0.85rem',
  fontWeight: 600,
  border: '1.5px solid #800000',
  borderRadius: '30px',
  cursor: 'pointer',
};

const folderTabWrapperStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  border: '1.5px solid #800000',
  borderRadius: '30px',
  padding: '2px 8px 2px 12px',
};

const folderBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '0.85rem',
  fontWeight: 600,
  cursor: 'pointer',
  padding: '6px 0',
};

const deleteFolderBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '0.85rem',
  cursor: 'pointer',
  padding: '4px',
  marginLeft: '6px',
};

const actionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '12px',
  marginBottom: '20px',
};

const tabContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
};

const tabButtonStyle: React.CSSProperties = {
  padding: '10px 18px',
  fontSize: '0.9rem',
  fontWeight: 700,
  borderRadius: '10px',
  cursor: 'pointer',
};

const addMoreToFolderBtnStyle: React.CSSProperties = {
  padding: '10px 18px',
  backgroundColor: '#fff0f0',
  color: '#800000',
  border: '1px solid #800000',
  borderRadius: '10px',
  fontWeight: 700,
  fontSize: '0.85rem',
  cursor: 'pointer',
};

const studyWrapperStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
};

const responsiveGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '16px',
  width: '100%',
};

const statusMessageStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  padding: '30px 16px',
  borderRadius: '16px',
  textAlign: 'center',
  color: '#475569',
  fontSize: '0.95rem',
  border: '1px solid #e2e8f0',
};