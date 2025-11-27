

type Props = {
  onExport: (format: 'txt' | 'md') => void;
};

export default function ExportButton({ onExport }: Props) {
  return (
    <div className="export-wrapper">
      <button 
        onClick={() => onExport('txt')}
        className="export-btn"
        style={{
          background: "none",
          border: "none",
          color: "var(--text-secondary)",
          cursor: "pointer",
          fontSize: "0.8rem",
          padding: "4px 8px",
          borderRadius: "4px",
          transition: "background 0.2s",
        }}
        onMouseOver={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.1)"; }}
        onMouseOut={(e) => { e.currentTarget.style.background = "none"; }}
        aria-label="Export as TXT"
      >
        TXT
      </button>
      <button 
        onClick={() => onExport('md')}
        className="export-btn"
        style={{
          background: "none",
          border: "none",
          color: "var(--text-secondary)",
          cursor: "pointer",
          fontSize: "0.8rem",
          padding: "4px 8px",
          borderRadius: "4px",
          transition: "background 0.2s",
          marginLeft: "4px",
        }}
        onMouseOver={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.1)"; }}
        onMouseOut={(e) => { e.currentTarget.style.background = "none"; }}
        aria-label="Export as MD"
      >
        MD
      </button>
    </div>
  );
}