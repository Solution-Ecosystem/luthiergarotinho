import { useEffect, useRef, useState } from "react";
import modelo from "@/assets/os-modelo.jpg.asset.json";
import { toast } from "sonner";
import { Download, Upload, RotateCcw, Search, FileText, ExternalLink, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { aBtn, aBtnGhost, aChip, aInput as input, aLabel, aPanel } from "@/lib/admin-styles";

const TIPOS = ["Violão", "Guitarra", "Baixo", "Cavaquinho", "Ukulele", "Outro"];
const SERVICOS = ["Ajuste completo", "Troca de peças", "Restauração", "Outro"];
export const TERMOS = [
  "O prazo de entrega será informado após a avaliação do instrumento.",
  "Serviços adicionais só serão realizados com autorização do cliente.",
  "Em caso de troca de peças, o valor será informado previamente.",
  "A Luthier Garotinho não se responsabiliza por danos causados por mau uso, quedas ou umidade após a entrega do instrumento.",
];

const today = () => new Date().toISOString().slice(0, 10);
const makeInitial = () => ({
  entrada: today(), entrega: "",
  nome: "", whatsapp: "",
  tipo: "Violão", tipoOutro: "", marca: "", modelo: "", cor: "", capa: "Com capa", acessorios: "", obs: "",
  servico: "", servicos: [] as string[], servicoOutro: "",
  valor: "",
});
type OS = ReturnType<typeof makeInitial>;
type Saved = { id: string; numero: number | null; cliente: string; pdf_path: string | null; created_at: string; dados: Partial<OS> | null };

const parseValor = (v: string) => Number(v.replace(/\./g, "").replace(",", ".")) || 0;

// Defined outside OSForm on purpose: declaring it inside made React remount every section on each keystroke, so inputs lost focus.
function Sec({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className={`space-y-3 ${aPanel}`}>
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 -rotate-3 place-items-center bg-primary font-street text-primary-foreground">{n}</span>
        <h2 className="font-street text-xl uppercase md:text-2xl">{title}</h2>
      </div>
      {children}
    </div>
  );
}

const br = (d: string) => (d ? d.split("-").reverse().join("/") : "____/____/______");
const fmtNum = (n: number | null) => (n ? String(n).padStart(4, "0") : "—");

async function carregarModelo(url: string) {
  const img = new Image();
  img.src = url;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  c.getContext("2d")!.drawImage(img, 0, 0);
  return c.toDataURL("image/jpeg", 0.85);
}

// The owner's uploaded OS model is the PDF background; form data is written on top at its fields (coordinates in mm on A4).
export async function montarPdf(o: OS, numero: number) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  doc.addImage(await carregarModelo(modelo.url), "JPEG", 0, 0, 210, 297);
  const t = (txt: string, x: number, y: number, size = 10, bold = false) =>
    doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(size).text(txt || "", x, y);
  const X = (on: boolean, x: number, y: number) => { if (on) t("X", x + 1, y + 0.8, 11, true); };
  const lines = (txt: string, x: number, y: number, w: number, step: number, max: number, size = 9) => {
    doc.setFont("helvetica", "normal").setFontSize(size);
    (doc.splitTextToSize(txt || "", w) as string[]).slice(0, max).forEach((l, i) => doc.text(l, x, y + i * step));
  };

  t(fmtNum(numero), 165, 31, 13, true);
  if (o.entrada) { const [a, m, d] = o.entrada.split("-"); t(d, 156, 48.5, 10, true); t(m, 168, 48.5, 10, true); t(a, 182, 48.5, 10, true); }
  if (o.entrega) t(`ENTREGA: ${br(o.entrega)}`, 153, 55, 8, true);

  t(o.nome, 30, 77);
  t(o.whatsapp, 47, 85.5);

  const tipos: Record<string, [number, number]> = {
    "Violão": [31.6, 122], "Guitarra": [53.2, 122], "Baixo": [74.6, 122], "Cavaquinho": [91.6, 122],
    "Ukulele": [31.6, 128.6], "Outro": [53.2, 128.6],
  };
  const pos = tipos[o.tipo]; if (pos) X(true, pos[0], pos[1]);
  if (o.tipo === "Outro") t(o.tipoOutro, 69, 128);
  t(o.marca, 33, 139.5); t(o.modelo, 36, 148); t(o.cor, 29, 157);
  X(o.capa === "Com capa", 131.2, 112); X(o.capa === "Sem capa", 131.2, 118.2);
  lines(o.acessorios, 129, 132, 64, 6.6, 3);
  lines(o.obs, 129, 155, 64, 6.6, 3);

  lines(o.servico, 18, 184.5, 116, 7.1, 5);
  const sv = (s: string) => o.servicos.includes(s);
  X(sv("Ajuste completo"), 18.7, 218.6); X(sv("Troca de peças"), 62.7, 218.6);
  X(sv("Restauração"), 103.7, 218.6); X(sv("Outro"), 140.3, 218.6);
  if (sv("Outro")) t(o.servicoOutro, 158, 219, 8);
  const valor = parseValor(o.valor);
  t(valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 }), 166, 184.5, 12, true);
  return doc;
}

const nomeArquivo = (numero: number, nome: string) => `OS-${fmtNum(numero)}-${(nome || "cliente").replace(/\s+/g, "_")}.pdf`;
const arquivoSalvo = (s: Saved) =>
  s.numero ? nomeArquivo(s.numero, s.cliente) : `${(s.cliente || "OS").replace(/\s+/g, "_")}.pdf`;
// Long-lived links so a link sent to a client keeps working; files themselves are never removed except by explicit delete.
const LINK_TTL = 60 * 60 * 24 * 365 * 10;

export function OSForm({ onChanged }: { onChanged?: () => void } = {}) {
  const [o, setO] = useState<OS>(makeInitial);
  const [numero, setNumero] = useState<number | null>(null);
  const [saved, setSaved] = useState<Saved[]>([]);
  const [links, setLinks] = useState<Record<string, { view: string; dl: string }>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const attachTo = useRef<string | null>(null);

  async function refresh() {
    const [n, list] = await Promise.all([
      supabase.rpc("next_os_number"),
      supabase.from("service_orders").select("*").order("created_at", { ascending: false }),
    ]);
    setNumero((n.data as number) ?? null);
    const rows = (list.data as unknown as Saved[]) ?? [];
    setSaved(rows);
    onChanged?.();
    // Links are prepared ahead so the download button works with a single tap (also on iPhone).
    const pairs = await Promise.all(rows.filter((s) => s.pdf_path).map(async (s) => {
      const bucket = supabase.storage.from("service-orders");
      const [view, dl] = await Promise.all([
        bucket.createSignedUrl(s.pdf_path!, LINK_TTL),
        bucket.createSignedUrl(s.pdf_path!, LINK_TTL, { download: arquivoSalvo(s) }),
      ]);
      return [s.id, { view: view.data?.signedUrl ?? "", dl: dl.data?.signedUrl ?? "" }] as const;
    }));
    setLinks(Object.fromEntries(pairs));
  }
  useEffect(() => { refresh(); }, []);

  async function uploadPdf(blob: Blob, rowId: string) {
    const path = `${rowId}.pdf`;
    const up = await supabase.storage.from("service-orders").upload(path, blob, { contentType: "application/pdf", upsert: true });
    if (up.error) throw up.error;
    await supabase.from("service_orders").update({ pdf_path: path }).eq("id", rowId);
  }

  async function gerar(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg("");
    try {
      let row: { id: string; numero: number } | null = null;
      for (let i = 0; i < 3 && !row; i++) {
        const { data: n } = await supabase.rpc("next_os_number");
        const ins = await supabase.from("service_orders").insert({
          numero: n as number, cliente: o.nome, whatsapp: o.whatsapp || null, valor: parseValor(o.valor),
          data_entrada: o.entrada || null, data_entrega: o.entrega || null, dados: o,
        }).select("id, numero").single();
        if (!ins.error) row = ins.data as { id: string; numero: number };
        else if (ins.error.code !== "23505") throw ins.error;
      }
      if (!row) throw new Error("Não foi possível reservar o número da OS.");
      const doc = await montarPdf(o, row.numero);
      doc.save(nomeArquivo(row.numero, o.nome));
      try {
        await uploadPdf(doc.output("blob"), row.id);
      } catch (upErr) {
        setMsg(`OS Nº ${fmtNum(row.numero)} baixada, mas não foi salva no site. Use "Anexar PDF" na lista.`);
        toast.error(`OS baixada, mas não salvou no site: ${(upErr as Error).message}`);
        return;
      }
      setMsg(`OS Nº ${fmtNum(row.numero)} salva no site e baixada.`);
      toast.success(`OS Nº ${fmtNum(row.numero)} salva e baixada!`);
      setO(makeInitial());
    } catch (err) {
      setMsg(`Erro: ${(err as Error).message}`);
      toast.error((err as Error).message);
    } finally { setBusy(false); refresh(); }
  }

  async function enviarArquivo(file: File) {
    setBusy(true); setMsg("");
    const target = attachTo.current;
    attachTo.current = null;
    try {
      let id = target;
      if (!id) {
        const ins = await supabase.from("service_orders").insert({ cliente: file.name.replace(/\.pdf$/i, "") }).select("id").single();
        if (ins.error) throw ins.error;
        id = ins.data.id;
      }
      await uploadPdf(file, id);
      setMsg("Arquivo enviado para o site.");
      toast.success("PDF enviado para o site!");
    } catch (err) {
      setMsg(`Erro: ${(err as Error).message}`);
    } finally {
      setBusy(false); refresh();
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // Orders without a stored PDF are rebuilt from the data saved in the database, then stored so next time it's a direct download.
  async function baixarGerado(s: Saved) {
    setBusy(true);
    try {
      const dados: OS = { ...makeInitial(), entrada: s.created_at.slice(0, 10), ...(s.dados ?? {}), nome: s.dados?.nome || s.cliente };
      const doc = await montarPdf(dados, s.numero ?? 0);
      doc.save(arquivoSalvo(s));
      try { await uploadPdf(doc.output("blob"), s.id); } catch { /* download already happened */ }
      if (!s.dados) toast.message("Esta OS foi criada antes do site guardar os detalhes, então o PDF saiu só com nome e número.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setBusy(false); refresh(); }
  }

  async function excluir(s: Saved) {
    const conf = prompt(`Os arquivos ficam salvos para sempre. Para excluir mesmo assim, digite EXCLUIR:`);
    if (conf?.trim().toUpperCase() !== "EXCLUIR") return;
    if (s.pdf_path) await supabase.storage.from("service-orders").remove([s.pdf_path]);
    await supabase.from("service_orders").delete().eq("id", s.id);
    toast("OS excluída");
    refresh();
  }

  const f = (k: keyof OS) => ({ value: o[k] as string, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setO({ ...o, [k]: e.target.value }) });
  const pills = (opts: string[], val: string, k: keyof OS) => (
    <div className="flex flex-wrap gap-2">
      {opts.map((t) => (
        <button type="button" key={t} onClick={() => setO({ ...o, [k]: t })} className={aChip(val === t)}>{t}</button>
      ))}
    </div>
  );
  const lbl = "block space-y-1 text-sm font-semibold";
  const valorNum = parseValor(o.valor);
  const tipoTxt = o.tipo === "Outro" ? o.tipoOutro || "Outro" : o.tipo;
  const filtered = saved.filter((s) => `${s.cliente} ${fmtNum(s.numero)}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:px-6 lg:grid-cols-[1fr_340px]">
      <form className="space-y-5" onSubmit={gerar}>
        <Sec n="01" title="Cabeçalho">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className={lbl}><span>Nº da OS (automático)</span>
              <input className={`${input} font-street text-lg`} value={fmtNum(numero)} readOnly />
            </label>
            <label className={lbl}><span>Data de entrada</span><input type="date" className={input} {...f("entrada")} /></label>
            <label className={lbl}><span>Data de entrega</span><input type="date" className={input} {...f("entrega")} /></label>
          </div>
        </Sec>
        <Sec n="02" title="Dados do cliente">
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={input} placeholder="Nome" required {...f("nome")} />
            <input className={input} placeholder="WhatsApp" inputMode="tel" {...f("whatsapp")} />
          </div>
        </Sec>
        <Sec n="03" title="Instrumento">
          {pills(TIPOS, o.tipo, "tipo")}
          {o.tipo === "Outro" && <input className={input} placeholder="Qual instrumento?" {...f("tipoOutro")} />}
          <div className="grid gap-3 sm:grid-cols-3">
            <input className={input} placeholder="Marca" {...f("marca")} />
            <input className={input} placeholder="Modelo" {...f("modelo")} />
            <input className={input} placeholder="Cor" {...f("cor")} />
          </div>
          {pills(["Com capa", "Sem capa"], o.capa, "capa")}
          <input className={input} placeholder="Acessórios entregues" {...f("acessorios")} />
          <textarea className={input} rows={2} placeholder="Observações do instrumento" {...f("obs")} />
        </Sec>
        <Sec n="04" title="Serviço a ser realizado">
          <textarea className={input} rows={4} placeholder="Descreva o serviço" {...f("servico")} />
          <div className="flex flex-wrap gap-2">
            {SERVICOS.map((s) => {
              const on = o.servicos.includes(s);
              return (
                <button type="button" key={s} className={aChip(on)}
                  onClick={() => setO({ ...o, servicos: on ? o.servicos.filter((x) => x !== s) : [...o.servicos, s] })}>
                  {on ? "✓ " : "+ "}{s}
                </button>
              );
            })}
          </div>
          {o.servicos.includes("Outro") && <input className={input} placeholder="Qual outro serviço?" {...f("servicoOutro")} />}
        </Sec>
        <Sec n="05" title="Valor do serviço">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold">R$</span>
            <input className={`${input} pl-10 font-street text-xl`} placeholder="250,00" inputMode="decimal" {...f("valor")} />
          </div>
        </Sec>
        <Sec n="06" title="Termos e condições">
          <ul className="space-y-2 text-sm text-muted-foreground">
            {TERMOS.map((t) => <li key={t} className="flex gap-2"><span className="font-bold text-foreground">✦</span>{t}</li>)}
          </ul>
        </Sec>

        <div className="sticky bottom-3 z-20 flex flex-wrap gap-2 border-2 border-foreground bg-background p-3 shadow-hard">
          <button className={`${aBtn} flex-1`} disabled={busy}><Download className="h-4 w-4" /> {busy ? "Salvando..." : "Salvar"}</button>
          <button type="button" className={aBtnGhost} title="Limpar" onClick={() => setO(makeInitial())}><RotateCcw className="h-4 w-4" /> Limpar</button>
          <input ref={fileRef} type="file" accept="application/pdf" className="hidden"
            onChange={(e) => { const file = e.target.files?.[0]; if (file) enviarArquivo(file); }} />
        </div>
        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
      </form>

      <aside className="space-y-5 lg:sticky lg:top-40 lg:h-fit">
        <div className="border-2 border-foreground bg-primary p-5 text-primary-foreground shadow-hard">
          <p className="font-mono text-xs uppercase tracking-widest opacity-70">// Prévia da OS</p>
          <p className="mt-2 font-street text-4xl leading-none">Nº {fmtNum(numero)}</p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-2"><dt className="opacity-70">Cliente</dt><dd className="truncate font-semibold">{o.nome || "—"}</dd></div>
            <div className="flex justify-between gap-2"><dt className="opacity-70">Instrumento</dt><dd className="truncate font-semibold">{[tipoTxt, o.marca].filter(Boolean).join(" · ")}</dd></div>
            <div className="flex justify-between gap-2"><dt className="opacity-70">Entrega</dt><dd className="font-semibold">{o.entrega ? br(o.entrega) : "—"}</dd></div>
            <div className="flex justify-between gap-2"><dt className="opacity-70">Serviços</dt><dd className="truncate font-semibold">{o.servicos.length || "—"}</dd></div>
          </dl>
          <p className="mt-4 border-t-2 border-primary-foreground pt-3 font-street text-3xl">
            {valorNum.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>

        <div className={aPanel}>
          <div className="flex items-center justify-between">
            <h2 className="font-street text-xl uppercase">Ordens salvas</h2>
            <span className="border-2 border-foreground px-2 font-mono text-xs font-bold">{saved.length}</span>
          </div>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input className={`${input} pl-9`} placeholder="Buscar cliente ou nº" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {filtered.length === 0 && <p className="mt-4 text-sm text-muted-foreground">Nenhuma OS encontrada.</p>}
          <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {filtered.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 border-2 border-foreground bg-background p-2 text-sm transition hover:shadow-hard-sm">
                <div className="grid h-10 w-10 shrink-0 place-items-center bg-primary text-primary-foreground">
                  {s.numero ? <span className="font-street text-xs">{fmtNum(s.numero)}</span> : <FileText className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{s.cliente || "-"}</p>
                  <p className={aLabel}>{new Date(s.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <div className="flex items-center gap-1">
                  {s.pdf_path && (links[s.id]?.dl ? (
                    <a href={links[s.id]?.dl} download={arquivoSalvo(s)}
                      className="inline-flex items-center gap-1.5 border-2 border-foreground bg-primary px-2.5 py-1.5 font-street text-xs uppercase tracking-wider text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-hard-sm">
                      <Download className="h-4 w-4" /> Baixar
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 border-2 border-foreground px-2.5 py-1.5 font-street text-xs uppercase opacity-50">
                      <Download className="h-4 w-4" /> ...
                    </span>
                  ))}
                  {!s.pdf_path && (
                    <>
                      <button type="button" disabled={busy} onClick={() => baixarGerado(s)}
                        className="inline-flex items-center gap-1.5 border-2 border-foreground bg-primary px-2.5 py-1.5 font-street text-xs uppercase tracking-wider text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-hard-sm disabled:opacity-50">
                        <Download className="h-4 w-4" /> Baixar
                      </button>
                      <button type="button" disabled={busy} title="Anexar PDF"
                        onClick={() => { attachTo.current = s.id; fileRef.current?.click(); }}
                        className="p-1.5 transition hover:bg-primary hover:text-primary-foreground disabled:opacity-50"><Upload className="h-4 w-4" /></button>
                    </>
                  )}
                  {s.pdf_path && links[s.id]?.view && (
                    <a href={links[s.id]?.view} target="_blank" rel="noopener noreferrer" title="Abrir"
                      className="p-1.5 transition hover:bg-primary hover:text-primary-foreground"><ExternalLink className="h-4 w-4" /></a>
                  )}
                  <button type="button" title="Excluir" className="p-1.5 text-destructive transition hover:bg-destructive hover:text-destructive-foreground" onClick={() => excluir(s)}><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
