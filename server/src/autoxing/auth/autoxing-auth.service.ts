import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import {
  AutoxingAccessToken,
  AutoxingTokenRequestSchema,
  AutoxingTokenResponse,
} from '../types/autoxing-api.types';

const TOKEN_REFRESH_BUFFER_MS = 30_000;

@Injectable()
export class AutoxingAuthService {
  private readonly logger = new Logger(AutoxingAuthService.name);
  private cachedToken?: AutoxingAccessToken;
  private inflight?: Promise<AutoxingAccessToken>;

  constructor() {}

  async getAccessToken(forceRefresh = false): Promise<AutoxingAccessToken> {
    if (!forceRefresh && this.cachedToken) {
      if (Date.now() < this.cachedToken.expiresAt - TOKEN_REFRESH_BUFFER_MS) {
        return this.cachedToken;
      }
    }

    if (this.inflight) {
      return this.inflight;
    }

    this.inflight = this.fetchToken().finally(() => {
      this.inflight = undefined;
    });

    return this.inflight;
  }

  private async fetchToken(): Promise<AutoxingAccessToken> {
    const appId = process.env.AUTOXING_APP_ID?.trim();
    const appSecret = process.env.AUTOXING_APP_SECRET?.trim();
    const appCode = process.env.AUTOXING_APP_CODE?.trim();
    const baseUrl = (process.env.AUTOXING_BASE_URL ?? 'https://api.autoxing.com').trim();
    const timestampUnit = (process.env.AUTOXING_TIMESTAMP_UNIT ?? 'ms').trim().toLowerCase();

    if (!appId || !appSecret || !appCode) {
      throw new Error('AUTOXING_APP_ID, AUTOXING_APP_SECRET, and AUTOXING_APP_CODE are required');
    }

    const signedPayload = this.buildSignedPayload(appId, appSecret, timestampUnit);

    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/auth/v1.1/token`, {
      method: 'POST',
      headers: {
        Authorization: appCode,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signedPayload),
    });

    const payload = (await response.json()) as AutoxingTokenResponse;

    if (!response.ok || payload.status !== 200 || !payload.data?.token) {
      this.logger.error('Failed to authenticate with Autoxing', {
        statusCode: response.status,
        payload,
      });
      throw new Error('Failed to authenticate with Autoxing');
    }

    const expiresAt = Date.now() + payload.data.expireTime * 1000;
    this.cachedToken = {
      token: payload.data.token,
      key: payload.data.key,
      expiresAt,
    };

    return this.cachedToken;
  }

  private md5(value: string) {
    return createHash('md5').update(value).digest('hex');
  }

  private buildSignedPayload(
    appId: string,
    appSecret: string,
    timestampUnit: string,
  ): AutoxingTokenRequestSchema {
    if (timestampUnit !== 'ms' && timestampUnit !== 's') {
      throw new Error('AUTOXING_TIMESTAMP_UNIT must be either "ms" or "s"');
    }

    const timestamp = timestampUnit === 's' ? Math.floor(Date.now() / 1000) : Date.now();
    // CSP rule: sign = MD5(appId + timestamp + appSecret)
    const sign = this.md5(`${appId}${timestamp}${appSecret}`);

    return {
      appId,
      timestamp,
      sign,
    };
  }
}
