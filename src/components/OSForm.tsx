import { useEffect, useRef, useState } from "react";
import logo from "@/assets/logo.png.asset.json";
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
type Saved = { id: string; numero: number | null; cliente: string; pdf_path: string | null; created_at: string };

const br = (d: string) => (d ? d.split("-").reverse().join("/") : "____/____/______");
const fmtNum = (n: number | null) => (n ? String(n).padStart(4, "0") : "—");

async function toDataUrl(url: string) {
  const blob = await (await fetch(url)).blob();
  return new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(blob); });
}

async function montarPdf(o: OS, numero: number) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, M = 14;
  try {
    const img = await toDataUrl(logo.url);
    const p = doc.getImageProperties(img);
    const h = 38, w = (p.width / p.height) * h;
    doc.addImage(img, M, 10, Math.min(w, 110), Math.min(w, 110) === w ? h : (110 * p.height) / p.width);
  } catch { doc.setFont("helvetica", "bold").setFontSize(22).text("LUTHIER GAROTINHO", M, 28); }
  doc.setLineWidth(0.4).line(135, 10, 135, 50);
  doc.setFont("helvetica", "bold").setFontSize(13).text("ORDEM DE SERVIÇO", 140, 16);
  doc.setFontSize(10).text(`Nº ${fmtNum(numero)}`, 140, 25);
  doc.setFont("helvetica", "normal").setFontSize(9);
  doc.text(`Data de entrada: ${br(o.entrada)}`, 140, 35);
  doc.text(`Data de entrega: ${br(o.entrega)}`, 140, 43);

  let y = 56;
  const box = (title: string, lines: string[]) => {
    doc.setFontSize(9);
    const wrapped = lines.flatMap((l) => doc.splitTextToSize(l, W - 2 * M - 8) as string[]);
    const h = 12 + wrapped.length * 5.2;
    doc.roundedRect(M, y, W - 2 * M, h, 2, 2);
    doc.setFont("helvetica", "bold").setFontSize(11).text(title, M + 4, y + 7);
    doc.setFont("helvetica", "normal").setFontSize(9);
    wrapped.forEach((l, i) => doc.text(l, M + 4, y + 13 + i * 5.2));
    y += h + 4;
  };
  box("DADOS DO CLIENTE", [`Nome: ${o.nome}`, `WhatsApp: ${o.whatsapp}`]);
  box("INSTRUMENTO", [
    `Tipo: ${o.tipo === "Outro" ? o.tipoOutro || "Outro" : o.tipo}     ${o.capa}`,
    `Marca: ${o.marca}     Modelo: ${o.modelo}     Cor: ${o.cor}`,
    `Acessórios entregues: ${o.acessorios || "-"}`, `Observações: ${o.obs || "-"}`,
  ]);
  const sv = o.servicos.map((s) => (s === "Outro" && o.servicoOutro ? `Outro: ${o.servicoOutro}` : s));
  box("SERVIÇO A SER REALIZADO", [...(o.servico ? o.servico.split("\n") : ["-"]), `Tipo: ${sv.join(", ") || "-"}`]);
  const valor = Number(o.valor.replace(/\./g, "").replace(",", ".")) || 0;
  box("VALOR DO SERVIÇO", [`R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`]);
  box("TERMOS E CONDIÇÕES", TERMOS.map((t) => `• ${t}`));
  doc.setFont("helvetica", "italic").setFontSize(10).text("“Cada instrumento tem uma história. A gente cuida da sua.”", W / 2, y + 6, { align: "center" });
  return doc;
}

const nomeArquivo = (numero: number, nome: string) => `OS-${fmtNum(numero)}-${(nome || "cliente").replace(/\s+/g, "_")}.pdf`;

export function OSForm({ onChanged }: { onChanged?: () => void } = {}) {
  const [o, setO] = useState<OS>(makeInitial);
  const [numero, setNumero] = useState<number | null>(null);
  const [saved, setSaved] = useState<Saved[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    const [n, list] = await Promise.all([
      supabase.rpc("next_os_number"),
      supabase.from("service_orders").select("*").order("created_at", { ascending: false }),
    ]);
    setNumero((n.data as number) ?? null);
    setSaved((list.data as Saved[]) ?? []);
    onChanged?.();
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
        const ins = await supabase.from("service_orders").insert({ numero: n as number, cliente: o.nome }).select("id, numero").single();
        if (!ins.error) row = ins.data as { id: string; numero: number };
        else if (ins.error.code !== "23505") throw ins.error;
      }
      if (!row) throw new Error("Não foi possível reservar o número da OS.");
      const doc = await montarPdf(o, row.numero);
      await uploadPdf(doc.output("blob"), row.id);
      doc.save(nomeArquivo(row.numero, o.nome));
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
    try {
      const ins = await supabase.from("service_orders").insert({ cliente: file.name.replace(/\.pdf$/i, "") }).select("id").single();
      if (ins.error) throw ins.error;
      await uploadPdf(file, ins.data.id);
      setMsg("Arquivo enviado para o site.");
      toast.success("PDF enviado para o site!");
    } catch (err) {
      setMsg(`Erro: ${(err as Error).message}`);
    } finally {
      setBusy(false); refresh();
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function abrir(s: Saved) {
    if (!s.pdf_path) return;
    const { data } = await supabase.storage.from("service-orders").createSignedUrl(s.pdf_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  async function excluir(s: Saved) {
    if (!confirm("Excluir esta OS do site?")) return;
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
  const Sec = ({ n, title, children }: { n: string; title: string; children: React.ReactNode }) => (
    <div className={`space-y-3 ${aPanel}`}>
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 -rotate-3 place-items-center bg-primary font-street text-primary-foreground">{n}</span>
        <h2 className="font-street text-xl uppercase md:text-2xl">{title}</h2>
      </div>
      {children}
    </div>
  );
  const lbl = "block space-y-1 text-sm font-semibold";
  const valorNum = Number(o.valor.replace(/\./g, "").replace(",", ".")) || 0;
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
          <button className={`${aBtn} flex-1`} disabled={busy}><Download className="h-4 w-4" /> {busy ? "Aguarde..." : "Salvar no site e baixar PDF"}</button>
          <button type="button" className={aBtnGhost} disabled={busy} onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> Enviar PDF de OS
          </button>
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
              <div key={s.id} className="flex items-center gap-3 border-2 border-foreground bg-background p-2 text-sm transition hover:shadow-hard-sm">
                <div className="grid h-10 w-10 shrink-0 place-items-center bg-primary text-primary-foreground">
                  {s.numero ? <span className="font-street text-xs">{fmtNum(s.numero)}</span> : <FileText className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{s.cliente || "-"}</p>
                  <p className={aLabel}>{new Date(s.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
                {s.pdf_path && <button type="button" title="Abrir" className="p-1.5 transition hover:bg-primary hover:text-primary-foreground" onClick={() => abrir(s)}><ExternalLink className="h-4 w-4" /></button>}
                <button type="button" title="Excluir" className="p-1.5 text-destructive transition hover:bg-destructive hover:text-destructive-foreground" onClick={() => excluir(s)}><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
