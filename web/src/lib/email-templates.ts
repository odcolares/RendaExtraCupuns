/**
 * Templates de e-mail em HTML simples (PT-BR) com botão de link.
 * Usados por reset de senha (C2) e verificação de e-mail (C3).
 */

const BASE_STYLES = `
  body { font-family: Arial, Helvetica, sans-serif; background: #f4f4f5; margin: 0; padding: 24px; }
  .card { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; }
  h1 { font-size: 20px; color: #111827; margin: 0 0 12px; }
  p { font-size: 15px; color: #374151; line-height: 1.6; }
  .btn { display: inline-block; margin-top: 16px; padding: 12px 24px; background: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; }
  .link { word-break: break-all; font-size: 12px; color: #6b7280; margin-top: 16px; }
`;

function shell(title: string, heading: string, body: string, link: string, buttonLabel: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="card">
    <h1>${heading}</h1>
    ${body}
    <a class="btn" href="${link}">${buttonLabel}</a>
    <p class="link">Se o botão não funcionar, copie e cole este link no navegador:<br />${link}</p>
  </div>
</body>
</html>`;
}

export function renderResetPasswordEmail(link: string): string {
  return shell(
    "Redefinir senha — Renda Extra Cupons",
    "Redefina sua senha",
    `<p>Recebemos um pedido para redefinir a senha da sua conta. Este link é válido por <strong>1 hora</strong>.</p>
     <p>Se você não pediu isso, pode ignorar este e-mail — sua senha continua a mesma.</p>`,
    link,
    "Redefinir senha"
  );
}

export function renderVerifyEmail(link: string): string {
  return shell(
    "Confirme seu e-mail — Renda Extra Cupons",
    "Confirme seu e-mail",
    `<p>Bem-vindo(a) ao Renda Extra Cupons! Para ativar sua conta, confirme seu endereço de e-mail.</p>
     <p>Este link é válido por <strong>1 hora</strong>.</p>`,
    link,
    "Confirmar e-mail"
  );
}