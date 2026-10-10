import { getSettings } from "@/lib/settings";

const safeUrl = (u: string) => (/^https?:\/\//i.test(u.trim()) ? u.trim() : "");

export async function Footer() {
  const s = await getSettings();
  const links = [
    safeUrl(s.telegram) && { href: safeUrl(s.telegram), label: "✈️ Telegram", ext: true },
    safeUrl(s.instagram) && { href: safeUrl(s.instagram), label: "📸 Instagram", ext: true },
    safeUrl(s.whatsapp) && { href: safeUrl(s.whatsapp), label: "💬 WhatsApp", ext: true },
    s.phone.trim() && { href: `tel:${s.phone.replace(/[^\d+]/g, "")}`, label: `📞 ${s.phone}`, ext: false },
  ].filter(Boolean) as { href: string; label: string; ext: boolean }[];
  return (
    <footer id="aloqa">
      <div className="wrap">
        <div className="foot">
          <div>
            <h2 style={{ fontSize: "1.6rem", color: "var(--rose)" }}>{s.shopName}</h2>
            <p className="note" style={{ maxWidth: "34ch" }}>Savollaringiz boʻlsa, bizga yozing yoki qoʻngʻiroq qiling.</p>
          </div>
          <div className="socials">
            {links.map((l) => (
              <a key={l.href} className="soc" href={l.href} {...(l.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {l.label}
              </a>
            ))}
          </div>
        </div>
        <p className="copy">© {new Date().getFullYear()} {s.shopName}. Barcha huquqlar himoyalangan.</p>
      </div>
    </footer>
  );
}
