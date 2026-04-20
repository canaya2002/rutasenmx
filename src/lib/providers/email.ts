import type {
  EmailMessage,
  EmailProvider,
  EmailTemplate,
  SendResult,
} from './email-types';
import { renderTemplate } from './email-templates';
import { SESProvider } from './email-ses';

export type {
  EmailMessage,
  EmailProvider,
  EmailTemplate,
  SendResult,
} from './email-types';

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

// ── REST-based API provider (Resend, Postmark, Mailgun HTTP) ────────────────
class SMTPProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<SendResult> {
    const config = getSMTPConfig();
    const from = message.from ?? config.from;
    const to = Array.isArray(message.to) ? message.to : [message.to];

    const apiUrl = process.env.EMAIL_API_URL;
    const apiKey = process.env.EMAIL_API_KEY;

    if (apiUrl && apiKey) {
      return this.sendViaApi(apiUrl, apiKey, { ...message, from, to });
    }

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
        return {
          success: false,
          error: `Email API error ${response.status}: ${errorText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.id ?? data.messageId ?? undefined,
      };
    } catch (err) {
      return { success: false, error: `Email send failed: ${String(err)}` };
    }
  }

  private async sendViaSMTPRelay(
    config: SMTPConfig,
    message: EmailMessage & { to: string[] },
  ): Promise<SendResult> {
    console.warn(
      `[SMTPProvider] No EMAIL_API_URL set. Would send to ${message.to.join(', ')} via ${config.host}:${config.port}`,
    );

    return {
      success: false,
      error:
        'Direct SMTP not supported. Set EMAIL_PROVIDER=ses or EMAIL_API_URL + EMAIL_API_KEY.',
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
  const provider = (
    process.env.EMAIL_PROVIDER ?? ''
  ).toLowerCase();

  if (provider === 'ses') return new SESProvider();
  if (provider === 'smtp') return new SMTPProvider();

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
