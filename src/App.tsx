import { useRef, useEffect, useState } from "react";
import Editor, { type EditorRefShape } from "./editor/Editor";
import ContinueButton from "./components/ContinueButton";
import ExportDropdown from "./components/ExportDropdown";
import { requestAI } from "./api/aiClient";
import { FaMoon, FaSun } from "react-icons/fa";
import "./App.css";

export default function App() {
  const editorRef = useRef<EditorRefShape | null>(null);
  
  const [autoCompleteOn] = useState(true); 
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [notebookMode, setNotebookMode] = useState(true);
  const [stats, setStats] = useState({ words: 0, lines: 0, paragraphs: 0 });
  const [isAIWriting, setIsAIWriting] = useState(false);
  const [showReject, setShowReject] = useState(false);
  
  const typeWriterRef = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // ✅ IMPROVED LINE COUNT LOGIC
  useEffect(() => {
    const updateStats = () => {
      const text = editorRef.current?.getText?.() || "";
      const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
      const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0).length;
      
      const CHARS_PER_LINE = 95; 
      const rawLines = text.split(/\n/);
      let calculatedLines = 0;
      
      rawLines.forEach(line => {
        if (line.length === 0) {
          calculatedLines++; 
        } else {
          calculatedLines += Math.ceil(line.length / CHARS_PER_LINE);
        }
      });
      
      const finalLines = text.length === 0 ? 0 : Math.max(1, calculatedLines);

      setStats({ words, lines: finalLines, paragraphs: paragraphs || (words > 0 ? 1 : 0) });
    };
    const interval = setInterval(updateStats, 300);
    return () => clearInterval(interval);
  }, []);

  const handleContinue = async () => {
    if (isAIWriting) return;
    
    editorRef.current?.showReviewButtons(false); 
    setShowReject(false); 

    setIsAIWriting(true);
    const currentText = editorRef.current?.getText?.() || "";

    try {
      const aiText = await requestAI(currentText, "continue");
      let currentIndex = 0;
      if (typeWriterRef.current) clearInterval(typeWriterRef.current);

      typeWriterRef.current = window.setInterval(() => {
        if (currentIndex < aiText.length) {
          const chunk = aiText.slice(currentIndex, currentIndex + 3);
          editorRef.current?.insertTextAtCursor?.(chunk); 
          currentIndex += 3;
        } else {
          if (typeWriterRef.current) clearInterval(typeWriterRef.current);
          setIsAIWriting(false);
          setShowReject(true);
        }
      }, 8);
    } catch (error) {
      console.error("AI Error", error);
      setIsAIWriting(false);
    }
  };

  const handleReject = () => {
    editorRef.current?.rejectLastInsertion?.();
    setShowReject(false); 
  };

  const handleExport = async (format: 'txt' | 'md' | 'pdf') => {
    const text = editorRef.current?.getText?.() || "";
    if (format === 'pdf') {
      const { jsPDF } = await import('jspdf');
      const doc = new (jsPDF as any)();
      doc.setFont("helvetica");
      doc.setFontSize(12);
      const splitText = doc.splitTextToSize(text, 180);
      doc.text(splitText, 10, 10);
      doc.save('chronicle.pdf');
    } else {
      const blob = new Blob([text], { type: format === 'txt' ? 'text/plain' : 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chronicle.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className={`main-layout ${isAIWriting ? "ai-active" : ""}`}>
      
      {/* LEFT PANEL */}
      <div className="left-panel">
        <Editor 
          editorRef={editorRef} 
          autocompleteEnabled={autoCompleteOn} 
          isAIActive={isAIWriting}
          notebookMode={notebookMode}
          onReject={() => {}} 
        />
      </div>

      {/* RIGHT PANEL */}
      <div className="right-panel">
        
        {/* Header */}
        <div className="sidebar-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 className="sidebar-title">Chronicle AI ASSISTED Text EDITOR</h1>
            
            {/* Theme Toggle: Icon Left, Switch Right */}
            <label className="switch-wrapper">
              <span style={{ fontSize: '1.2rem', marginRight: '8px', display: 'flex', alignItems: 'center' }}>
                {isDarkMode ? <FaMoon /> : <FaSun />}
              </span>
              <input 
                type="checkbox" 
                className="switch-input"
                checked={isDarkMode}
                onChange={(e) => setIsDarkMode(e.target.checked)}
              />
              <div className="switch-slider"></div>
            </label>
          </div>
          <p className="tool-description">
            Intelligent writing assistant.
          </p>
        </div>

        {/* Controls */}
        <div className="controls-card">
          <div className="notebook-row">
            <input 
              type="checkbox" 
              className="simple-checkbox"
              checked={notebookMode}
              onChange={(e) => setNotebookMode(e.target.checked)}
              id="notebook-check"
            />
            <label htmlFor="notebook-check" className="notebook-label">Notebook Lines</label>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-container">
          <div className="stats-header">Analytics</div>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">{stats.words}</span>
              <span className="stat-label">Words</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.lines}</span>
              <span className="stat-label">Lines</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.paragraphs}</span>
              <span className="stat-label">Paras</span>
            </div>
          </div>
        </div>

        {/* ACTION STACK */}
        <div className="action-stack">
          
          {/* Reject Button (Conditional, Small & White) */}
          {showReject && (
            <button 
              className="reject-btn-bar"
              onClick={handleReject}
            > Reject
            </button>
          )}

          <ContinueButton 
            onClick={handleContinue} 
            disabled={isAIWriting} 
          />
        </div>

        {/* Download */}
        <div className="control-row" style={{ marginTop: '10px', justifyContent: 'center', borderBottom: 'none' }}>
           <ExportDropdown onExport={handleExport} label="Export Text" />
        </div>

      </div>
    </div>
  );
}