import {
  BadGatewayException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { AutoxingAuthService } from '../auth/autoxing-auth.service';
import { AutoxingEnvelope, AutoxingRequestOptions } from '../types/autoxing-api.types';

@Injectable()
export class AutoxingApiService {
  private readonly logger = new Logger(AutoxingApiService.name);
  private readonly baseUrl = (process.env.AUTOXING_BASE_URL ?? 'https://api.autoxing.com').replace(/\/$/, '');

  constructor(
    @Inject(AutoxingAuthService)
    private readonly autoxingAuthService: AutoxingAuthService,
  ) {}

  async get<T = unknown>(path: string, options?: AutoxingRequestOptions) {
    return this.requestJson<T>('GET', path, options);
  }

  async post<T = unknown>(path: string, options?: AutoxingRequestOptions) {
    return this.requestJson<T>('POST', path, options);
  }

  async put<T = unknown>(path: string, options?: AutoxingRequestOptions) {
    return this.requestJson<T>('PUT', path, options);
  }

  async delete<T = unknown>(path: string, options?: AutoxingRequestOptions) {
    return this.requestJson<T>('DELETE', path, options);
  }

  async getBinary(path: string, options?: AutoxingRequestOptions) {
    const token = await this.autoxingAuthService.getAccessToken();
    const response = await fetch(this.buildUrl(path, options?.query), {
      method: 'GET',
      headers: {
        'X-Token': token.token,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Autoxing binary request failed: ${response.status}`, body);
      throw new BadGatewayException('Autoxing request failed');
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      contentType: response.headers.get('content-type') ?? 'application/octet-stream',
      buffer,
    };
  }

  private async requestJson<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, options?: AutoxingRequestOptions) {
    const token = await this.autoxingAuthService.getAccessToken();
    const hasBody = options?.body !== undefined;

    const response = await fetch(this.buildUrl(path, options?.query), {
      method,
      headers: {
        'X-Token': token.token,
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(hasBody ? { body: JSON.stringify(options?.body) } : {}),
    });

    let payload: AutoxingEnvelope<T> | null = null;
    try {
      payload = (await response.json()) as AutoxingEnvelope<T>;
    } catch {
      throw new InternalServerErrorException('Invalid response from Autoxing');
    }

    if (!response.ok || !payload || payload.status !== 200) {
      this.logger.error('Autoxing request failed', {
        method,
        path,
        httpStatus: response.status,
        payload,
      });
      throw new BadGatewayException(payload?.message ?? 'Autoxing request failed');
    }

    return payload;
  }

  private buildUrl(path: string, query?: Record<string, string | number | boolean | undefined>) {
    const url = new URL(`${this.baseUrl}${path}`);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) {
          continue;
        }
        url.searchParams.set(key, String(value));
      }
    }

    return url.toString();
  }
}
