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
    <div style={pageWrapperStyle}>
      <main style={mainContainerStyle}>
        {/* 🏷️ RESPONSIVE HEADER */}
        <header style={navHeaderStyle}>
          <div style={logoGroupStyle}>
            <h1 style={logoTitleStyle}>⚡ DLFlashcards</h1>
            <span style={badgeStyle}>Set Creator</span>
          </div>
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
            {/* 📁 SUBJECT / FOLDER TABS SECTION */}
            <section style={sectionBoxStyle}>
              <span style={folderLabelStyle}>📁 Subject / Folders:</span>
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
                    <button
                      key={folder.id}
                      onClick={() => setSelectedFolderId(folder.id)}
                      style={{
                        ...folderTabStyle,
                        backgroundColor: isSelected ? '#800000' : '#ffffff',
                        color: isSelected ? '#ffffff' : '#800000',
                      }}
                    >
                      📂 {folder.name} ({count})
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 🎯 VIEW SWITCHER TABS */}
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

            {/* 🃏 MAIN CONTENT DISPLAY */}
            {loading ? (
              <div style={statusMessageStyle}>Ikinakarga ang mga flashcards...</div>
            ) : filteredCards.length === 0 ? (
              <div style={statusMessageStyle}>
                Wala pang flashcards sa folder na ito. I-click ang <b>"➕ Gumawa ng Set"</b> sa taas para magdagdag!
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

// 🎨 FULLY RESPONSIVE STYLES (PC & MOBILE)
const pageWrapperStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#f8fafc',
  padding: '16px 12px', // Maliit na padding sa mobile para sakop ang buong screen
  boxSizing: 'border-box',
};

const mainContainerStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '1200px', // Lalapad hanggang 1200px sa PC, pero kusa ring liliit sa mobile
  margin: '0 auto',
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  boxSizing: 'border-box',
};

const navHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap', // Kusa bababa ang button kung masyadong makipot ang cellphone screen
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
  flexWrap: 'wrap', // Bababa ang tabs kapag marami nang folders sa mobile
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

const tabContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  marginBottom: '20px',
  flexWrap: 'wrap',
};

const tabButtonStyle: React.CSSProperties = {
  padding: '10px 18px',
  fontSize: '0.9rem',
  fontWeight: 700,
  borderRadius: '10px',
  cursor: 'pointer',
  flex: '1 1 auto', // Mag-e-expand sa mobile para pantay ang pindutan
  textAlign: 'center',
};

const studyWrapperStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
};

const responsiveGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', // 280px para kasya agad kahit sa maliliit na phone (e.g. iPhone SE / Android)
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