import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, X, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { aBtn, aBtnGhost, aChip, aLabel, aPanel } from "@/lib/admin-styles";

type Req = { user_id: string; email: string; status: string; created_at: string };
type F = "pendente" | "aprovado" | "recusado" | "todos";

const badge: Record<string, string> = {
  pendente: "bg-destructive text-destructive-foreground",
  aprovado: "bg-primary text-primary-foreground",
  recusado: "bg-muted text-muted-foreground",
};

export function AdminRequests({ onChanged }: { onChanged?: () => void }) {
  const [rows, setRows] = useState<Req[] | null>(null);
  const [filter, setFilter] = useState<F>("pendente");

  async function load() {
    const { data } = await supabase.from("admin_requests").select("*").order("created_at", { ascending: false });
    const list = (data as Req[]) ?? [];
    setRows(list);
    if (rows === null && !list.some((r) => r.status === "pendente")) setFilter("todos");
  }
  useEffect(() => { load(); }, []);

  async function act(id: string, approve: boolean) {
    const { error } = await supabase.rpc("set_admin_request", { _user: id, _approve: approve });
    if (error) { toast.error(error.message); return; }
    toast.success(approve ? "Acesso liberado!" : "Acesso negado.");
    load(); onChanged?.();
  }

  const count = (s: F) => (rows ?? []).filter((r) => s === "todos" || r.status === s).length;
  const list = (rows ?? []).filter((r) => filter === "todos" || r.status === filter);
  const filters: [F, string][] = [["pendente", "Pendentes"], ["aprovado", "Aprovados"], ["recusado", "Recusados"], ["todos", "Todos"]];

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-8 md:px-6">
      <div className={aPanel}>
        <h2 className="font-street text-3xl uppercase leading-none">Aprovação de cadastros</h2>
        <p className="mt-2 text-sm text-muted-foreground">Quem cria conta na Área do dono aparece aqui. Aprove para liberar o acesso ao painel.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={aChip(filter === k)}>{l} ({count(k)})</button>
          ))}
        </div>
      </div>

      {rows === null && [0, 1].map((i) => <div key={i} className="h-20 animate-pulse border-2 border-foreground bg-muted" />)}
      {list.map((r, i) => (
        <div key={r.user_id} style={{ animationDelay: `${i * 40}ms` }}
          className="flex flex-wrap items-center gap-4 border-2 border-foreground bg-card p-4 shadow-hard-sm animate-in fade-in slide-in-from-bottom-2 fill-mode-both">
          <div className="grid h-12 w-12 shrink-0 place-items-center border-2 border-foreground bg-primary font-street text-xl uppercase text-primary-foreground">
            {r.email.charAt(0) || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{r.email}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className={`px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${badge[r.status] ?? "bg-muted"}`}>{r.status}</span>
              <span className={aLabel}>{new Date(r.created_at).toLocaleDateString("pt-BR")}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {r.status !== "aprovado" && <button onClick={() => act(r.user_id, true)} className={aBtn}><Check className="h-4 w-4" /> Aprovar</button>}
            {r.status !== "recusado" && (
              <button onClick={() => act(r.user_id, false)} className={aBtnGhost}>
                <X className="h-4 w-4" /> {r.status === "aprovado" ? "Remover acesso" : "Recusar"}
              </button>
            )}
          </div>
        </div>
      ))}
      {rows !== null && list.length === 0 && (
        <div className="border-2 border-dashed border-foreground bg-background p-10 text-center">
          <UserCheck className="mx-auto h-8 w-8" />
          <p className="mt-2 font-street text-2xl uppercase">Tudo em dia</p>
          <p className="text-sm text-muted-foreground">Nenhum cadastro nesta lista.</p>
        </div>
      )}
    </div>
  );
}
