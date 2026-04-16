// ── Types ───────────────────────────────────────────────────────────────────
export interface EmailMessage {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  headers?: Record<string, string>;
}

export interface EmailTemplate {
  template: string;
  to: string | string[];
  subject: string;
  data: Record<string, unknown>;
  from?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ── Interface ───────────────────────────────────────────────────────────────
export interface EmailProvider {
  send(message: EmailMessage): Promise<SendResult>;
  sendTemplate(template: EmailTemplate): Promise<SendResult>;
}

// ── SMTP config ─────────────────────────────────────────────────────────────
interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

function getSMTPConfig(): SMTPConfig {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('SMTP_HOST, SMTP_USER, and SMTP_PASS must be set');
  }

  return {
    host,
    port: Number(process.env.SMTP_PORT ?? '587'),
    secure: process.env.SMTP_SECURE === 'true',
    user,
    pass,
    from: process.env.SMTP_FROM ?? `Rutas en MX <noreply@rutasenmx.com>`,
  };
}

// ── Template engine (simple variable replacement) ───────────────────────────
const TEMPLATES: Record<string, { subject: string; html: string; text: string }> = {
  'welcome': {
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

function renderTemplate(
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

// ── SMTP provider (using fetch to a local mail relay or API) ────────────────
class SMTPProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<SendResult> {
    const config = getSMTPConfig();
    const from = message.from ?? config.from;
    const to = Array.isArray(message.to) ? message.to : [message.to];

    // Use a REST-based email API (e.g. Postmark, Resend, Mailgun HTTP API)
    // This avoids requiring a Node.js SMTP library in the edge runtime.
    const apiUrl = process.env.EMAIL_API_URL;
    const apiKey = process.env.EMAIL_API_KEY;

    if (apiUrl && apiKey) {
      return this.sendViaApi(apiUrl, apiKey, { ...message, from, to });
    }

    // Fallback: direct SMTP via fetch to a local relay
    return this.sendViaSMTPRelay(config, { ...message, from, to });
  }

  async sendTemplate(template: EmailTemplate): Promise<SendResult> {
    const rendered = renderTemplate(template.template, template.data);

    return this.send({
      to: template.to,
      from: template.from,
      subject: template.subject || rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
  }

  private async sendViaApi(
    apiUrl: string,
    apiKey: string,
    message: EmailMessage & { to: string[] },
  ): Promise<SendResult> {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: message.from,
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
          reply_to: message.replyTo,
          cc: message.cc,
          bcc: message.bcc,
          headers: message.headers,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Email API error ${response.status}: ${errorText}` };
      }

      const data = await response.json();
      return { success: true, messageId: data.id ?? data.messageId ?? undefined };
    } catch (err) {
      return { success: false, error: `Email send failed: ${String(err)}` };
    }
  }

  private async sendViaSMTPRelay(
    config: SMTPConfig,
    message: EmailMessage & { to: string[] },
  ): Promise<SendResult> {
    // In production, use a proper email API (Resend, Postmark, etc.) via EMAIL_API_URL.
    // This is a placeholder that logs the intent and returns a mock success for dev.
    console.warn(
      `[SMTPProvider] No EMAIL_API_URL set. Would send to ${message.to.join(', ')} via ${config.host}:${config.port}`,
    );

    return {
      success: false,
      error: 'Direct SMTP not supported. Set EMAIL_API_URL and EMAIL_API_KEY for a REST-based email provider.',
    };
  }
}

// ── Console provider (development) ──────────────────────────────────────────
class ConsoleProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<SendResult> {
    const to = Array.isArray(message.to) ? message.to.join(', ') : message.to;
    console.log('─── Email ───────────────────────────────────────────────');
    console.log(`To:      ${to}`);
    console.log(`From:    ${message.from ?? '(default)'}`);
    console.log(`Subject: ${message.subject}`);
    if (message.text) console.log(`Text:    ${message.text}`);
    if (message.html) console.log(`HTML:    ${message.html.slice(0, 200)}...`);
    console.log('────────────────────────────────────────────────────────');

    return { success: true, messageId: `console-${Date.now()}` };
  }

  async sendTemplate(template: EmailTemplate): Promise<SendResult> {
    const rendered = renderTemplate(template.template, template.data);

    return this.send({
      to: template.to,
      from: template.from,
      subject: template.subject || rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
  }
}

// ── Factory & singleton ─────────────────────────────────────────────────────
export function createEmailProvider(): EmailProvider {
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_API_URL) {
    return new ConsoleProvider();
  }
  return new SMTPProvider();
}

let _email: EmailProvider | null = null;

export function getEmail(): EmailProvider {
  if (!_email) {
    _email = createEmailProvider();
  }
  return _email;
}
