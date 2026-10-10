import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { Flash } from "@/components/Flash";
import { saveSettings } from "../../actions";
import { configured } from "@/lib/payments/config";

export const metadata: Metadata = { title: "Sozlamalar" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ xato?: string; ok?: string }> }) {
  const { xato, ok } = await searchParams;
  const s = await getSettings();
  const F = ({ label, name, value, type = "text", extra }: { label: string; name: string; value: string | number; type?: string; extra?: Record<string, string | number> }) => (
    <label className="field"><span>{label}</span><input type={type} name={name} defaultValue={value} {...extra} /></label>
  );
  return (
    <form action={saveSettings}>
      <h1 style={{ fontSize: "2rem" }}>Sozlamalar</h1>
      <Flash xato={xato} ok={ok} />

      <h2 className="sub">Bosh sahifa</h2>
      <div className="box">
        <div className="fgrid"><F label="Doʻkon nomi" name="shopName" value={s.shopName} /></div>
        <label className="field"><span>Shior (nom ostidagi matn)</span><textarea name="tagline" rows={2} defaultValue={s.tagline} /></label>
      </div>
      <h3 className="sub">Banner takliflari</h3>
      <p className="note" style={{ margin: "4px 0 0" }}>Sarlavhasi boʻsh taklif saytda koʻrinmaydi.</p>
      <div className="box"><div className="fgrid"><F label="Emoji" name="offer1Emoji" value={s.offer1Emoji} /><F label="Sarlavha" name="offer1Title" value={s.offer1Title} /><F label="Izoh" name="offer1Text" value={s.offer1Text} /></div></div>
      <div className="box"><div className="fgrid"><F label="Emoji" name="offer2Emoji" value={s.offer2Emoji} /><F label="Sarlavha" name="offer2Title" value={s.offer2Title} /><F label="Izoh" name="offer2Text" value={s.offer2Text} /></div></div>

      <h2 className="sub">Yetkazib berish</h2>
      <div className="box">
        <div className="fgrid">
          <F label="Yetkazib berish narxi (soʻm)" name="shippingFee" type="number" value={s.shippingFee} extra={{ min: 0, step: 1000 }} />
          <F label="Bepul yetkazish chegarasi (soʻm)" name="freeFrom" type="number" value={s.freeFrom} extra={{ min: 0, step: 1000 }} />
          <F label="Toshkent shahri ichida" name="timeCity" value={s.timeCity} />
          <F label="Viloyatlarga" name="timeRegion" value={s.timeRegion} />
        </div>
        <p className="note" style={{ margin: 0 }}>Chegarani 0 qilsangiz, yetkazib berish doim pullik boʻladi. Narxni 0 qilsangiz, doim bepul.</p>
      </div>

      <h2 className="sub">Toʻlov usullari</h2>
      <div className="box checks">
        <label className="check"><input type="checkbox" name="payClick" defaultChecked={s.payClick} /> Click <small className="note">({configured.CLICK() ? "ulangan" : "kalit kiritilmagan"})</small></label>
        <label className="check"><input type="checkbox" name="payPayme" defaultChecked={s.payPayme} /> Payme <small className="note">({configured.PAYME() ? "ulangan" : "kalit kiritilmagan"})</small></label>
        <label className="check"><input type="checkbox" name="payUzum" defaultChecked={s.payUzum} /> Uzum <small className="note">(hali ulanmagan)</small></label>
        <label className="check"><input type="checkbox" name="payCash" defaultChecked={s.payCash} /> Naqd (olganda)</label>
      </div>
      <p className="note">Onlayn usul mijozga faqat ikki shart bajarilsa koʻrinadi: bu yerda yoqilgan va kalitlari serverning .env fayliga kiritilgan.</p>

      <h2 className="sub">Aloqa</h2>
      <p className="note">Toʻliq havola kiriting, masalan https://t.me/miyovuz. Boʻsh qoldirilgani saytda koʻrinmaydi.</p>
      <div className="box"><div className="fgrid">
        <F label="Telegram" name="telegram" type="url" value={s.telegram} />
        <F label="Instagram" name="instagram" type="url" value={s.instagram} />
        <F label="WhatsApp" name="whatsapp" type="url" value={s.whatsapp} />
        <F label="Telefon raqam" name="phone" value={s.phone} />
      </div></div>

      <h2 className="sub">Dorilar sahifasidagi ogohlantirish</h2>
      <div className="box"><F label="Matn" name="drugNote" value={s.drugNote} /></div>

      <button className="btn" type="submit" style={{ marginTop: 18 }}>Saqlash</button>
    </form>
  );
}
