import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import logo from "@/assets/logo.png.asset.json";
import violao from "@/assets/p-violao.jpg";
import guitarra from "@/assets/p-guitarra.jpg";
import baixo from "@/assets/p-baixo.jpg";
import cavaquinho from "@/assets/p-cavaquinho.jpg";

const PHONE = "5511960219045";
const wa = (msg: string) => `https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`;
const WA = wa("Olá! Gostaria de fazer um orçamento.");

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Luthier Garotinho — Instrumentos à venda" },
      { name: "description", content: "Violões, guitarras, baixos e cavaquinhos à venda e revisados pelo Luthier Garotinho. Fale pelo WhatsApp." },
      { property: "og:title", content: "Luthier Garotinho — Instrumentos à venda" },
      { property: "og:description", content: "Instrumentos revisados por luthier. Compre ou peça orçamento pelo WhatsApp." },
    ],
  }),
  component: Index,
});

function WaIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} fill-current`} aria-hidden>
      <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 2.5 1 3 .8 3.6.7.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
    </svg>
  );
}

const categories = [
  { id: "Todos", img: violao },
  { id: "Violões", img: violao },
  { id: "Guitarras", img: guitarra },
  { id: "Baixos", img: baixo },
  { id: "Cavaquinhos", img: cavaquinho },
];

const products = [
  { n: "Violão Folk Dreadnought", c: "Violões", p: "R$ 1.890", img: violao },
  { n: "Guitarra Stratocaster Preta", c: "Guitarras", p: "R$ 2.450", img: guitarra },
  { n: "Baixo Precision 4 Cordas", c: "Baixos", p: "R$ 2.190", img: baixo },
  { n: "Cavaquinho Tampo Maciço", c: "Cavaquinhos", p: "R$ 690", img: cavaquinho },
  { n: "Violão Nylon Clássico", c: "Violões", p: "R$ 980", img: violao },
  { n: "Guitarra Strato Vintage", c: "Guitarras", p: "R$ 3.200", img: guitarra },
  { n: "Baixo Passivo Revisado", c: "Baixos", p: "R$ 1.650", img: baixo },
  { n: "Cavaquinho Elétrico", c: "Cavaquinhos", p: "R$ 850", img: cavaquinho },
];

function Index() {
  const [cat, setCat] = useState("Todos");
  const [q, setQ] = useState("");
  const list = products.filter(
    (p) => (cat === "Todos" || p.c === cat) && p.n.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <main className="min-h-screen bg-background font-sans text-foreground">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-4">
          <div className="rounded-md bg-background px-2 py-1">
            <img src={logo.url} alt="Luthier Garotinho" className="h-10 w-auto" />
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="O que você está procurando?"
            className="order-3 w-full flex-1 rounded-md bg-background px-4 py-3 text-foreground outline-none placeholder:italic placeholder:text-muted-foreground md:order-none md:w-auto"
          />
          <a href={WA} target="_blank" rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-2 rounded-md border border-primary-foreground px-4 py-3 font-semibold transition hover:bg-primary-foreground hover:text-primary md:ml-0">
            <WaIcon className="h-5 w-5" /> Fazer orçamento
          </a>
        </div>
        <nav className="border-t border-primary-foreground/15">
          <div className="mx-auto flex max-w-6xl gap-8 overflow-x-auto px-6 py-3 text-sm uppercase tracking-wider">
            {categories.map((c) => (
              <button key={c.id} onClick={() => setCat(c.id)}
                className={`whitespace-nowrap transition ${cat === c.id ? "font-semibold underline underline-offset-8" : "opacity-70 hover:opacity-100"}`}>
                {c.id}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Início › Instrumentos à venda</p>
        <h1 className="mt-6 font-display text-4xl md:text-5xl">Instrumentos à Venda</h1>
        <p className="mt-1 text-sm text-muted-foreground">{list.length} produtos encontrados</p>
        <p className="mt-4 max-w-3xl text-muted-foreground">
          Todos os instrumentos passam pela bancada do <strong className="text-foreground">Luthier Garotinho</strong>: regulados, revisados e prontos para tocar. Gostou de algum? Chame no WhatsApp.
        </p>

        <div className="mt-10 flex gap-6 overflow-x-auto pb-2">
          {categories.slice(1).map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} className="group flex w-24 shrink-0 flex-col items-center text-center">
              <span className={`flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 bg-muted transition ${cat === c.id ? "border-foreground" : "border-border group-hover:border-foreground"}`}>
                <img src={c.img} alt={c.id} loading="lazy" width={816} height={816} className="h-full w-full object-cover mix-blend-multiply" />
              </span>
              <span className="mt-2 text-sm font-medium">{c.id}</span>
            </button>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-2 gap-5 md:grid-cols-4">
          {list.map((p) => (
            <article key={p.n} className="group flex flex-col rounded-lg border bg-card p-4 transition hover:border-foreground hover:shadow-lg">
              <div className="aspect-square overflow-hidden rounded-md bg-card">
                <img src={p.img} alt={p.n} loading="lazy" width={816} height={816} className="h-full w-full object-contain transition duration-500 group-hover:scale-105" />
              </div>
              <span className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{p.c}</span>
              <h2 className="mt-1 font-semibold leading-tight">{p.n}</h2>
              <p className="mt-2 font-display text-xl">{p.p}</p>
              <a href={wa(`Olá! Tenho interesse no ${p.n} (${p.p}).`)} target="_blank" rel="noopener noreferrer"
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-85">
                <WaIcon className="h-4 w-4" /> Quero este
              </a>
            </article>
          ))}
          {list.length === 0 && <p className="col-span-full text-muted-foreground">Nenhum instrumento encontrado.</p>}
        </div>
      </section>

      <section className="bg-primary py-14 text-center text-primary-foreground">
        <h2 className="font-display text-2xl md:text-3xl">Precisa de ajuste ou restauração?</h2>
        <p className="mt-2 opacity-75">Ajustes, manutenção e restauração. Orçamento sem compromisso.</p>
        <a href={WA} target="_blank" rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-3 rounded-full bg-primary-foreground px-8 py-4 font-semibold text-primary transition hover:scale-105">
          <WaIcon /> Fazer orçamento no WhatsApp
        </a>
        <p className="mt-3 text-sm opacity-60">(11) 96021-9045</p>
      </section>

      <footer className="py-8 text-center text-sm text-muted-foreground">© {new Date().getFullYear()} Luthier Garotinho</footer>

      <a href={WA} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
        className="fixed bottom-5 right-5 rounded-full bg-accent p-4 text-accent-foreground shadow-xl transition hover:scale-110">
        <WaIcon className="h-7 w-7" />
      </a>
    </main>
  );
}
