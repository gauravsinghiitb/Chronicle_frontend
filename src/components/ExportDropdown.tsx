import { useState } from "react";
import { FaFileAlt, FaMarkdown, FaFilePdf, FaDownload } from "react-icons/fa";

type Props = {
  onExport: (format: 'txt' | 'md' | 'pdf') => void;
  label?: string; // Optional label
};

export default function ExportDropdown({ onExport, label = "Export Text" }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="export-dropdown" style={{ position: "relative" }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-secondary)",
          cursor: "pointer",
          fontSize: "0.9rem",
          fontWeight: 600,
          padding: "8px 12px",
          borderRadius: "20px",
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          textTransform: "uppercase"
        }}
        title="Export"
      >
        {label} <FaDownload />
      </button>
      {isOpen && (
        <div style={{
          position: "absolute",
          top: "140%",
          right: 0,
          background: "var(--header-bg)",
          border: "1px solid var(--header-border)",
          borderRadius: "12px",
          padding: "6px",
          zIndex: 101,
          minWidth: "120px",
          backdropFilter: "blur(12px)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
          gap: "4px"
        }}>
          <button 
            onClick={() => { onExport('txt'); setIsOpen(false); }}
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              width: "100%", padding: "8px 12px",
              background: "none", border: "none",
              color: "var(--text-secondary)", cursor: "pointer",
              borderRadius: "8px", fontSize: "0.9rem", fontWeight: 500,
              textAlign: "left"
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = "rgba(128,128,128,0.1)"; }}
            onMouseOut={(e) => { e.currentTarget.style.background = "none"; }}
          >
            <FaFileAlt /> TXT
          </button>
          <button 
            onClick={() => { onExport('md'); setIsOpen(false); }}
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              width: "100%", padding: "8px 12px",
              background: "none", border: "none",
              color: "var(--text-secondary)", cursor: "pointer",
              borderRadius: "8px", fontSize: "0.9rem", fontWeight: 500
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = "rgba(128,128,128,0.1)"; }}
            onMouseOut={(e) => { e.currentTarget.style.background = "none"; }}
          >
            <FaMarkdown /> MD
          </button>
          <button 
            onClick={() => { onExport('pdf'); setIsOpen(false); }}
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              width: "100%", padding: "8px 12px",
              background: "none", border: "none",
              color: "var(--text-secondary)", cursor: "pointer",
              borderRadius: "8px", fontSize: "0.9rem", fontWeight: 500
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = "rgba(128,128,128,0.1)"; }}
            onMouseOut={(e) => { e.currentTarget.style.background = "none"; }}
          >
            <FaFilePdf /> PDF
          </button>
        </div>
      )}
    </div>
  );
}