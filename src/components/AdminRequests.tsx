import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Req = { user_id: string; email: string; status: string; created_at: string };

export function AdminRequests() {
  const [rows, setRows] = useState<Req[]>([]);
  const [err, setErr] = useState("");
  async function load() {
    const { data } = await supabase.from("admin_requests").select("*").order("created_at", { ascending: false });
    setRows((data as Req[]) ?? []);
  }
  useEffect(() => { load(); }, []);
  async function act(id: string, approve: boolean) {
    setErr("");
    const { error } = await supabase.rpc("set_admin_request", { _user: id, _approve: approve });
    if (error) setErr(error.message); else load();
  }
  return (
    <div className="mx-auto max-w-4xl space-y-3 px-6 py-10">
      <h2 className="font-display text-xl">Aprovação de administradores</h2>
      <p className="text-sm text-muted-foreground">Quem cria conta na Área do dono aparece aqui. Aprove para liberar o acesso ao painel.</p>
      {err && <p className="text-sm text-destructive">{err}</p>}
      {rows.map((r) => (
        <div key={r.user_id} className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{r.email}</p>
            <p className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")} · {r.status}</p>
          </div>
          {r.status !== "aprovado" && <button onClick={() => act(r.user_id, true)} className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">Aprovar</button>}
          {r.status !== "recusado" && <button onClick={() => act(r.user_id, false)} className="rounded-md border px-3 py-1.5 text-sm">{r.status === "aprovado" ? "Remover acesso" : "Recusar"}</button>}
        </div>
      ))}
      {rows.length === 0 && <p className="text-muted-foreground">Nenhum cadastro ainda.</p>}
    </div>
  );
}
