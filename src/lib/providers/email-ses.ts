import { createHash, createHmac } from 'node:crypto';

import type {
  EmailMessage,
  EmailProvider,
  EmailTemplate,
  SendResult,
} from './email-types';
import { renderTemplate } from './email-templates';

interface SESConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  from: string;
}

function getSESConfig(): SESConfig {
  const region = process.env.AWS_SES_REGION ?? process.env.AWS_REGION;
  const accessKeyId =
    process.env.AWS_SES_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.AWS_SES_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY;

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'AWS_SES_REGION, AWS_SES_ACCESS_KEY_ID, AWS_SES_SECRET_ACCESS_KEY must be set',
    );
  }

  return {
    region,
    accessKeyId,
    secretAccessKey,
    from:
      process.env.SES_FROM ??
      process.env.SMTP_FROM ??
      'Rutas en MX <noreply@rutasenmx.com>',
  };
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data, 'utf8').digest();
}

function sha256Hex(data: string): string {
  return createHash('sha256').update(data, 'utf8').digest('hex');
}

function signingKey(
  secret: string,
  date: string,
  region: string,
  service: string,
): Buffer {
  const kDate = hmac('AWS4' + secret, date);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, 'aws4_request');
}

/**
 * Sends via the SES v2 REST API using SigV4 (no external deps).
 */
export class SESProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<SendResult> {
    const config = getSESConfig();
    const toList = Array.isArray(message.to) ? message.to : [message.to];

    const payload = {
      FromEmailAddress: message.from ?? config.from,
      Destination: {
        ToAddresses: toList,
        CcAddresses: message.cc,
        BccAddresses: message.bcc,
      },
      ReplyToAddresses: message.replyTo ? [message.replyTo] : undefined,
      Content: {
        Simple: {
          Subject: { Data: message.subject, Charset: 'UTF-8' },
          Body: {
            ...(message.html
              ? { Html: { Data: message.html, Charset: 'UTF-8' } }
              : {}),
            ...(message.text
              ? { Text: { Data: message.text, Charset: 'UTF-8' } }
              : {}),
          },
        },
      },
    };

    const body = JSON.stringify(payload);
    const host = `email.${config.region}.amazonaws.com`;
    const path = '/v2/email/outbound-emails';
    const now = new Date();
    const amzDate = now
      .toISOString()
      .replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const payloadHash = sha256Hex(body);

    const canonicalHeaders =
      `content-type:application/json\n` +
      `host:${host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`;
    const signedHeaders =
      'content-type;host;x-amz-content-sha256;x-amz-date';

    const canonicalRequest = [
      'POST',
      path,
      '',
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const credentialScope = `${dateStamp}/${config.region}/ses/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      sha256Hex(canonicalRequest),
    ].join('\n');

    const kSigning = signingKey(
      config.secretAccessKey,
      dateStamp,
      config.region,
      'ses',
    );
    const signature = createHmac('sha256', kSigning)
      .update(stringToSign, 'utf8')
      .digest('hex');

    const authorization =
      `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`;

    try {
      const response = await fetch(`https://${host}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Host: host,
          'X-Amz-Date': amzDate,
          'X-Amz-Content-Sha256': payloadHash,
          Authorization: authorization,
        },
        body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `SES error ${response.status}: ${errorText}`,
        };
      }

      const data = await response.json();
      return { success: true, messageId: data.MessageId };
    } catch (err) {
      return { success: false, error: `SES send failed: ${String(err)}` };
    }
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
