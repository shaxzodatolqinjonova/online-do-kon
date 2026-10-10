"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useShop } from "./ShopProvider";
import { HeartIcon } from "./Stickers";

export function Header({ name, q }: { name: string; q?: string }) {
  const { cartCount, fav, ready } = useShop();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    setDark(t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);

  function toggleTheme() {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("miyov-theme", next);
    } catch {}
    setDark(!dark);
  }

  return (
    <header className="top">
      <div className="wrap bar">
        <Link className="brand" href="/" aria-label="Bosh sahifa">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <use href="#pawShape" fill="#ef93ae" />
          </svg>
          <span>{name}</span>
        </Link>
        <form className="search" action="/katalog" role="search">
          <label>
            <span className="sr">Mahsulot qidirish</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input name="q" type="search" defaultValue={q} placeholder="Masalan: shampun, boʻyinbogʻ…" autoComplete="off" />
          </label>
        </form>
        <button className="icon-btn" onClick={toggleTheme} aria-label={dark ? "Yorugʻ rejim" : "Qorongʻi rejim"} type="button">
          <span aria-hidden="true">{dark ? "☀️" : "🌙"}</span>
        </button>
        <Link className="icon-btn" href="/sevimlilar" aria-label="Sevimlilar">
          <HeartIcon />
          {ready && fav.length > 0 && <span className="count">{fav.length}</span>}
        </Link>
        <Link className="icon-btn" href="/savat" aria-label="Savat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 8h14l-1.3 10.2a2 2 0 0 1-2 1.8H8.3a2 2 0 0 1-2-1.8L5 8Z" />
            <path d="M9 10V7a3 3 0 0 1 6 0v3" />
          </svg>
          {ready && cartCount > 0 && <span className="count">{cartCount}</span>}
        </Link>
      </div>
    </header>
  );
}
