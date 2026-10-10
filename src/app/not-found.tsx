import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap">
      <div className="empty" style={{ marginTop: 40 }}>
        <div style={{ fontSize: "3rem" }}>😿</div>
        <h1 style={{ fontSize: "1.6rem" }}>Sahifa topilmadi</h1>
        <p><Link className="btn" href="/">Bosh sahifaga qaytish</Link></p>
      </div>
    </div>
  );
}
