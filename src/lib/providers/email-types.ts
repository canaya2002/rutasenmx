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
  /** Optional override. Falls back to the template's own subject. */
  subject?: string;
  data: Record<string, unknown>;
  from?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<SendResult>;
  sendTemplate(template: EmailTemplate): Promise<SendResult>;
}
