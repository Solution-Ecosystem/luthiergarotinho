export function isRecoveryLink(hash: string) {
  return new URLSearchParams(hash.replace(/^#/, '')).get('type') === 'recovery';
}

export function validateNewPassword(password: string, confirmation: string) {
  if (password.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (password !== confirmation) return 'As senhas não coincidem.';
  return '';
}