// ── Types ───────────────────────────────────────────────────────────────────
export interface UploadOptions {
  key: string;
  body: Blob | ArrayBuffer | ReadableStream | string;
  contentType: string;
  acl?: 'public-read' | 'private';
  cacheControl?: string;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  key: string;
  url: string;
  size?: number;
}

export interface SignedUrlOptions {
  key: string;
  expiresIn?: number; // seconds, default 3600
}

// ── Interface ───────────────────────────────────────────────────────────────
export interface StorageProvider {
  upload(options: UploadOptions): Promise<UploadResult>;
  getUrl(key: string): string;
  getSignedUrl(options: SignedUrlOptions): Promise<string>;
  delete(key: string): Promise<void>;
}

// ── S3-compatible provider ──────────────────────────────────────────────────
interface S3Config {
  bucket: string;
  region: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrl: string;
}

function getS3Config(): S3Config {
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY;

  if (!bucket || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'S3_BUCKET, S3_ACCESS_KEY_ID (or AWS_ACCESS_KEY_ID), and S3_SECRET_ACCESS_KEY (or AWS_SECRET_ACCESS_KEY) must be set',
    );
  }

  const region = process.env.S3_REGION ?? process.env.AWS_REGION ?? 'us-east-1';
  const endpoint =
    process.env.S3_ENDPOINT ?? `https://s3.${region}.amazonaws.com`;
  const publicUrl =
    process.env.S3_PUBLIC_URL ?? `https://${bucket}.s3.${region}.amazonaws.com`;

  return { bucket, region, endpoint, accessKeyId, secretAccessKey, publicUrl };
}

// Minimal AWS Signature V4 signing for S3 operations via fetch
async function hmacSHA256(key: ArrayBuffer | Uint8Array, message: string): Promise<ArrayBuffer> {
  const keyData = key instanceof ArrayBuffer ? key : (key.buffer as ArrayBuffer).slice(key.byteOffset, key.byteOffset + key.byteLength);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message));
}

async function sha256(message: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message));
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function getSignatureKey(
  key: string,
  dateStamp: string,
  region: string,
  service: string,
): Promise<ArrayBuffer> {
  const kDate = await hmacSHA256(new TextEncoder().encode(`AWS4${key}`), dateStamp);
  const kRegion = await hmacSHA256(kDate, region);
  const kService = await hmacSHA256(kRegion, service);
  return hmacSHA256(kService, 'aws4_request');
}

class S3Provider implements StorageProvider {
  async upload(options: UploadOptions): Promise<UploadResult> {
    const config = getS3Config();
    const { key, body, contentType, acl = 'public-read', cacheControl } = options;

    let bodyContent: ArrayBuffer | string;
    if (body instanceof Blob) {
      bodyContent = await body.arrayBuffer();
    } else if (body instanceof ArrayBuffer) {
      bodyContent = body;
    } else if (typeof body === 'string') {
      bodyContent = body;
    } else {
      // ReadableStream - collect chunks
      const reader = (body as ReadableStream).getReader();
      const chunks: Uint8Array[] = [];
      let done = false;
      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (result.value) chunks.push(result.value);
      }
      const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
      const merged = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }
      bodyContent = merged.buffer;
    }

    const now = new Date();
    const dateStamp = now.toISOString().replace(/[-:]/g, '').slice(0, 8);
    const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');

    const payloadHash =
      typeof bodyContent === 'string'
        ? await sha256(bodyContent)
        : await sha256String(bodyContent);

    const headers: Record<string, string> = {
      Host: new URL(config.endpoint).host,
      'Content-Type': contentType,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
      'x-amz-acl': acl,
    };

    if (cacheControl) {
      headers['Cache-Control'] = cacheControl;
    }

    const method = 'PUT';
    const canonicalUri = `/${config.bucket}/${key}`;
    const canonicalQueryString = '';

    const signedHeaderKeys = Object.keys(headers)
      .map((h) => h.toLowerCase())
      .sort();
    const signedHeaders = signedHeaderKeys.join(';');
    const canonicalHeaders = signedHeaderKeys
      .map((h) => `${h}:${headers[Object.keys(headers).find((k) => k.toLowerCase() === h)!]}\n`)
      .join('');

    const canonicalRequest = [
      method,
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      await sha256(canonicalRequest),
    ].join('\n');

    const signingKey = await getSignatureKey(
      config.secretAccessKey,
      dateStamp,
      config.region,
      's3',
    );
    const signatureBuffer = await hmacSHA256(signingKey, stringToSign);
    const signature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    headers[
      'Authorization'
    ] = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const url = `${config.endpoint}/${config.bucket}/${key}`;
    const response = await fetch(url, {
      method,
      headers,
      body: bodyContent,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`S3 upload failed (${response.status}): ${errorText}`);
    }

    return {
      key,
      url: this.getUrl(key),
      size: typeof bodyContent === 'string' ? bodyContent.length : (bodyContent as ArrayBuffer).byteLength,
    };
  }

  getUrl(key: string): string {
    const config = getS3Config();
    return `${config.publicUrl}/${key}`;
  }

  async getSignedUrl(options: SignedUrlOptions): Promise<string> {
    const config = getS3Config();
    const { key, expiresIn = 3600 } = options;

    const now = new Date();
    const dateStamp = now.toISOString().replace(/[-:]/g, '').slice(0, 8);
    const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');

    const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`;
    const credential = `${config.accessKeyId}/${credentialScope}`;

    const queryParams = new URLSearchParams({
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': credential,
      'X-Amz-Date': amzDate,
      'X-Amz-Expires': String(expiresIn),
      'X-Amz-SignedHeaders': 'host',
    });

    const canonicalUri = `/${config.bucket}/${key}`;
    const canonicalQueryString = queryParams.toString().replace(/\+/g, '%20');

    const host = new URL(config.endpoint).host;
    const canonicalRequest = [
      'GET',
      canonicalUri,
      canonicalQueryString,
      `host:${host}\n`,
      'host',
      'UNSIGNED-PAYLOAD',
    ].join('\n');

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      await sha256(canonicalRequest),
    ].join('\n');

    const signingKey = await getSignatureKey(
      config.secretAccessKey,
      dateStamp,
      config.region,
      's3',
    );
    const signatureBuffer = await hmacSHA256(signingKey, stringToSign);
    const signature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return `${config.endpoint}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
  }

  async delete(key: string): Promise<void> {
    const config = getS3Config();

    const now = new Date();
    const dateStamp = now.toISOString().replace(/[-:]/g, '').slice(0, 8);
    const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');

    const payloadHash = await sha256('');
    const host = new URL(config.endpoint).host;

    const headers: Record<string, string> = {
      Host: host,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
    };

    const canonicalUri = `/${config.bucket}/${key}`;
    const signedHeaderKeys = Object.keys(headers)
      .map((h) => h.toLowerCase())
      .sort();
    const signedHeaders = signedHeaderKeys.join(';');
    const canonicalHeaders = signedHeaderKeys
      .map((h) => `${h}:${headers[Object.keys(headers).find((k) => k.toLowerCase() === h)!]}\n`)
      .join('');

    const canonicalRequest = [
      'DELETE',
      canonicalUri,
      '',
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      await sha256(canonicalRequest),
    ].join('\n');

    const signingKey = await getSignatureKey(
      config.secretAccessKey,
      dateStamp,
      config.region,
      's3',
    );
    const signatureBuffer = await hmacSHA256(signingKey, stringToSign);
    const signature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    headers[
      'Authorization'
    ] = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const url = `${config.endpoint}/${config.bucket}/${key}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok && response.status !== 204) {
      const errorText = await response.text();
      throw new Error(`S3 delete failed (${response.status}): ${errorText}`);
    }
  }
}

// Helper to hash ArrayBuffer
async function sha256String(buffer: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Local provider (development fallback) ───────────────────────────────────
class LocalProvider implements StorageProvider {
  private baseDir: string;

  constructor() {
    this.baseDir = process.env.LOCAL_STORAGE_DIR ?? '/tmp/rmx-uploads';
  }

  async upload(options: UploadOptions): Promise<UploadResult> {
    // In development, delegate to the filesystem via a local API route.
    // This avoids importing Node.js 'fs' in code that might run on the edge.
    const url = `/api/dev/upload`;

    let bodyForPost: BodyInit;
    let size: number;

    if (typeof options.body === 'string') {
      bodyForPost = options.body;
      size = options.body.length;
    } else if (options.body instanceof Blob) {
      bodyForPost = options.body;
      size = options.body.size;
    } else if (options.body instanceof ArrayBuffer) {
      bodyForPost = options.body;
      size = options.body.byteLength;
    } else {
      // ReadableStream
      bodyForPost = options.body as ReadableStream;
      size = 0;
    }

    console.log(
      `[LocalStorage] upload: ${options.key} (${options.contentType}, ${size} bytes) -> ${this.baseDir}/${options.key}`,
    );

    // In dev we just log; in a real setup, POST to the dev upload route.
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': options.contentType,
          'X-Upload-Key': options.key,
        },
        body: bodyForPost,
      });

      if (response.ok) {
        const data = await response.json();
        return { key: options.key, url: data.url ?? this.getUrl(options.key), size };
      }
    } catch {
      // Dev route not available, fall through to mock
    }

    return {
      key: options.key,
      url: this.getUrl(options.key),
      size,
    };
  }

  getUrl(key: string): string {
    return `/uploads/${key}`;
  }

  async getSignedUrl(options: SignedUrlOptions): Promise<string> {
    // In development, signed URLs are just regular URLs
    return this.getUrl(options.key);
  }

  async delete(key: string): Promise<void> {
    console.log(`[LocalStorage] delete: ${key}`);

    try {
      await fetch(`/api/dev/upload?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });
    } catch {
      // Dev route not available, just log
    }
  }
}

// ── Factory & singleton ─────────────────────────────────────────────────────
export function createStorageProvider(): StorageProvider {
  if (process.env.S3_BUCKET) {
    return new S3Provider();
  }

  if (process.env.NODE_ENV === 'development') {
    return new LocalProvider();
  }

  throw new Error(
    'No storage provider configured. Set S3_BUCKET for production or run in development mode.',
  );
}

let _storage: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (!_storage) {
    _storage = createStorageProvider();
  }
  return _storage;
}
