import { APIRequestContext, APIResponse, expect } from '@playwright/test';

type Json = unknown;

type MultipartParts = {
  [key: string]: string | number | boolean | { name: string; mimeType: string; buffer: Buffer };
};

function safeJson(text: string): unknown {
  try { return JSON.parse(text); } catch { return text; }
}

export class RequestHandler {
  private request: APIRequestContext;
  private defaultBaseUrl: string;
  private defaultApiKey: string;

  private baseUrl: string | undefined;
  private apiPath = '';
  private queryParams: Record<string, string | number | boolean | Array<string | number>> = {};
  private apiHeaders: Record<string, string> = {};
  private apiBody: unknown = undefined;
  private apiForm: Record<string, string> | undefined = undefined;
  private apiMultipart: MultipartParts | undefined = undefined;
  private clearAuthFlag = false;

  constructor(request: APIRequestContext, apiBaseUrl: string, apiKey = '') {
    this.request = request;
    this.defaultBaseUrl = apiBaseUrl;
    this.defaultApiKey = apiKey;
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
    const response = await this.request.get(this.getUrl(), { headers: this.getHeaders() });
    return this.finish(response, statusCode);
  }

  async postRequest(statusCode: number | number[]): Promise<Json> {
    const response = await this.request.post(this.getUrl(), this.buildSendOptions());
    return this.finish(response, statusCode);
  }

  async putRequest(statusCode: number | number[]): Promise<Json> {
    const response = await this.request.put(this.getUrl(), this.buildSendOptions());
    return this.finish(response, statusCode);
  }

  async deleteRequest(statusCode: number | number[]): Promise<Json> {
    const response = await this.request.delete(this.getUrl(), { headers: this.getHeaders() });
    return this.finish(response, statusCode);
  }

  // Escape hatch for ambiguous cases where the test needs to branch on status
  // (e.g. "200 with empty array OR 400"). Returns status, headers, and parsed body — no assertion.
  async sendRaw(method: 'GET' | 'POST' | 'PUT' | 'DELETE'): Promise<{ status: number; headers: Record<string, string>; body: unknown }> {
    const url = this.getUrl();
    const headers = this.getHeaders();
    const opts = method === 'GET' || method === 'DELETE' ? { headers } : this.buildSendOptions();
    const fn = { GET: this.request.get, POST: this.request.post, PUT: this.request.put, DELETE: this.request.delete }[method];
    const response = await fn.call(this.request, url, opts as never);
    this.cleanUp();
    const status = response.status();
    const respHeaders = response.headers();
    const ct = respHeaders['content-type'] ?? '';
    let body: unknown = undefined;
    if (status !== 204) {
      const text = await response.text();
      if (text) body = ct.includes('application/json') ? safeJson(text) : text;
    }
    return { status, headers: respHeaders, body };
  }

  private buildSendOptions() {
    const headers = this.getHeaders();
    if (this.apiMultipart) return { headers, multipart: this.apiMultipart };
    if (this.apiForm) return { headers, form: this.apiForm };
    return { headers, data: this.apiBody };
  }

  private async finish(response: APIResponse, expectedStatus: number | number[]): Promise<Json> {
    const url = response.url();
    const actualStatus = response.status();
    this.cleanUp();
    const expected = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
    expect(
      expected,
      `Expected status in [${expected.join(', ')}] from ${url}, got ${actualStatus}`,
    ).toContain(actualStatus);

    const contentType = response.headers()['content-type'] ?? '';
    if (response.status() === 204) return undefined;
    if (contentType.includes('application/json')) {
      const text = await response.text();
      if (!text) return undefined;
      return safeJson(text);
    }
    return response.text();
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
