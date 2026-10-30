import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo-crop.png";
import hero from "@/assets/hero-street.jpg";

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function WaIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} fill-current`} aria-hidden>
      <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.700-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 2.5 1 3 .8 3.6.7.6-.1 1.8-.7 2-1.4.2-.7.2-1.300.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.300-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
    </svg>
  );
}

type Product = { id: string; name: string; kind: string; category: string; price: number; description: string; image_url: string | null };
const brl = (n: number) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const TAPE = ["Ajuste", "Regulagem", "Restauração", "Troca de cordas", "Elétrica", "Instrumentos revisados", "Acessórios", "Orçamento no zap"];

function Marquee({ inverse = false }: { inverse?: boolean }) {
  const items = [...TAPE, ...TAPE];
  return (
    <div className={`overflow-hidden border-y-4 border-foreground py-3 ${inverse ? "bg-background text-foreground" : "bg-primary text-primary-foreground"}`}>
      <div className="animate-marquee flex w-max gap-8 whitespace-nowrap font-street text-xl uppercase tracking-wide md:text-2xl">
        {items.map((t, i) => (
          <span key={i} className="flex items-center gap-8">{t}<span aria-hidden>✦</span></span>
        ))}
      </div>
    </div>
  );
}

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
  const title = kind === "acessorio" ? "Acessórios" : kind === "instrumento" ? "Instrumentos" : "Na vitrine";

  return (
    <main className="min-h-screen bg-background font-sans text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b-4 border-foreground bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 md:gap-4 md:px-6">
          <Link to="/" className="-rotate-2 border-2 border-primary-foreground bg-background p-1 shadow-hard-inverse transition hover:rotate-0">
            <img src={logo} alt="Luthier Garotinho" className="h-12 w-auto md:h-14" />
          </Link>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="procura aí: guitarra, baixo, cordas…"
            className="order-3 w-full flex-1 border-2 border-primary-foreground bg-primary px-4 py-2.5 font-mono text-sm text-primary-foreground outline-none placeholder:text-primary-foreground/50 focus:bg-background focus:text-foreground md:order-none md:w-auto" />
          <a href={WA} target="_blank" rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-2 border-2 border-primary-foreground px-4 py-2.5 font-street text-sm uppercase tracking-wider transition hover:bg-primary-foreground hover:text-primary md:ml-0">
            <WaIcon className="h-4 w-4" /> Orçamento
          </a>
          <Link to="/admin" className="border-2 border-primary-foreground bg-primary-foreground px-4 py-2.5 font-street text-sm uppercase tracking-wider text-primary transition hover:-translate-y-0.5 hover:shadow-hard-inverse">
            Área do dono
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="grain relative overflow-hidden bg-primary text-primary-foreground">
        <img src={hero} alt="Guitarra encostada em muro grafitado" width={1600} height={912}
          className="absolute inset-0 h-full w-full object-cover opacity-70 grayscale" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/70 to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
          <span className="inline-block -rotate-3 bg-primary-foreground px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-primary">
            Est. na bancada · SP
          </span>
          <h1 className="mt-6 font-street text-6xl uppercase leading-[0.9] md:text-8xl">
            Do bairro<br />
            <span className="text-outline">pro palco.</span>
          </h1>
          <p className="mt-3 -rotate-2 font-marker text-3xl md:text-4xl">Garotinho</p>
          <p className="mt-6 max-w-md text-lg opacity-85">
            Instrumento regulado, revisado e pronto pra tocar. Escolheu? Chama no zap e fecha direto com o luthier.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a href="#vitrine" className="border-2 border-primary-foreground bg-primary-foreground px-6 py-3 font-street uppercase tracking-wider text-primary transition hover:-translate-x-1 hover:-translate-y-1 hover:shadow-hard-inverse">
              Ver a vitrine
            </a>
            <a href={WA} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border-2 border-primary-foreground px-6 py-3 font-street uppercase tracking-wider transition hover:bg-primary-foreground hover:text-primary">
              <WaIcon className="h-5 w-5" /> Fazer orçamento
            </a>
          </div>
        </div>
      </section>

      <Marquee inverse />

      {/* Store */}
      <section id="vitrine" className="bg-concrete">
        <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">// Início › À venda</p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-street text-5xl uppercase leading-none md:text-7xl">{title}</h2>
            <span className="rotate-2 border-2 border-foreground bg-background px-3 py-1 font-mono text-sm font-bold shadow-hard-sm">
              {list.length} {list.length === 1 ? "item" : "itens"}
            </span>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {tabs.map(([k, l]) => (
              <button key={k} onClick={() => { setKind(k); setCat("Todos"); }}
                className={`border-2 border-foreground px-5 py-2 font-street text-sm uppercase tracking-wider transition ${kind === k ? "bg-primary text-primary-foreground shadow-hard-sm" : "bg-background hover:-translate-y-0.5 hover:shadow-hard-sm"}`}>
                {l}
              </button>
            ))}
          </div>

          {cats.length > 1 && (
            <div className="mt-8 flex gap-5 overflow-x-auto pb-4 pt-2">
              {cats.map((c, i) => (
                <button key={c} onClick={() => setCat(c)}
                  className={`group flex w-24 shrink-0 flex-col items-center text-center transition ${i % 2 ? "rotate-2" : "-rotate-2"} hover:rotate-0`}>
                  <span className={`flex h-24 w-24 items-center justify-center overflow-hidden border-2 border-foreground bg-background font-street text-3xl transition ${cat === c ? "shadow-hard" : "group-hover:shadow-hard-sm"}`}>
                    {c !== "Todos" && catImg(c) ? <img src={catImg(c)!} alt={c} loading="lazy" className="h-full w-full object-cover grayscale" /> : c[0]}
                  </span>
                  <span className={`mt-2 px-1 font-mono text-xs uppercase ${cat === c ? "bg-primary text-primary-foreground" : ""}`}>{c}</span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-6">
            {list.map((p) => (
              <article key={p.id} className="group relative flex flex-col border-2 border-foreground bg-card transition hover:-translate-x-1 hover:-translate-y-1 hover:shadow-hard">
                <span className="absolute -right-2 -top-3 z-10 rotate-6 bg-primary px-2 py-0.5 font-marker text-xs text-primary-foreground">
                  {p.kind === "acessorio" ? "acessório" : "revisado"}
                </span>
                <div className="aspect-square overflow-hidden border-b-2 border-foreground bg-muted">
                  {p.image_url && <img src={p.image_url} alt={p.name} loading="lazy" className="h-full w-full object-contain transition duration-500 group-hover:scale-105" />}
                </div>
                <div className="flex flex-1 flex-col p-3 md:p-4">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{p.category}</span>
                  <h3 className="mt-1 font-street text-lg uppercase leading-tight">{p.name}</h3>
                  {p.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
                  <p className="mt-3 inline-block self-start bg-primary px-2 font-street text-xl text-primary-foreground">{brl(p.price)}</p>
                  <a href={wa(`Olá! Tenho interesse no ${p.name} (${brl(p.price)}).`)} target="_blank" rel="noopener noreferrer"
                    className="mt-auto inline-flex items-center justify-center gap-2 border-2 border-foreground py-2.5 font-street text-sm uppercase tracking-wider transition hover:bg-primary hover:text-primary-foreground [margin-top:1rem]">
                    <WaIcon className="h-4 w-4" /> Quero este
                  </a>
                </div>
              </article>
            ))}
            {!isLoading && list.length === 0 && (
              <p className="col-span-full border-2 border-dashed border-foreground bg-background p-8 text-center font-mono text-sm">
                Nada na vitrine agora. Chama a gente no WhatsApp!
              </p>
            )}
          </div>
        </div>
      </section>

      <Marquee />

      {/* Repair CTA */}
      <section className="grain relative overflow-hidden bg-primary py-20 text-primary-foreground">
        <p aria-hidden className="pointer-events-none absolute -left-4 top-1/2 -translate-y-1/2 select-none whitespace-nowrap font-street text-[9rem] uppercase leading-none opacity-[0.06] md:text-[14rem]">
          Oficina
        </p>
        <div className="relative mx-auto max-w-4xl px-4 text-center md:px-6">
          <p className="-rotate-2 font-marker text-2xl">tá desafinado?</p>
          <h2 className="mt-3 font-street text-4xl uppercase leading-none md:text-6xl">Ajuste, manutenção<br />e restauração</h2>
          <p className="mx-auto mt-4 max-w-lg opacity-75">Leva teu instrumento pra bancada. Orçamento sem compromisso, direto no WhatsApp.</p>
          <a href={WA} target="_blank" rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-3 border-2 border-primary-foreground bg-primary-foreground px-8 py-4 font-street text-lg uppercase tracking-wider text-primary transition hover:-translate-x-1 hover:-translate-y-1 hover:shadow-hard-inverse">
            <WaIcon /> Fazer orçamento no zap
          </a>
          <p className="mt-4 font-mono text-sm opacity-60">(11) 96021-9045</p>
        </div>
      </section>

      <footer className="border-t-4 border-foreground bg-background py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 font-mono text-xs uppercase tracking-widest md:px-6">
          <span>© {new Date().getFullYear()} Luthier Garotinho</span>
          <Link to="/admin" className="underline underline-offset-4">Área do dono</Link>
        </div>
      </footer>

      <a href={WA} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
        className="fixed bottom-5 right-5 z-50 border-2 border-foreground bg-accent p-4 text-accent-foreground shadow-hard transition hover:-translate-y-1">
        <WaIcon className="h-7 w-7" />
      </a>
    </main>
  );
}
