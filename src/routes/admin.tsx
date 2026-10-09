import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Painel do Administrador — Luthier Garotinho" },
      { name: "description", content: "Área do dono para cadastrar instrumentos e acessórios à venda." },
      { property: "og:title", content: "Painel — Luthier Garotinho" },
      { property: "og:description", content: "Cadastro de instrumentos e acessórios." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Product = {
  id: string; name: string; kind: string; category: string; price: number;
  description: string; image_url: string | null; active: boolean;
};

const input = "w-full rounded-md border bg-background px-3 py-2 outline-none focus:border-foreground";
const btn = "rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground transition hover:opacity-85 disabled:opacity-50";

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
    <main className="min-h-screen bg-muted font-sans text-foreground">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-lg">Luthier Garotinho · Admin</Link>
          {session && (
            <button onClick={() => supabase.auth.signOut()} className="text-sm underline">Sair</button>
          )}
        </div>
      </header>
      {!session ? <Login /> : isAdmin === null ? null : isAdmin ? <Dashboard /> : (
        <p className="p-10 text-center">Esta conta não tem acesso de administrador.</p>
      )}
    </main>
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
    <form onSubmit={submit} className="mx-auto mt-16 max-w-sm space-y-4 rounded-lg border bg-card p-8">
      <h1 className="font-display text-2xl">{mode === "in" ? "Entrar" : "Criar conta"}</h1>
      <input className={input} type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input className={input} type="password" placeholder="Senha" minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} required />
      <button className={`${btn} w-full`} disabled={busy}>{mode === "in" ? "Entrar" : "Criar conta"}</button>
      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
      <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full text-sm underline">
        {mode === "in" ? "Primeiro acesso? Criar conta" : "Já tenho conta"}
      </button>
    </form>
  );
}

const empty = { name: "", kind: "instrumento", category: "", price: "", description: "", active: true };

function Dashboard() {
  const [items, setItems] = useState<Product[]>([]);
  const [form, setForm] = useState<typeof empty>(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setItems((data as Product[]) ?? []);
  }
  useEffect(() => { load(); }, []);

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
    const row = { ...form, price: Number(String(form.price).replace(",", ".")) || 0, ...(image_url ? { image_url } : {}) };
    const res = editId
      ? await supabase.from("products").update(row).eq("id", editId)
      : await supabase.from("products").insert(row);
    setBusy(false);
    if (res.error) { setErr(res.error.message); return; }
    setForm(empty); setEditId(null); setFile(null);
    (document.getElementById("img") as HTMLInputElement).value = "";
    load();
  }

  async function remove(id: string) {
    if (!confirm("Excluir este item?")) return;
    await supabase.from("products").delete().eq("id", id); load();
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[380px_1fr]">
      <form onSubmit={save} className="h-fit space-y-3 rounded-lg border bg-card p-6">
        <h2 className="font-display text-xl">{editId ? "Editar item" : "Novo item"}</h2>
        <div className="flex gap-2">
          {["instrumento", "acessorio"].map((k) => (
            <button type="button" key={k} onClick={() => setForm({ ...form, kind: k })}
              className={`flex-1 rounded-md border py-2 text-sm font-semibold ${form.kind === k ? "border-foreground bg-primary text-primary-foreground" : ""}`}>
              {k === "instrumento" ? "Instrumento" : "Acessório"}
            </button>
          ))}
        </div>
        <input className={input} placeholder="Nome (ex: Violão Giannini)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className={input} placeholder="Categoria (ex: Violões, Cordas, Capas)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
        <input className={input} placeholder="Preço (ex: 1890,00)" inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
        <textarea className={input} rows={3} placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <label className="block text-sm">Foto
          <input id="img" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-1 block w-full text-sm" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Visível no site
        </label>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <div className="flex gap-2">
          <button className={`${btn} flex-1`} disabled={busy}>{busy ? "Salvando..." : "Salvar"}</button>
          {editId && <button type="button" onClick={() => { setEditId(null); setForm(empty); }} className="rounded-md border px-4">Cancelar</button>}
        </div>
      </form>

      <div>
        <h2 className="font-display text-xl">Itens cadastrados ({items.length})</h2>
        <div className="mt-4 space-y-3">
          {items.map((p) => (
            <div key={p.id} className="flex items-center gap-4 rounded-lg border bg-card p-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-muted">
                {p.image_url && <img src={p.image_url} alt={p.name} className="h-full w-full object-contain" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.name} {!p.active && <span className="text-xs text-muted-foreground">(oculto)</span>}</p>
                <p className="text-sm text-muted-foreground">{p.kind === "acessorio" ? "Acessório" : "Instrumento"} · {p.category} · R$ {Number(p.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
              <button onClick={() => { setEditId(p.id); setForm({ name: p.name, kind: p.kind, category: p.category, price: String(p.price), description: p.description, active: p.active }); }} className="text-sm underline">Editar</button>
              <button onClick={() => remove(p.id)} className="text-sm text-destructive underline">Excluir</button>
            </div>
          ))}
          {items.length === 0 && <p className="text-muted-foreground">Nenhum item ainda. Cadastre o primeiro ao lado.</p>}
        </div>
      </div>
    </div>
  );
}
