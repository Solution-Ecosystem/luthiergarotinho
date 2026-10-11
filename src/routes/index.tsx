import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo-crop.png";

const PHONE = "5511960219045";
const wa = (msg: string) => `https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`;
const WA = wa("Olá! Gostaria de fazer um orçamento.");

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Luthier Garotinho — Instrumentos e acessórios à venda" },
      { name: "description", content: "Instrumentos revisados e acessórios musicais à venda no Luthier Garotinho. Fale pelo WhatsApp." },
      { property: "og:title", content: "Luthier Garotinho — Instrumentos e acessórios" },
      { property: "og:description", content: "Instrumentos revisados por luthier e acessórios. Compre pelo WhatsApp." },
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

type Product = { id: string; name: string; kind: string; category: string; price: number; description: string; image_url: string | null };
const brl = (n: number) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Index() {
  const [kind, setKind] = useState<"todos" | "instrumento" | "acessorio">("todos");
  const [cat, setCat] = useState("Todos");
  const [q, setQ] = useState("");
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("active", true).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
  });

  const byKind = products.filter((p) => kind === "todos" || p.kind === kind);
  const cats = ["Todos", ...Array.from(new Set(byKind.map((p) => p.category).filter(Boolean)))];
  const catImg = (c: string) => byKind.find((p) => p.category === c && p.image_url)?.image_url;
  const list = byKind.filter((p) => (cat === "Todos" || p.category === cat) && p.name.toLowerCase().includes(q.toLowerCase()));
  const tabs = [["todos", "Todos"], ["instrumento", "Instrumentos"], ["acessorio", "Acessórios"]] as const;

  return (
    <main className="min-h-screen bg-background font-sans text-foreground">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-4">
          <div className="rounded-md bg-background p-1">
            <img src={logo} alt="Luthier Garotinho" className="h-16 w-auto" />
          </div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="O que você está procurando?"
            className="order-3 w-full flex-1 rounded-md bg-background px-4 py-3 text-foreground outline-none placeholder:italic placeholder:text-muted-foreground md:order-none md:w-auto" />
          <a href={WA} target="_blank" rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-2 rounded-md border border-primary-foreground px-4 py-3 font-semibold transition hover:bg-primary-foreground hover:text-primary md:ml-0">
            <WaIcon className="h-5 w-5" /> Fazer orçamento
          </a>
          <Link to="/admin" className="rounded-md bg-primary-foreground px-4 py-3 font-semibold text-primary transition hover:opacity-85">
            Área do dono
          </Link>
        </div>
        <nav className="border-t border-primary-foreground/15">
          <div className="mx-auto flex max-w-6xl gap-8 overflow-x-auto px-6 py-3 text-sm uppercase tracking-wider">
            {tabs.map(([k, l]) => (
              <button key={k} onClick={() => { setKind(k); setCat("Todos"); }}
                className={`whitespace-nowrap transition ${kind === k ? "font-semibold underline underline-offset-8" : "opacity-70 hover:opacity-100"}`}>{l}</button>
            ))}
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Início › À venda</p>
        <h1 className="mt-6 font-display text-4xl md:text-5xl">{kind === "acessorio" ? "Acessórios Musicais" : kind === "instrumento" ? "Instrumentos à Venda" : "Instrumentos e Acessórios"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{list.length} produtos encontrados</p>
        <p className="mt-4 max-w-3xl text-muted-foreground">
          Todos os instrumentos passam pela bancada do <strong className="text-foreground">Luthier Garotinho</strong>: regulados, revisados e prontos para tocar. Gostou de algum? Chame no WhatsApp.
        </p>

        {cats.length > 1 && (
          <div className="mt-10 flex gap-6 overflow-x-auto pb-2">
            {cats.map((c) => (
              <button key={c} onClick={() => setCat(c)} className="group flex w-24 shrink-0 flex-col items-center text-center">
                <span className={`flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 bg-muted font-display text-2xl transition ${cat === c ? "border-foreground" : "border-border group-hover:border-foreground"}`}>
                  {c !== "Todos" && catImg(c) ? <img src={catImg(c)!} alt={c} loading="lazy" className="h-full w-full object-cover mix-blend-multiply" /> : c[0]}
                </span>
                <span className="mt-2 text-sm font-medium">{c}</span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-12 grid grid-cols-2 gap-5 md:grid-cols-4">
          {list.map((p) => (
            <article key={p.id} className="group flex flex-col rounded-lg border bg-card p-4 transition hover:border-foreground hover:shadow-lg">
              <div className="aspect-square overflow-hidden rounded-md bg-muted">
                {p.image_url && <img src={p.image_url} alt={p.name} loading="lazy" className="h-full w-full object-contain transition duration-500 group-hover:scale-105" />}
              </div>
              <span className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{p.category}</span>
              <h2 className="mt-1 font-semibold leading-tight">{p.name}</h2>
              {p.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
              <p className="mt-2 font-display text-xl">{brl(p.price)}</p>
              <a href={wa(`Olá! Tenho interesse no ${p.name} (${brl(p.price)}).`)} target="_blank" rel="noopener noreferrer"
                className="mt-auto inline-flex items-center justify-center gap-2 rounded-md bg-primary py-2.5 pt-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-85 [margin-top:1rem]">
                <WaIcon className="h-4 w-4" /> Quero este
              </a>
            </article>
          ))}
          {!isLoading && list.length === 0 && <p className="col-span-full text-muted-foreground">Nenhum produto disponível no momento. Fale com a gente no WhatsApp!</p>}
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

      <footer className="py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Luthier Garotinho · <Link to="/admin" className="underline">Área do dono</Link>
      </footer>

      <a href={WA} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
        className="fixed bottom-5 right-5 rounded-full bg-accent p-4 text-accent-foreground shadow-xl transition hover:scale-110">
        <WaIcon className="h-7 w-7" />
      </a>
    </main>
  );
}
