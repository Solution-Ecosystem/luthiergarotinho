import { useEffect, useRef, useState } from "react";
import logo from "@/assets/logo.png.asset.json";
import { supabase } from "@/integrations/supabase/client";

const input = "w-full rounded-md border bg-background px-3 py-2 outline-none focus:border-foreground";
const btn = "rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground transition hover:opacity-85 disabled:opacity-50";

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

export function OSForm() {
  const [o, setO] = useState<OS>(makeInitial);
  const [numero, setNumero] = useState<number | null>(null);
  const [saved, setSaved] = useState<Saved[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    const [n, list] = await Promise.all([
      supabase.rpc("next_os_number"),
      supabase.from("service_orders").select("*").order("created_at", { ascending: false }),
    ]);
    setNumero((n.data as number) ?? null);
    setSaved((list.data as Saved[]) ?? []);
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
      setO(makeInitial());
    } catch (err) {
      setMsg(`Erro: ${(err as Error).message}`);
    } finally { setBusy(false); refresh(); }
  }

  async function enviarArquivo(file: File) {
    setBusy(true); setMsg("");
    try {
      const ins = await supabase.from("service_orders").insert({ cliente: file.name.replace(/\.pdf$/i, "") }).select("id").single();
      if (ins.error) throw ins.error;
      await uploadPdf(file, ins.data.id);
      setMsg("Arquivo enviado para o site.");
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
    refresh();
  }

  const f = (k: keyof OS) => ({ value: o[k] as string, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setO({ ...o, [k]: e.target.value }) });
  const pills = (opts: string[], val: string, k: keyof OS) => (
    <div className="flex flex-wrap gap-2">
      {opts.map((t) => (
        <button type="button" key={t} onClick={() => setO({ ...o, [k]: t })}
          className={`rounded-md border px-3 py-1.5 text-sm ${val === t ? "border-foreground bg-primary text-primary-foreground" : ""}`}>{t}</button>
      ))}
    </div>
  );
  const section = "space-y-3 rounded-lg border bg-card p-6";
  const h = "font-display text-lg";

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-6 py-10">
      <form className="space-y-5" onSubmit={gerar}>
        <div className={section}>
          <h2 className={h}>Cabeçalho</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm">Nº da OS (automático)
              <input className={`${input} font-semibold`} value={fmtNum(numero)} readOnly />
            </label>
            <label className="text-sm">Data de entrada<input type="date" className={input} {...f("entrada")} /></label>
            <label className="text-sm">Data de entrega<input type="date" className={input} {...f("entrega")} /></label>
          </div>
        </div>
        <div className={section}>
          <h2 className={h}>Dados do cliente</h2>
          <input className={input} placeholder="Nome" required {...f("nome")} />
          <input className={input} placeholder="WhatsApp" {...f("whatsapp")} />
        </div>
        <div className={section}>
          <h2 className={h}>Instrumento</h2>
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
        </div>
        <div className={section}>
          <h2 className={h}>Serviço a ser realizado</h2>
          <textarea className={input} rows={4} placeholder="Descreva o serviço" {...f("servico")} />
          <div className="flex flex-wrap gap-4">
            {SERVICOS.map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={o.servicos.includes(s)}
                  onChange={(e) => setO({ ...o, servicos: e.target.checked ? [...o.servicos, s] : o.servicos.filter((x) => x !== s) })} /> {s}
              </label>
            ))}
          </div>
          {o.servicos.includes("Outro") && <input className={input} placeholder="Qual outro serviço?" {...f("servicoOutro")} />}
        </div>
        <div className={section}>
          <h2 className={h}>Valor do serviço</h2>
          <input className={input} placeholder="R$ (ex: 250,00)" inputMode="decimal" {...f("valor")} />
        </div>
        <div className={section}>
          <h2 className={h}>Termos e condições</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">{TERMOS.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className={`${btn} flex-1`} disabled={busy}>{busy ? "Aguarde..." : "Salvar no site e baixar PDF"}</button>
          <button type="button" className="rounded-md border px-4 py-2" disabled={busy} onClick={() => fileRef.current?.click()}>
            Enviar PDF de OS
          </button>
          <button type="button" className="rounded-md border px-4 py-2" onClick={() => setO(makeInitial())}>Limpar</button>
          <input ref={fileRef} type="file" accept="application/pdf" className="hidden"
            onChange={(e) => { const file = e.target.files?.[0]; if (file) enviarArquivo(file); }} />
        </div>
        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
      </form>

      <div className={section}>
        <h2 className={h}>Ordens salvas no site ({saved.length})</h2>
        {saved.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma OS salva ainda.</p>}
        <div className="divide-y">
          {saved.map((s) => (
            <div key={s.id} className="flex items-center gap-3 py-2 text-sm">
              <span className="w-16 font-semibold">{s.numero ? `Nº ${fmtNum(s.numero)}` : "Arquivo"}</span>
              <span className="min-w-0 flex-1 truncate">{s.cliente || "-"}</span>
              <span className="text-muted-foreground">{new Date(s.created_at).toLocaleDateString("pt-BR")}</span>
              {s.pdf_path && <button type="button" className="underline" onClick={() => abrir(s)}>Abrir</button>}
              <button type="button" className="text-destructive underline" onClick={() => excluir(s)}>Excluir</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
