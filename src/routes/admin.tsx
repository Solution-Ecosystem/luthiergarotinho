import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import {
  Package, FileText, UserCheck, Eye, EyeOff, Pencil, Trash2, Search, ImagePlus, LogOut, Store, Plus, X, Guitar,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { OSForm } from "@/components/OSForm";
import { AdminRequests } from "@/components/AdminRequests";
import logo from "@/assets/logo-crop.png";
import { aBtn, aBtnGhost, aChip, aIn, aInput, aLabel, aPanel } from "@/lib/admin-styles";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Painel do Administrador — Luthier Garotinho" },
      { name: "description", content: "Área do dono para cadastrar instrumentos e acessórios à venda." },
      { property: "og:title", content: "Painel — Luthier Garotinho" },
      { property: "og:description", content: "Cadastro de instrumentos e acessórios." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Product = {
  id: string; name: string; kind: string; category: string; price: number;
  description: string; image_url: string | null; active: boolean;
};

const brl = (n: number) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin")
      .then(({ data }) => setIsAdmin(!!data?.length));
  }, [session]);

  if (!ready) return null;
  return (
    <main className="min-h-screen bg-concrete font-sans text-foreground">
      <Toaster position="top-center" richColors />
      <header className="sticky top-0 z-40 border-b-4 border-foreground bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 md:px-6">
          <Link to="/" className="-rotate-2 border-2 border-primary-foreground bg-background p-1 shadow-hard-inverse transition hover:rotate-0">
            <img src={logo} alt="Luthier Garotinho" className="h-10 w-auto md:h-12" />
          </Link>
          <div className="leading-tight">
            <p className="font-street text-lg uppercase tracking-wide md:text-xl">Painel do dono</p>
            {session && <p className="hidden font-mono text-xs opacity-70 sm:block">{session.user.email}</p>}
          </div>
          <div className="ml-auto flex gap-2">
            <Link to="/" className="inline-flex items-center gap-2 border-2 border-primary-foreground px-3 py-2 font-street text-xs uppercase tracking-wider transition hover:bg-primary-foreground hover:text-primary">
              <Store className="h-4 w-4" /> <span className="hidden sm:inline">Ver loja</span>
            </Link>
            {session && (
              <button onClick={() => supabase.auth.signOut()} className="inline-flex items-center gap-2 border-2 border-primary-foreground bg-primary-foreground px-3 py-2 font-street text-xs uppercase tracking-wider text-primary transition hover:-translate-y-0.5 hover:shadow-hard-inverse">
                <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sair</span>
              </button>
            )}
          </div>
        </div>
      </header>
      {!session ? <Login /> : isAdmin === null ? <Loading /> : isAdmin ? <AdminTabs email={session.user.email ?? ""} /> : (
        <div className={`mx-auto mt-16 max-w-md text-center ${aPanel} ${aIn}`}>
          <p className="font-street text-3xl uppercase">Segura aí!</p>
          <p className="mt-3 text-muted-foreground">Seu cadastro está aguardando aprovação do administrador.</p>
        </div>
      )}
    </main>
  );
}

function Loading() {
  return (
    <div className="mx-auto grid max-w-6xl gap-4 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse border-2 border-foreground bg-muted" />)}
    </div>
  );
}

function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg("");
    const { data, error } = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password: pw })
      : await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: window.location.origin + "/admin" } });
    setBusy(false);
    if (error) setMsg(error.message);
    else if (mode === "up" && !data.session) setMsg("Conta criada! Confirme pelo link enviado ao seu e-mail.");
  }

  return (
    <div className="px-4 py-16">
      <form onSubmit={submit} className={`mx-auto max-w-sm space-y-4 ${aPanel} ${aIn}`}>
        <span className="inline-block -rotate-3 bg-primary px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-primary-foreground">Acesso restrito</span>
        <h1 className="font-street text-4xl uppercase leading-none">{mode === "in" ? "Entrar" : "Criar conta"}</h1>
        <input className={aInput} type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className={aInput} type="password" placeholder="Senha" minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} required />
        <button className={`${aBtn} w-full`} disabled={busy}>{busy ? "Aguarde..." : mode === "in" ? "Entrar" : "Criar conta"}</button>
        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full text-sm underline">
          {mode === "in" ? "Primeiro acesso? Criar conta" : "Já tenho conta"}
        </button>
      </form>
    </div>
  );
}

type Tab = "produtos" | "os" | "aprov";
type Stats = { visiveis: number; ocultos: number; os: number; pendentes: number };

function AdminTabs({ email }: { email: string }) {
  const [tab, setTab] = useState<Tab>("produtos");
  const [stats, setStats] = useState<Stats | null>(null);

  const loadStats = useCallback(async () => {
    const [p, os, req] = await Promise.all([
      supabase.from("products").select("active"),
      supabase.from("service_orders").select("id", { count: "exact", head: true }),
      supabase.from("admin_requests").select("status"),
    ]);
    const prods = (p.data as { active: boolean }[]) ?? [];
    setStats({
      visiveis: prods.filter((x) => x.active).length,
      ocultos: prods.filter((x) => !x.active).length,
      os: os.count ?? 0,
      pendentes: ((req.data as { status: string }[]) ?? []).filter((r) => r.status === "pendente").length,
    });
  }, []);
  useEffect(() => { loadStats(); }, [loadStats]);

  const nome = email.split("@")[0];
  const cards: { k: Tab; label: string; value: number | undefined; icon: typeof Package }[] = [
    { k: "produtos", label: "Na vitrine", value: stats?.visiveis, icon: Guitar },
    { k: "produtos", label: "Ocultos", value: stats?.ocultos, icon: EyeOff },
    { k: "os", label: "OS emitidas", value: stats?.os, icon: FileText },
    { k: "aprov", label: "Cadastros pendentes", value: stats?.pendentes, icon: UserCheck },
  ];
  const tabs: { k: Tab; label: string; icon: typeof Package; badge?: number }[] = [
    { k: "produtos", label: "Produtos à venda", icon: Package },
    { k: "os", label: "Ordem de Serviço", icon: FileText },
    { k: "aprov", label: "Aprovação de cadastros", icon: UserCheck, badge: stats?.pendentes },
  ];

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-8 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className={aLabel}>// {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</p>
            <h1 className="mt-1 font-street text-4xl uppercase leading-none md:text-6xl">E aí, <span className="font-marker normal-case">{nome}</span></h1>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {cards.map((c, i) => (
            <button key={c.label} onClick={() => setTab(c.k)}
              className={`group border-2 border-foreground bg-card p-4 text-left shadow-hard-sm transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard ${i % 2 ? "rotate-[0.6deg]" : "-rotate-[0.6deg]"} hover:rotate-0`}>
              <div className="flex items-center justify-between">
                <span className={aLabel}>{c.label}</span>
                <c.icon className="h-5 w-5 transition group-hover:scale-110" />
              </div>
              <p className="mt-2 font-street text-4xl leading-none md:text-5xl">
                {c.value === undefined ? <span className="inline-block h-10 w-12 animate-pulse bg-muted" /> : c.value}
              </p>
            </button>
          ))}
        </div>
      </section>

      <nav className="sticky top-[68px] z-30 mt-8 border-y-4 border-foreground bg-background md:top-[76px]">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3 md:px-6">
          {tabs.map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`relative inline-flex shrink-0 items-center gap-2 border-2 border-foreground px-4 py-2 font-street text-sm uppercase tracking-wider transition ${tab === t.k ? "bg-primary text-primary-foreground shadow-hard-sm" : "bg-background hover:-translate-y-0.5 hover:shadow-hard-sm"}`}>
              <t.icon className="h-4 w-4" /> {t.label}
              {!!t.badge && (
                <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full border-2 border-foreground bg-destructive px-1 font-mono text-[10px] font-bold text-destructive-foreground">{t.badge}</span>
              )}
            </button>
          ))}
        </div>
      </nav>

      <div key={tab} className={aIn}>
        {tab === "produtos" ? <Dashboard onChanged={loadStats} /> : tab === "os" ? <OSForm onChanged={loadStats} /> : <AdminRequests onChanged={loadStats} />}
      </div>
    </>
  );
}

const empty = { name: "", kind: "instrumento", category: "", price: "", description: "", active: true };
type Filter = "todos" | "instrumento" | "acessorio" | "ocultos";

function Dashboard({ onChanged }: { onChanged: () => void }) {
  const [items, setItems] = useState<Product[] | null>(null);
  const [form, setForm] = useState<typeof empty>(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [editImg, setEditImg] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("todos");
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  async function load() {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setItems((data as Product[]) ?? []);
  }
  useEffect(() => { load(); }, []);

  function reset() {
    setForm(empty); setEditId(null); setEditImg(null); setFile(null); setErr("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    let image_url: string | undefined;
    if (file) {
      const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.]/g, "_")}`;
      const up = await supabase.storage.from("products").upload(path, file);
      if (up.error) { setErr(up.error.message); setBusy(false); return; }
      const s = await supabase.storage.from("products").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      image_url = s.data?.signedUrl;
    }
    const row = { ...form, price: Number(String(form.price).replace(/\./g, "").replace(",", ".")) || 0, ...(image_url ? { image_url } : {}) };
    const res = editId
      ? await supabase.from("products").update(row).eq("id", editId)
      : await supabase.from("products").insert(row);
    setBusy(false);
    if (res.error) { setErr(res.error.message); return; }
    toast.success(editId ? "Item atualizado!" : "Item cadastrado na vitrine!");
    reset(); load(); onChanged();
  }

  async function toggle(p: Product) {
    setItems((list) => list?.map((x) => (x.id === p.id ? { ...x, active: !x.active } : x)) ?? null);
    const { error } = await supabase.from("products").update({ active: !p.active }).eq("id", p.id);
    if (error) { toast.error(error.message); load(); return; }
    toast(p.active ? "Item escondido da loja" : "Item visível na loja");
    onChanged();
  }

  async function remove(p: Product) {
    if (!confirm(`Excluir "${p.name}"?`)) return;
    await supabase.from("products").delete().eq("id", p.id);
    toast("Item excluído");
    if (editId === p.id) reset();
    load(); onChanged();
  }

  function edit(p: Product) {
    setEditId(p.id); setEditImg(p.image_url); setFile(null);
    setForm({ name: p.name, kind: p.kind, category: p.category, price: String(p.price).replace(".", ","), description: p.description, active: p.active });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const cats = Array.from(new Set((items ?? []).map((p) => p.category).filter(Boolean)));
  const list = (items ?? []).filter((p) =>
    (filter === "todos" || (filter === "ocultos" ? !p.active : p.kind === filter)) &&
    `${p.name} ${p.category}`.toLowerCase().includes(q.toLowerCase()));
  const filters: [Filter, string][] = [["todos", "Todos"], ["instrumento", "Instrumentos"], ["acessorio", "Acessórios"], ["ocultos", "Ocultos"]];
  const shownImg = preview ?? editImg;

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:px-6 lg:grid-cols-[380px_1fr]">
      <form ref={formRef} onSubmit={save} className={`h-fit scroll-mt-40 space-y-3 lg:sticky lg:top-40 ${aPanel} ${editId ? "ring-4 ring-foreground/20" : ""}`}>
        <div className="flex items-center justify-between">
          <h2 className="font-street text-2xl uppercase">{editId ? "Editando" : "Novo item"}</h2>
          {editId && <button type="button" onClick={reset} aria-label="Cancelar edição" className="border-2 border-foreground p-1 transition hover:bg-primary hover:text-primary-foreground"><X className="h-4 w-4" /></button>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {["instrumento", "acessorio"].map((k) => (
            <button type="button" key={k} onClick={() => setForm({ ...form, kind: k })} className={aChip(form.kind === k)}>
              {k === "instrumento" ? "Instrumento" : "Acessório"}
            </button>
          ))}
        </div>

        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f?.type.startsWith("image/")) setFile(f); }}
          className={`relative grid aspect-[4/3] cursor-pointer place-items-center overflow-hidden border-2 border-dashed border-foreground bg-muted transition ${drag ? "scale-[1.02] bg-background" : "hover:bg-background"}`}>
          {shownImg ? (
            <>
              <img src={shownImg} alt="Prévia" className="h-full w-full object-contain" />
              <span className="absolute bottom-2 right-2 bg-primary px-2 py-1 font-mono text-[10px] uppercase text-primary-foreground">Trocar foto</span>
            </>
          ) : (
            <div className="text-center text-muted-foreground">
              <ImagePlus className="mx-auto h-8 w-8" />
              <p className="mt-2 text-sm font-semibold">Clique ou arraste a foto</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>

        <input className={aInput} placeholder="Nome (ex: Violão Giannini)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className={aInput} list="cats" placeholder="Categoria (ex: Violões, Cordas)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
        <datalist id="cats">{cats.map((c) => <option key={c} value={c} />)}</datalist>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm font-bold">R$</span>
          <input className={`${aInput} pl-10`} placeholder="1890,00" inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
        </div>
        <textarea className={aInput} rows={3} placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button type="button" onClick={() => setForm({ ...form, active: !form.active })}
          className="flex w-full items-center justify-between border-2 border-foreground bg-background px-3 py-2 text-sm font-semibold">
          <span className="flex items-center gap-2">{form.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />} Visível no site</span>
          <span className={`relative h-6 w-11 rounded-full border-2 border-foreground transition ${form.active ? "bg-primary" : "bg-muted"}`}>
            <span className={`absolute top-0.5 h-4 w-4 rounded-full border-2 border-foreground bg-background transition-all ${form.active ? "left-5" : "left-0.5"}`} />
          </span>
        </button>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button className={`${aBtn} w-full`} disabled={busy}>
          {busy ? "Salvando..." : editId ? "Salvar alterações" : <><Plus className="h-4 w-4" /> Cadastrar item</>}
        </button>
      </form>

      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-street text-3xl uppercase leading-none md:text-4xl">Itens cadastrados</h2>
          <span className="rotate-2 border-2 border-foreground bg-background px-3 py-1 font-mono text-sm font-bold shadow-hard-sm">
            {list.length} {list.length === 1 ? "item" : "itens"}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input className={`${aInput} pl-9`} placeholder="Buscar por nome ou categoria" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.map(([k, l]) => <button key={k} onClick={() => setFilter(k)} className={aChip(filter === k)}>{l}</button>)}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items === null && [0, 1, 2].map((i) => <div key={i} className="h-72 animate-pulse border-2 border-foreground bg-muted" />)}
          {list.map((p, i) => (
            <article key={p.id} style={{ animationDelay: `${i * 40}ms` }}
              className={`group flex flex-col border-2 border-foreground bg-card shadow-hard-sm transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard animate-in fade-in slide-in-from-bottom-2 fill-mode-both ${editId === p.id ? "ring-4 ring-foreground/30" : ""} ${!p.active ? "opacity-60" : ""}`}>
              <div className="relative aspect-square overflow-hidden border-b-2 border-foreground bg-muted">
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} loading="lazy" className="h-full w-full object-contain p-2 transition duration-300 group-hover:scale-105" />
                  : <div className="grid h-full place-items-center text-muted-foreground"><ImagePlus className="h-8 w-8" /></div>}
                <span className="absolute left-2 top-2 -rotate-2 bg-primary px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-primary-foreground">
                  {p.kind === "acessorio" ? "Acessório" : "Instrumento"}
                </span>
                {!p.active && <span className="absolute right-2 top-2 rotate-2 border-2 border-foreground bg-background px-2 py-0.5 font-mono text-[10px] font-bold uppercase">Oculto</span>}
              </div>
              <div className="flex flex-1 flex-col p-3">
                <p className={aLabel}>{p.category}</p>
                <h3 className="mt-1 line-clamp-2 font-semibold leading-tight">{p.name}</h3>
                <p className="mt-auto pt-2 font-street text-2xl">{brl(p.price)}</p>
              </div>
              <div className="grid grid-cols-3 border-t-2 border-foreground">
                <button onClick={() => toggle(p)} title={p.active ? "Esconder da loja" : "Mostrar na loja"}
                  className="grid place-items-center py-2 transition hover:bg-primary hover:text-primary-foreground">
                  {p.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button onClick={() => edit(p)} title="Editar" className="grid place-items-center border-x-2 border-foreground py-2 transition hover:bg-primary hover:text-primary-foreground">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => remove(p)} title="Excluir" className="grid place-items-center py-2 text-destructive transition hover:bg-destructive hover:text-destructive-foreground">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
        {items !== null && list.length === 0 && (
          <div className="mt-5 border-2 border-dashed border-foreground bg-background p-10 text-center">
            <p className="font-street text-2xl uppercase">Nada por aqui</p>
            <p className="mt-1 text-sm text-muted-foreground">{items.length === 0 ? "Cadastre o primeiro item no formulário." : "Nenhum item com esse filtro."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
