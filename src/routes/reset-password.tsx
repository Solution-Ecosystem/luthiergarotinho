import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/app-client';
import { isRecoveryLink, validateNewPassword } from '@/lib/password-recovery';
import { PasswordInput } from '@/components/PasswordInput';
import { Button } from '@/components/ui/button';
import { aBtn, aPanel } from '@/lib/admin-styles';
import logo from '@/assets/logo-crop.png';

export const Route = createFileRoute('/reset-password')({
  head: () => ({ meta: [
    { title: 'Redefinir senha — Luthier Garotinho' },
    { name: 'description', content: 'Recupere o acesso à área do dono do Luthier Garotinho.' },
    { property: 'og:title', content: 'Redefinir senha — Luthier Garotinho' },
    { property: 'og:description', content: 'Recuperação segura do acesso à área do dono.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: ResetPassword,
});

function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => {
    let active = true;
    let recovery = isRecoveryLink(window.location.hash);
    const verify = async () => {
      const { data } = await supabase.auth.getUser();
      if (active) { setReady(recovery && Boolean(data.user)); setChecking(false); }
    };
    const onRecovery = () => { recovery = true; void verify(); };
    window.addEventListener('garotinho-password-recovery', onRecovery);
    void verify();
    return () => { active = false; window.removeEventListener('garotinho-password-recovery', onRecovery); };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!ready || busy) return;
    const validation = validateNewPassword(password, confirmation);
    if (validation) { setMessage(validation); return; }
    setBusy(true); setMessage('');
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { setMessage('Não foi possível alterar a senha. Use um novo link ou escolha outra senha.'); return; }
      await supabase.auth.signOut({ scope: 'local' });
      setDone(true); setPassword(''); setConfirmation('');
    } catch { setMessage('Não foi possível conectar. Tente novamente.'); }
    finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-concrete px-4 py-12 font-sans text-foreground">
    <div className="mx-auto mb-8 w-fit"><img src={logo} alt="Luthier Garotinho" className="h-20 w-auto" /></div>
    <form onSubmit={submit} className={`mx-auto max-w-sm space-y-4 ${aPanel}`}>
      <h1 className="font-street text-3xl uppercase">Redefinir senha</h1>
      {checking ? <p role="status">Verificando link...</p> : done ? <p role="status">Senha alterada! Entre com sua nova senha.</p> : ready ? <>
        <PasswordInput aria-label="Nova senha" placeholder="Nova senha" autoComplete="new-password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
        <PasswordInput aria-label="Confirmar nova senha" placeholder="Confirmar nova senha" autoComplete="new-password" minLength={6} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} required />
        <Button className={`${aBtn} h-auto w-full rounded-none`} disabled={busy}>{busy ? 'Salvando...' : 'Salvar nova senha'}</Button>
      </> : <p role="status">Este link é inválido ou expirou. Solicite outro em “Esqueci minha senha”.</p>}
      {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
      <Button asChild variant="link" className="w-full"><Link to="/admin">Voltar para entrar</Link></Button>
    </form>
  </main>;
}