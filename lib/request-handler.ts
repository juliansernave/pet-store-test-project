import { APIRequestContext, APIResponse, expect, test } from '@playwright/test';

type Json = unknown;

type MultipartParts = {
  [key: string]: string | number | boolean | { name: string; mimeType: string; buffer: Buffer };
};

export type Capture = {
  method: string;
  url: string;
  requestHeaders: Record<string, string>;
  requestBody: unknown;
  status: number;
  responseHeaders: Record<string, string>;
  responseBody: string;
  duration: number;
};

function safeJson(text: string): unknown {
  try { return JSON.parse(text); } catch { return text; }
}

export class RequestHandler {
  private request: APIRequestContext;
  private defaultBaseUrl: string;
  private defaultApiKey: string;
  private captures: Capture[];

  private baseUrl: string | undefined;
  private apiPath = '';
  private queryParams: Record<string, string | number | boolean | Array<string | number>> = {};
  private apiHeaders: Record<string, string> = {};
  private apiBody: unknown = undefined;
  private apiForm: Record<string, string> | undefined = undefined;
  private apiMultipart: MultipartParts | undefined = undefined;
  private clearAuthFlag = false;

  constructor(request: APIRequestContext, apiBaseUrl: string, apiKey = '', captures: Capture[] = []) {
    this.request = request;
    this.defaultBaseUrl = apiBaseUrl;
    this.defaultApiKey = apiKey;
    this.captures = captures;
  }

  url(url: string) { this.baseUrl = url; return this; }
  path(path: string) { this.apiPath = path; return this; }
  params(params: Record<string, string | number | boolean | Array<string | number>>) { this.queryParams = params; return this; }
  headers(headers: Record<string, string>) { this.apiHeaders = { ...this.apiHeaders, ...headers }; return this; }
  body(body: unknown) { this.apiBody = body; return this; }
  form(form: Record<string, string>) { this.apiForm = form; return this; }
  multipart(parts: MultipartParts) { this.apiMultipart = parts; return this; }
  clearAuth() { this.clearAuthFlag = true; return this; }

  async getRequest(statusCode: number | number[]): Promise<Json> {
    return this.execute('GET', statusCode, (url, headers) => this.request.get(url, { headers }));
  }

  async postRequest(statusCode: number | number[]): Promise<Json> {
    const opts = this.buildSendOptions();
    return this.execute('POST', statusCode, (url) => this.request.post(url, opts));
  }

  async putRequest(statusCode: number | number[]): Promise<Json> {
    const opts = this.buildSendOptions();
    return this.execute('PUT', statusCode, (url) => this.request.put(url, opts));
  }

  async deleteRequest(statusCode: number | number[]): Promise<Json> {
    return this.execute('DELETE', statusCode, (url, headers) => this.request.delete(url, { headers }));
  }

  async sendRaw(method: 'GET' | 'POST' | 'PUT' | 'DELETE'): Promise<{ status: number; headers: Record<string, string>; body: unknown }> {
    const url = this.getUrl();
    const headers = this.getHeaders();
    const path = this.apiPath;
    const requestBody = this.snapshotRequestBody();
    const opts = method === 'GET' || method === 'DELETE' ? { headers } : this.buildSendOptions();
    this.cleanUp();

    return await test.step(`${method} ${path}`, async () => {
      const fn = { GET: this.request.get, POST: this.request.post, PUT: this.request.put, DELETE: this.request.delete }[method];
      const start = Date.now();
      const response = await fn.call(this.request, url, opts as never);
      const duration = Date.now() - start;
      const status = response.status();
      const respHeaders = response.headers();
      const ct = respHeaders['content-type'] ?? '';
      const bodyText = status === 204 ? '' : await response.text();

      this.captures.push({ method, url, requestHeaders: headers, requestBody, status, responseHeaders: respHeaders, responseBody: bodyText, duration });
      await test.step(`→ ${status} (${duration}ms)`, async () => {});

      let body: unknown = undefined;
      if (bodyText) body = ct.includes('application/json') ? safeJson(bodyText) : bodyText;
      return { status, headers: respHeaders, body };
    });
  }

  private async execute(
    method: string,
    statusCode: number | number[],
    fn: (url: string, headers: Record<string, string>) => Promise<APIResponse>,
  ): Promise<Json> {
    const url = this.getUrl();
    const headers = this.getHeaders();
    const path = this.apiPath;
    const requestBody = this.snapshotRequestBody();
    this.cleanUp();

    return await test.step(`${method} ${path}`, async () => {
      const start = Date.now();
      const response = await fn(url, headers);
      const duration = Date.now() - start;
      const status = response.status();
      const respHeaders = response.headers();
      const ct = respHeaders['content-type'] ?? '';
      const bodyText = status === 204 ? '' : await response.text();

      this.captures.push({ method, url, requestHeaders: headers, requestBody, status, responseHeaders: respHeaders, responseBody: bodyText, duration });
      await test.step(`→ ${status} (${duration}ms)`, async () => {});

      const expected = Array.isArray(statusCode) ? statusCode : [statusCode];
      expect(
        expected,
        `Expected status in [${expected.join(', ')}] from ${url}, got ${status}`,
      ).toContain(status);

      if (status === 204) return undefined;
      if (ct.includes('application/json')) return bodyText ? safeJson(bodyText) : undefined;
      return bodyText;
    });
  }

  private buildSendOptions() {
    const headers = this.getHeaders();
    if (this.apiMultipart) return { headers, multipart: this.apiMultipart };
    if (this.apiForm) return { headers, form: this.apiForm };
    return { headers, data: this.apiBody };
  }

  private snapshotRequestBody(): unknown {
    if (this.apiMultipart) {
      const summary: Record<string, string> = {};
      for (const [k, v] of Object.entries(this.apiMultipart)) {
        summary[k] = typeof v === 'object' && 'buffer' in v ? `<file: ${v.name} (${v.buffer.length} bytes)>` : String(v);
      }
      return summary;
    }
    if (this.apiForm) return this.apiForm;
    return this.apiBody;
  }

  private getUrl(): string {
    const url = new URL(`${this.baseUrl ?? this.defaultBaseUrl}${this.apiPath}`);
    for (const [key, value] of Object.entries(this.queryParams)) {
      if (Array.isArray(value)) {
        for (const v of value) url.searchParams.append(key, String(v));
      } else {
        url.searchParams.append(key, String(value));
      }
    }
    return url.toString();
  }

  private getHeaders(): Record<string, string> {
    const headers = { ...this.apiHeaders };
    if (!this.clearAuthFlag && this.defaultApiKey && !('api_key' in headers)) {
      headers['api_key'] = this.defaultApiKey;
    }
    return headers;
  }

  private cleanUp() {
    this.baseUrl = undefined;
    this.apiPath = '';
    this.queryParams = {};
    this.apiHeaders = {};
    this.apiBody = undefined;
    this.apiForm = undefined;
    this.apiMultipart = undefined;
    this.clearAuthFlag = false;
  }
}
