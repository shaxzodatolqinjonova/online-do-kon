"use client";

/** O'chirishdan oldin "Rostdan o'chirasizmi?" deb so'raydi */
export function ConfirmButton({ children, message = "Rostdan oʻchirasizmi?", className = "rm" }: { children: React.ReactNode; message?: string; className?: string }) {
  return (
    <button type="submit" className={className} onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}>
      {children}
    </button>
  );
}
