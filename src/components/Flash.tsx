export function Flash({ xato, ok }: { xato?: string; ok?: string }) {
  if (xato) return <p className="msg err" role="alert" style={{ margin: "12px 0", padding: "10px 14px", background: "var(--blush)", borderRadius: 14 }}>{xato}</p>;
  if (ok) return <p className="msg ok" role="status" style={{ margin: "12px 0", padding: "10px 14px", background: "var(--blush)", borderRadius: 14 }}>{ok === "1" ? "Saqlandi ✓" : ok + " ✓"}</p>;
  return null;
}
