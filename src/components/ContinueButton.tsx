
type Props = {
  disabled?: boolean;
  onClick: () => void;
};

export default function ContinueButton({ disabled, onClick }: Props) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        width: "100%", // Full width in sidebar
        padding: "14px 0",
        borderRadius: "12px",
        fontSize: "0.95rem",
        fontWeight: 600,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        backgroundColor: disabled ? "var(--switch-track)" : "var(--text-primary)",
        color: disabled ? "var(--text-secondary)" : "var(--bg-color)",
        transition: "transform 0.1s ease, opacity 0.2s, box-shadow 0.2s",
        opacity: disabled ? 0.7 : 1,
        boxShadow: disabled ? "none" : "0 4px 15px rgba(0,0,0,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        textTransform: "uppercase",
        letterSpacing: "0.5px"
      }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.transform = "scale(1.02)")}
      onMouseLeave={(e) => !disabled && (e.currentTarget.style.transform = "scale(1)")}
    >
      {disabled ? "Writing..." : "Continue Writing →"}
    </button>
  );
}