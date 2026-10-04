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

  // --- DARK MODE STATE ---
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load saved theme setting on initial render
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    } else if (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  // Toggle Dark Mode function
  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const nextMode = !prev;
      localStorage.setItem('theme', nextMode ? 'dark' : 'light');
      return nextMode;
    });
  };

  // Dynamic Theme Palette
  const theme = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    cardBg: isDarkMode ? '#1e293b' : '#ffffff',
    text: isDarkMode ? '#f8fafc' : '#1f2937',
    subText: isDarkMode ? '#94a3b8' : '#475569',
    border: isDarkMode ? '#334155' : '#e2e8f0',
    inputBg: isDarkMode ? '#0f172a' : '#ffffff',
    accentBg: isDarkMode ? '#3b1111' : '#fff0f0',
    accentText: isDarkMode ? '#ff8080' : '#800000',
    accentBorder: '#800000',
  };

  // --- AI GENERATOR MODAL STATES ---
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTextInput, setAiTextInput] = useState('');
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiTargetFolderId, setAiTargetFolderId] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

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

  // const handleDeleteFolder = async (folderId: string, folderName: string) => {
  //   const confirmDelete = window.confirm(
  //     `Are you sure you want to delete folder "${folderName}" and all its flashcards?`
  //   );

  //   if (!confirmDelete) return;

  //   await supabase.from('flashcards').delete().eq('folder_id', folderId);
  //   const { error } = await supabase.from('folders').delete().eq('id', folderId);

  //   if (error) {
  //     alert('Error deleting folder: ' + error.message);
  //   } else {
  //     if (selectedFolderId === folderId) {
  //       setSelectedFolderId('all');
  //     }
  //     fetchData();
  //   }
  // };

  // --- HANDLER FOR GENERATING AND SAVING AI CARDS TO SUPABASE ---
  const handleGenerateAiCards = async () => {
    if (!aiTextInput.trim() && !aiFile) {
      setAiError('Please paste text/notes or upload a PDF file.');
      return;
    }

    if (!aiTargetFolderId) {
      setAiError('Please select a target folder where the cards will be placed.');
      return;
    }

    setAiLoading(true);
    setAiError('');

    try {
      const formData = new FormData();
      if (aiTextInput) formData.append('text', aiTextInput);
      if (aiFile) formData.append('file', aiFile);

      // 1. Call the API route that processes Gemini AI
      const res = await fetch('/api/generate-flashcards', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!data.success || !data.cards) {
        throw new Error(data.error || 'Flashcard generation failed.');
      }

      // 2. Format the AI response to match Supabase columns
      const cardsToInsert = data.cards.map((c: { question: string; answer: string; options: string[] }) => ({
        folder_id: aiTargetFolderId,
        question: c.question,
        answer: c.answer,
        options: c.options || [], 
        card_type: 'identification',
      }));

      // 3. Save directly to Supabase Database
      const { error: insertError } = await supabase.from('flashcards').insert(cardsToInsert);

      if (insertError) {
        throw new Error('Error saving to Supabase: ' + insertError.message);
      }

      // Reset Modal Form & Refresh List
      setShowAiModal(false);
      setAiTextInput('');
      setAiFile(null);
      await fetchData();
      alert(`✨ Success! Created ${cardsToInsert.length} AI Flashcards!`);
    } catch (err: any) {
      setAiError(err.message || 'An error occurred while generating flashcards.');
    } finally {
      setAiLoading(false);
    }
  };

  const openAiModalWithFolder = () => {
    const defaultFolder = selectedFolderId !== 'all' ? selectedFolderId : folders[0]?.id || '';
    setAiTargetFolderId(defaultFolder);
    setShowAiModal(true);
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
    <div style={{ ...pageWrapperStyle, backgroundColor: theme.bg, color: theme.text }}>
      <main style={mainContainerStyle}>
        <header style={{ ...navHeaderStyle, backgroundColor: theme.cardBg, borderColor: theme.accentBorder }}>
          <div style={logoGroupStyle}>
            <h1 style={logoTitleStyle}>⚡ DLFlashcards</h1>
            <span style={{ ...badgeStyle, backgroundColor: theme.accentBg, color: theme.accentText, borderColor: theme.accentBorder }}>
              By Luigi Dela Rosa
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* 🌙 DARK MODE TOGGLE BUTTON */}
            <button
              onClick={toggleDarkMode}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: `1.5px solid ${theme.border}`,
                backgroundColor: isDarkMode ? '#334155' : '#f1f5f9',
                color: theme.text,
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {isDarkMode ? '☀️ Light' : '🌙 Dark'}
            </button>

            {/* 🤖 AI GENERATOR BUTTON */}
            <button
              onClick={openAiModalWithFolder}
              style={{ ...aiHeaderBtnStyle, backgroundColor: theme.accentBg, color: theme.accentText }}
            >
              ✨ AI Auto-Generator (PDF)
            </button>
            {!showCreateForm && (
              <button onClick={() => setShowCreateForm(true)} style={createSetBtnStyle}>
                ➕ Create / Add Flashcards
              </button>
            )}
          </div>
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
            <section style={{ ...sectionBoxStyle, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <span style={{ ...folderLabelStyle, color: theme.subText }}>📁 Subject Folders:</span>
              <div style={folderContainerStyle}>
                <button
                  onClick={() => setSelectedFolderId('all')}
                  style={{
                    ...folderTabStyle,
                    backgroundColor: selectedFolderId === 'all' ? '#800000' : theme.cardBg,
                    color: selectedFolderId === 'all' ? '#ffffff' : theme.text,
                    borderColor: '#800000',
                  }}
                >
                  🌐 All Sets ({cards.length})
                </button>

                {/* {folders.map((folder) => {
                  const count = cards.filter((c) => c.folder_id === folder.id).length;
                  const isSelected = selectedFolderId === folder.id;

                  return (
                    <div
                      key={folder.id}
                      style={{
                        ...folderTabWrapperStyle,
                        backgroundColor: isSelected ? '#800000' : theme.cardBg,
                        borderColor: '#800000',
                      }}
                    >
                      <button
                        onClick={() => setSelectedFolderId(folder.id)}
                        style={{
                          ...folderBtnStyle,
                          color: isSelected ? '#ffffff' : theme.text,
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
                          color: isSelected ? '#ffaaaa' : theme.subText,
                        }}
                        title="Delete Folder"
                      >
                        🗑️
                      </button>
                    </div>
                  );
                })} */}
              </div>
            </section>

            <div style={actionHeaderStyle}>
              <div style={tabContainerStyle}>
                <button
                  onClick={() => setMode('study')}
                  style={{
                    ...tabButtonStyle,
                    backgroundColor: mode === 'study' ? '#800000' : theme.cardBg,
                    color: mode === 'study' ? '#ffffff' : theme.text,
                    border: mode === 'study' ? '2px solid #800000' : `1px solid ${theme.border}`,
                  }}
                >
                  🎯 Study Mode
                </button>
                <button
                  onClick={() => setMode('grid')}
                  style={{
                    ...tabButtonStyle,
                    backgroundColor: mode === 'grid' ? '#800000' : theme.cardBg,
                    color: mode === 'grid' ? '#ffffff' : theme.text,
                    border: mode === 'grid' ? '2px solid #800000' : `1px solid ${theme.border}`,
                  }}
                >
                  📋 View All ({filteredCards.length})
                </button>
              </div>

              {selectedFolderId !== 'all' && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  style={{
                    ...addMoreToFolderBtnStyle,
                    backgroundColor: theme.accentBg,
                    color: theme.accentText,
                  }}
                >
                  ➕ Add Cards to "{activeFolderName}"
                </button>
              )}
            </div>

            {loading ? (
              <div style={{ ...statusMessageStyle, backgroundColor: theme.cardBg, color: theme.subText, borderColor: theme.border }}>
                Loading flashcards...
              </div>
            ) : filteredCards.length === 0 ? (
              <div style={{ ...statusMessageStyle, backgroundColor: theme.cardBg, color: theme.subText, borderColor: theme.border }}>
                No flashcards in this folder yet. Click <b>"➕ Create / Add Flashcards"</b> or <b>"✨ AI Auto-Generator"</b> to get started!
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

        {/* --- 🤖 AI GENERATOR MODAL POPUP --- */}
        {showAiModal && (
          <div style={modalOverlayStyle}>
            <div style={{ ...modalContentStyle, backgroundColor: theme.cardBg, color: theme.text }}>
              <h2 style={{ color: isDarkMode ? '#ff6b6b' : '#800000', marginTop: 0 }}>✨ AI Flashcard Generator</h2>
              <p style={{ color: theme.subText, fontSize: '0.85rem', marginBottom: '16px' }}>
                Upload a PDF or paste lecture notes to automatically generate flashcards in Supabase.
              </p>

              {/* Target Folder Selector */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ ...modalLabelStyle, color: theme.text }}>1. Select Target Folder:</label>
                <select
                  value={aiTargetFolderId}
                  onChange={(e) => setAiTargetFolderId(e.target.value)}
                  style={{
                    ...modalSelectStyle,
                    backgroundColor: theme.inputBg,
                    color: theme.text,
                    borderColor: theme.border,
                  }}
                >
                  <option value="" disabled style={{ color: theme.subText }}>
                    -- Choose Folder --
                  </option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id} style={{ color: theme.text, backgroundColor: theme.cardBg }}>
                      📂 {f.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* PDF Upload */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ ...modalLabelStyle, color: theme.text }}>2. Upload PDF / Text File:</label>
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={(e) => setAiFile(e.target.files?.[0] || null)}
                  style={{ ...modalFileInputStyle, color: theme.text }}
                />
              </div>

              <div style={{ textAlign: 'center', margin: '12px 0', color: theme.subText, fontSize: '0.8rem', fontWeight: 600 }}>
                — OR PASTE TEXT —
              </div>

              {/* Text Input */}
              <textarea
                placeholder="Paste your lecture notes / text here..."
                value={aiTextInput}
                onChange={(e) => setAiTextInput(e.target.value)}
                rows={4}
                style={{
                  ...modalTextareaStyle,
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  borderColor: theme.border,
                }}
              />

              {aiError && <p style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '8px', fontWeight: 600 }}>{aiError}</p>}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  onClick={() => setShowAiModal(false)}
                  disabled={aiLoading}
                  style={{
                    ...modalCancelBtnStyle,
                    backgroundColor: isDarkMode ? '#334155' : '#f3f4f6',
                    color: theme.text,
                    borderColor: theme.border,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateAiCards}
                  disabled={aiLoading}
                  style={modalSubmitBtnStyle}
                >
                  {aiLoading ? '⏳ AI is Processing PDF...' : '🚀 Generate & Save Flashcards'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Styles
const pageWrapperStyle: React.CSSProperties = {
  minHeight: '100vh',
  padding: '16px 12px',
  boxSizing: 'border-box',
  transition: 'background-color 0.2s ease, color 0.2s ease',
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
  fontSize: '0.75rem',
  fontWeight: 700,
  padding: '3px 8px',
  borderRadius: '20px',
  border: '1px solid #800000',
};

const aiHeaderBtnStyle: React.CSSProperties = {
  padding: '10px 16px',
  fontWeight: 'bold',
  fontSize: '0.85rem',
  border: '1.5px dashed #800000',
  borderRadius: '10px',
  cursor: 'pointer',
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
  padding: '16px',
  borderRadius: '16px',
  marginBottom: '20px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
  border: '1px solid #e2e8f0',
};

const folderLabelStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 700,
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

// const deleteFolderBtnStyle: React.CSSProperties = {
//   background: 'none',
//   border: 'none',
//   fontSize: '0.85rem',
//   cursor: 'pointer',
//   padding: '4px',
//   marginLeft: '6px',
// };

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
  padding: '30px 16px',
  borderRadius: '16px',
  textAlign: 'center',
  fontSize: '0.95rem',
  border: '1px solid #e2e8f0',
};

// Modal Specific Styles
const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  padding: '16px',
};

const modalContentStyle: React.CSSProperties = {
  borderRadius: '16px',
  padding: '24px',
  width: '100%',
  maxWidth: '480px',
  boxSizing: 'border-box',
  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
};

const modalLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 700,
  marginBottom: '6px',
};

const modalSelectStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  fontSize: '0.9rem',
  fontWeight: 500,
  outline: 'none',
};

const modalFileInputStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  width: '100%',
  padding: '4px 0',
};

const modalTextareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  borderRadius: '8px',
  fontSize: '0.9rem',
  boxSizing: 'border-box',
  outline: 'none',
  resize: 'vertical',
};

const modalCancelBtnStyle: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.85rem',
};

const modalSubmitBtnStyle: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: '#800000',
  color: '#ffffff',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '0.85rem',
};