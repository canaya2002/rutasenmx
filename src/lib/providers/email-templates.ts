const TEMPLATES: Record<
  string,
  { subject: string; html: string; text: string }
> = {
  welcome: {
    subject: 'Bienvenido a Rutas en MX',
    html: `
      <h1>¡Hola {{name}}!</h1>
      <p>Bienvenido a <strong>Rutas en MX</strong>. Estamos listos para ayudarte a planear tu próximo viaje por carretera.</p>
      <p><a href="{{appUrl}}/dashboard">Ir a mi panel</a></p>
    `,
    text: '¡Hola {{name}}! Bienvenido a Rutas en MX. Visita {{appUrl}}/dashboard para comenzar.',
  },
  'trip-shared': {
    subject: '{{sharedBy}} compartió un viaje contigo',
    html: `
      <h1>¡Tienes un viaje compartido!</h1>
      <p><strong>{{sharedBy}}</strong> te compartió el viaje "{{tripName}}".</p>
      <p><a href="{{tripUrl}}">Ver itinerario</a></p>
    `,
    text: '{{sharedBy}} te compartió el viaje "{{tripName}}". Míralo en: {{tripUrl}}',
  },
  'password-reset': {
    subject: 'Restablece tu contraseña',
    html: `
      <h1>Restablecer contraseña</h1>
      <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el enlace:</p>
      <p><a href="{{resetUrl}}">Restablecer contraseña</a></p>
      <p>Si no solicitaste esto, ignora este correo. El enlace expira en 1 hora.</p>
    `,
    text: 'Restablece tu contraseña visitando: {{resetUrl}} (expira en 1 hora)',
  },
  'subscription-confirmed': {
    subject: '¡Tu plan {{plan}} está activo!',
    html: `
      <h1>¡Plan activado!</h1>
      <p>Tu plan <strong>{{plan}}</strong> ya está activo. Disfruta de todas las funciones.</p>
      <p><a href="{{appUrl}}/dashboard">Ir a mi panel</a></p>
    `,
    text: 'Tu plan {{plan}} ya está activo. Visita {{appUrl}}/dashboard',
  },
};

export function renderTemplate(
  templateName: string,
  data: Record<string, unknown>,
): { subject: string; html: string; text: string } {
  const tpl = TEMPLATES[templateName];
  if (!tpl) {
    throw new Error(`Email template "${templateName}" not found`);
  }

  const replace = (str: string): string => {
    return str.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
      return String(data[key] ?? '');
    });
  };

  return {
    subject: replace(tpl.subject),
    html: replace(tpl.html),
    text: replace(tpl.text),
  };
}
