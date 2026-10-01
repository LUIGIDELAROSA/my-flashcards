// components/CreateSetForm.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Folder {
  id: string;
  name: string;
}

interface CardInput {
  id: string;
  card_type: 'identification' | 'multiple_choice';
  question: string;
  image_url: string; // Stores Base64 data string
  answer: string;
  option1: string;
  option2: string;
  option3: string;
}

interface CreateSetFormProps {
  folders: Folder[];
  initialFolderId?: string;
  onSetCreated: () => void;
  onCancel?: () => void;
}

export default function CreateSetForm({
  folders,
  initialFolderId = 'new',
  onSetCreated,
  onCancel,
}: CreateSetFormProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string>(
    initialFolderId === 'all' ? 'new' : initialFolderId
  );
  const [newTitle, setNewTitle] = useState('');
  const [cards, setCards] = useState<CardInput[]>([
    {
      id: '1',
      card_type: 'identification',
      question: '',
      image_url: '',
      answer: '',
      option1: '',
      option2: '',
      option3: '',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const addCardRow = () => {
    setCards((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        card_type: 'identification',
        question: '',
        image_url: '',
        answer: '',
        option1: '',
        option2: '',
        option3: '',
      },
    ]);
  };

  const removeCardRow = (index: number) => {
    if (cards.length <= 1) {
      alert('You must have at least one flashcard in the set!');
      return;
    }
    setCards((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCardChange = (
    index: number,
    field: keyof CardInput,
    value: string
  ) => {
    setCards((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Process File to Base64 Image
  const processImageFile = (index: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      handleCardChange(index, 'image_url', result);
    };
    reader.readAsDataURL(file);
  };

  const handleDropImage = (index: number, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverIndex(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(index, e.dataTransfer.files[0]);
    }
  };

  const handleSave = async () => {
    const validCards = cards.filter((c) => c.question.trim() && c.answer.trim());
    if (validCards.length === 0) {
      alert('Please fill out at least one flashcard with a Question and Answer!');
      return;
    }

    setLoading(true);
    let targetFolderId = selectedFolderId;

    if (selectedFolderId === 'new') {
      if (!newTitle.trim()) {
        alert('Please enter a Folder / Subject Title!');
        setLoading(false);
        return;
      }

      const { data: folderData, error: folderError } = await supabase
        .from('folders')
        .insert([{ name: newTitle.trim() }])
        .select()
        .single();

      if (folderError) {
        alert('Error creating folder: ' + folderError.message);
        setLoading(false);
        return;
      }

      targetFolderId = folderData.id;
    }

    const cardsToInsert = validCards.map((c) => {
      let optionsList: string[] = [];

      if (c.card_type === 'multiple_choice') {
        const extraOptions = [c.option1, c.option2, c.option3]
          .map((opt) => opt.trim())
          .filter(Boolean);
        
        optionsList = Array.from(new Set([c.answer.trim(), ...extraOptions]));
      }

      return {
        question: c.question.trim(),
        answer: c.answer.trim(),
        folder_id: targetFolderId,
        card_type: c.card_type,
        image_url: c.image_url.trim() || null,
        options: optionsList,
      };
    });

    const { error: cardsError } = await supabase
      .from('flashcards')
      .insert(cardsToInsert);

    setLoading(false);

    if (cardsError) {
      alert('Error saving flashcards: ' + cardsError.message);
    } else {
      setNewTitle('');
      onSetCreated();
    }
  };

  return (
    <div style={pageContainerStyle}>
      <div style={headerStyle}>
        <div>
          <h2 style={titleHeadingStyle}>
            {selectedFolderId === 'new' ? 'Create New Flashcard Set' : 'Add Cards to Folder'}
          </h2>
          <span style={subHeadingStyle}>Drag and drop images or select flashcard types</span>
        </div>
        <div style={headerBtnGroupStyle}>
          {onCancel && (
            <button onClick={onCancel} style={cancelBtnStyle}>
              Cancel
            </button>
          )}
          <button onClick={handleSave} disabled={loading} style={primaryBtnStyle}>
            {loading ? 'Saving...' : 'Save Flashcards'}
          </button>
        </div>
      </div>

      <div style={inputSectionStyle}>
        <label style={labelStyle}>Select Target Folder:</label>
        <select
          value={selectedFolderId}
          onChange={(e) => setSelectedFolderId(e.target.value)}
          style={selectStyle}
        >
          <option value="new">➕ [ Create New Folder ]</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              📂 {f.name}
            </option>
          ))}
        </select>

        {selectedFolderId === 'new' && (
          <input
            type="text"
            placeholder="Folder / Subject Title (e.g. Biology 101)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={titleInputStyle}
          />
        )}
      </div>

      <div style={cardsListContainerStyle}>
        {cards.map((card, index) => (
          <div key={card.id} style={cardRowStyle}>
            <div style={cardRowHeaderStyle}>
              <span style={cardIndexStyle}>Card #{index + 1}</span>
              <button
                onClick={() => removeCardRow(index)}
                style={deleteRowBtnStyle}
                title="Remove Card"
              >
                🗑️ Delete Card
              </button>
            </div>

            <div style={cardTypeRowStyle}>
              <label style={typeLabelStyle}>Card Mode:</label>
              <select
                value={card.card_type}
                onChange={(e) =>
                  handleCardChange(
                    index,
                    'card_type',
                    e.target.value as 'identification' | 'multiple_choice'
                  )
                }
                style={cardTypeSelectStyle}
              >
                <option value="identification">📝 Identification (Fill-in Answer)</option>
                <option value="multiple_choice">🔘 Multiple Choice</option>
              </select>
            </div>

            {/* 📷 DRAG AND DROP / CLICK IMAGE UPLOADER */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={inputLabelStyle}>📷 QUESTION IMAGE (DRAG & DROP OR CLICK)</span>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverIndex(index);
                }}
                onDragLeave={() => setDragOverIndex(null)}
                onDrop={(e) => handleDropImage(index, e)}
                onClick={() => document.getElementById(`file-input-${index}`)?.click()}
                style={{
                  ...dropZoneStyle,
                  borderColor: dragOverIndex === index ? '#800000' : '#d1d5db',
                  backgroundColor: dragOverIndex === index ? '#fff0f0' : '#f9fafb',
                }}
              >
                <input
                  id={`file-input-${index}`}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      processImageFile(index, e.target.files[0]);
                    }
                  }}
                />

                {card.image_url ? (
                  <div style={previewContainerStyle}>
                    <img src={card.image_url} alt="Uploaded preview" style={previewImageStyle} />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardChange(index, 'image_url', '');
                      }}
                      style={removeImageBtnStyle}
                    >
                      ❌ Remove Image
                    </button>
                  </div>
                ) : (
                  <div style={dropTextContainerStyle}>
                    <span style={{ fontSize: '1.4rem' }}>🖼️</span>
                    <span><b>Drag & drop an image here</b> or click to select file</span>
                  </div>
                )}
              </div>
            </div>

            <div style={inputsGridStyle}>
              <div style={inputGroupStyle}>
                <input
                  type="text"
                  placeholder="Enter Question / Term"
                  value={card.question}
                  onChange={(e) => handleCardChange(index, 'question', e.target.value)}
                  style={cardInputStyle}
                />
                <span style={inputLabelStyle}>QUESTION / TERM</span>
              </div>

              <div style={inputGroupStyle}>
                <input
                  type="text"
                  placeholder="Enter Correct Answer / Definition"
                  value={card.answer}
                  onChange={(e) => handleCardChange(index, 'answer', e.target.value)}
                  style={cardInputStyle}
                />
                <span style={inputLabelStyle}>CORRECT ANSWER</span>
              </div>
            </div>

            {card.card_type === 'multiple_choice' && (
              <div style={extraOptionsContainerStyle}>
                <span style={optionsTitleStyle}>Wrong Choice Options (Distractors):</span>
                <div style={inputsGridStyle}>
                  <input
                    type="text"
                    placeholder="Wrong Option 1"
                    value={card.option1}
                    onChange={(e) => handleCardChange(index, 'option1', e.target.value)}
                    style={cardInputStyle}
                  />
                  <input
                    type="text"
                    placeholder="Wrong Option 2"
                    value={card.option2}
                    onChange={(e) => handleCardChange(index, 'option2', e.target.value)}
                    style={cardInputStyle}
                  />
                  <input
                    type="text"
                    placeholder="Wrong Option 3"
                    value={card.option3}
                    onChange={(e) => handleCardChange(index, 'option3', e.target.value)}
                    style={cardInputStyle}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={addCardContainerStyle}>
        <button onClick={addCardRow} style={addCardBtnStyle}>
          ➕ Add Another Card
        </button>
      </div>

      <div style={bottomActionBarStyle}>
        <button onClick={handleSave} disabled={loading} style={primaryBtnStyle}>
          {loading ? 'Saving...' : 'Save Flashcards'}
        </button>
      </div>
    </div>
  );
}

// Styles
const pageContainerStyle: React.CSSProperties = {
  maxWidth: '900px',
  margin: '0 auto',
  padding: '24px 16px',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  backgroundColor: '#ffffff',
  color: '#1a1a1a',
  borderRadius: '16px',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
  border: '1px solid #e2e8f0',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '24px',
  flexWrap: 'wrap',
  gap: '12px',
};

const titleHeadingStyle: React.CSSProperties = {
  fontSize: '1.6rem',
  fontWeight: 800,
  color: '#800000',
  margin: 0,
};

const subHeadingStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#666666',
};

const headerBtnGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
};

const primaryBtnStyle: React.CSSProperties = {
  backgroundColor: '#800000',
  color: '#ffffff',
  padding: '10px 20px',
  borderRadius: '8px',
  border: 'none',
  fontWeight: 700,
  fontSize: '0.9rem',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(128, 0, 0, 0.25)',
};

const cancelBtnStyle: React.CSSProperties = {
  backgroundColor: '#f3f4f6',
  color: '#374151',
  padding: '10px 18px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontWeight: 600,
  fontSize: '0.9rem',
  cursor: 'pointer',
};

const inputSectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  marginBottom: '28px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 700,
  color: '#4b5563',
};

const selectStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: '10px',
  border: '2px solid #800000',
  fontSize: '1rem',
  fontWeight: 700,
  backgroundColor: '#ffffff',
  color: '#800000',
  cursor: 'pointer',
  outline: 'none',
};

const titleInputStyle: React.CSSProperties = {
  padding: '16px 20px',
  borderRadius: '10px',
  border: '2px solid #e5e7eb',
  fontSize: '1.3rem',
  fontWeight: 600,
  backgroundColor: '#ffffff',
  outline: 'none',
  color: '#111827',
};

const cardsListContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  marginBottom: '24px',
};

const cardRowStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '20px',
  border: '1px solid #e5e7eb',
  borderTop: '4px solid #800000',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
};

const cardRowHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid #f3f4f6',
  paddingBottom: '8px',
};

const cardIndexStyle: React.CSSProperties = {
  fontWeight: 800,
  color: '#800000',
  fontSize: '1rem',
};

const deleteRowBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.85rem',
  color: '#dc2626',
  fontWeight: 600,
};

const cardTypeRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const typeLabelStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 700,
  color: '#374151',
};

const cardTypeSelectStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '0.85rem',
  fontWeight: 600,
  backgroundColor: '#f9fafb',
};

const dropZoneStyle: React.CSSProperties = {
  border: '2px dashed #d1d5db',
  borderRadius: '10px',
  padding: '16px',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const dropTextContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  color: '#6b7280',
  fontSize: '0.85rem',
};

const previewContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
};

const previewImageStyle: React.CSSProperties = {
  maxHeight: '140px',
  maxWidth: '100%',
  borderRadius: '8px',
  objectFit: 'contain',
};

const removeImageBtnStyle: React.CSSProperties = {
  backgroundColor: '#fef2f2',
  color: '#dc2626',
  border: '1px solid #fecaca',
  borderRadius: '6px',
  padding: '4px 10px',
  fontSize: '0.75rem',
  fontWeight: 700,
  cursor: 'pointer',
};

const inputsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '12px',
};

const inputGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const cardInputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '0.95rem',
  backgroundColor: '#fafafa',
  outline: 'none',
};

const inputLabelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 700,
  color: '#6b7280',
  letterSpacing: '0.05em',
};

const extraOptionsContainerStyle: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  padding: '12px',
  borderRadius: '8px',
  border: '1px dashed #d1d5db',
};

const optionsTitleStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 700,
  color: '#4b5563',
  display: 'block',
  marginBottom: '8px',
};

const addCardContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  margin: '24px 0',
};

const addCardBtnStyle: React.CSSProperties = {
  padding: '12px 28px',
  backgroundColor: '#fff0f0',
  color: '#800000',
  border: '2px dashed #800000',
  borderRadius: '10px',
  fontWeight: 700,
  fontSize: '0.95rem',
  cursor: 'pointer',
  width: '100%',
  maxWidth: '300px',
};

const bottomActionBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: '20px',
  paddingTop: '16px',
  borderTop: '1px solid #e5e7eb',
};