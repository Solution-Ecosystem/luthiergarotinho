import { createFileRoute } from "@tanstack/react-router";
import logo from "@/assets/logo.png.asset.json";

const WA = "https://wa.me/5511960219045?text=" + encodeURIComponent("Olá! Gostaria de fazer um orçamento.");

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Luthier Garotinho — Orçamento pelo WhatsApp" },
      { name: "description", content: "Ajustes, manutenção e restauração de violões, guitarras, baixos e cavaquinhos. Peça seu orçamento pelo WhatsApp." },
      { property: "og:title", content: "Luthier Garotinho" },
      { property: "og:description", content: "Ajustes, manutenção e restauração de instrumentos. Orçamento pelo WhatsApp." },
    ],
  }),
  component: Index,
});

function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
      <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 2.5 1 3 .8 3.6.7.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
    </svg>
  );
}

const services = [
  { t: "Ajustes", d: "Regulagem de altura das cordas, oitavas, tensor e trastes para o instrumento tocar macio." },
  { t: "Manutenção", d: "Limpeza, troca de cordas, eletrônica, captadores e tarraxas." },
  { t: "Restauração", d: "Colagens, trincas, reparos de madeira e acabamento para dar vida nova ao seu instrumento." },
];

function Index() {
  return (
    <main className="min-h-screen bg-background font-sans text-foreground">
      <section className="mx-auto flex max-w-5xl flex-col items-center px-6 pb-16 pt-10 text-center">
        <img src={logo.url} alt="Luthier Garotinho" className="w-72 md:w-96" />
        <h1 className="mt-6 font-display text-3xl md:text-5xl">Seu instrumento em boas mãos</h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Violão, guitarra, baixo, cavaquinho e ukulele. Mande uma mensagem e receba seu orçamento sem compromisso.
        </p>
        <a href={WA} target="_blank" rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-3 rounded-full bg-accent px-8 py-4 text-lg font-semibold text-accent-foreground shadow-lg transition hover:scale-105">
          <WaIcon /> Fazer orçamento no WhatsApp
        </a>
        <p className="mt-3 text-sm text-muted-foreground">(11) 96021-9045</p>
      </section>

      <section className="bg-primary py-16 text-primary-foreground">
        <div className="mx-auto grid max-w-5xl gap-6 px-6 md:grid-cols-3">
          {services.map((s) => (
            <div key={s.t} className="rounded-xl border border-primary-foreground/20 p-6">
              <h2 className="font-display text-xl">{s.t}</h2>
              <p className="mt-2 opacity-85">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h2 className="font-display text-2xl md:text-3xl">Como funciona</h2>
        <ol className="mt-8 grid gap-6 text-left md:grid-cols-3">
          {["Clique no botão e fale com a gente no WhatsApp", "Conte o problema e envie fotos do instrumento", "Receba o orçamento e combine a entrega"].map((s, i) => (
            <li key={s} className="rounded-xl bg-card p-5 shadow-sm">
              <span className="font-display text-3xl text-secondary">{i + 1}</span>
              <p className="mt-2">{s}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Luthier Garotinho
      </footer>

      <a href={WA} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
        className="fixed bottom-5 right-5 rounded-full bg-accent p-4 text-accent-foreground shadow-xl transition hover:scale-110">
        <WaIcon />
      </a>
    </main>
  );
}
