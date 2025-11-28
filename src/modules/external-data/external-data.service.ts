import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface NpointConfig {
  baseUrl: string;
  endpoints: Record<string, string>;
}

interface CachedData<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

@Injectable()
export class ExternalDataService {
  private readonly logger = new Logger(ExternalDataService.name);
  private cache: Map<string, CachedData<any>> = new Map();
  private readonly defaultCacheTTL = 5 * 60 * 1000;

  private readonly npointConfig: NpointConfig = {
    baseUrl: 'https://api.npoint.io',
    endpoints: {
      pancasila: '/a1a0f3580e5c51b7b7f5/pancasila',
      uud1945: '/a1a0f3580e5c51b7b7f5/uud1945',
      kuhp: '/a1a0f3580e5c51b7b7f5/kuhp',
      kuhperdata: '/a1a0f3580e5c51b7b7f5/kuhperdata',
      kuhd: '/a1a0f3580e5c51b7b7f5/kuhd',
      kuhap: '/a1a0f3580e5c51b7b7f5/kuhap',
    },
  };

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const customBaseUrl = this.configService.get<string>('NPOINT_BASE_URL');
    if (customBaseUrl) {
      this.npointConfig.baseUrl = customBaseUrl;
    }
  }

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    const isExpired = now - cached.timestamp > cached.ttl;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCachedData<T>(key: string, data: T, ttl = this.defaultCacheTTL): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  async fetchFromNpoint<T>(
    endpoint: string,
    options: { useCache?: boolean; cacheTTL?: number } = {},
  ): Promise<T> {
    const { useCache = true, cacheTTL = this.defaultCacheTTL } = options;

    let url: string;
    if (endpoint.startsWith('http')) {
      url = endpoint;
    } else if (endpoint.startsWith('/')) {
      url = `${this.npointConfig.baseUrl}${endpoint}`;
    } else {
      const endpointPath = this.npointConfig.endpoints[endpoint];
      if (!endpointPath) {
        throw new HttpException(
          `Endpoint key "${endpoint}" not found`,
          HttpStatus.BAD_REQUEST,
        );
      }
      url = `${this.npointConfig.baseUrl}${endpointPath}`;
    }

    if (useCache) {
      const cachedData = this.getCachedData<T>(url);
      if (cachedData) return cachedData;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get<T>(url, {
          headers: { 'Accept': 'application/json' },
        }),
      );

      const data = response.data;

      if (useCache) {
        this.setCachedData(url, data, cacheTTL);
      }

      return data;
    } catch (error: any) {
      this.logger.error(`Failed to fetch from: ${url}`, error.message);

      if (error.response) {
        throw new HttpException(
          `External API error: ${error.response.statusText}`,
          error.response.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      throw new HttpException(
        'Failed to fetch external data',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  // ========== PANCASILA ==========
  async getPancasila(useCache = true): Promise<any[]> {
    return this.fetchFromNpoint<any[]>('pancasila', { useCache });
  }

  // ========== UUD 1945 ==========
  async getUUD1945(useCache = true): Promise<any> {
    return this.fetchFromNpoint<any>('uud1945', { useCache });
  }

  // ========== KUHP ==========
  async getKUHP(useCache = true): Promise<any> {
    return this.fetchFromNpoint<any>('kuhp', { useCache });
  }

  // ========== KUH PERDATA ==========
  async getKUHPerdata(useCache = true): Promise<any> {
    return this.fetchFromNpoint<any>('kuhperdata', { useCache });
  }

  // ========== KUHD ==========
  async getKUHD(useCache = true): Promise<any> {
    return this.fetchFromNpoint<any>('kuhd', { useCache });
  }

  // ========== KUHAP ==========
  async getKUHAP(useCache = true): Promise<any> {
    return this.fetchFromNpoint<any>('kuhap', { useCache });
  }

  // ========== DEPRECATED (backward compatibility) ==========
  async getUU(useCache = true): Promise<any[]> {
    return this.getPancasila(useCache);
  }

  async getPeraturan(useCache = true): Promise<any[]> {
    return this.getUUD1945(useCache);
  }

  async getArtikelHukum(useCache = true): Promise<any[]> {
    return this.getKUHP(useCache);
  }

  // ========== UTILITY METHODS ==========
  async fetchCustom<T>(url: string, useCache = true): Promise<T> {
    return this.fetchFromNpoint<T>(url, { useCache });
  }

  addEndpoint(key: string, path: string): void {
    this.npointConfig.endpoints[key] = path;
  }

  getEndpoints(): Record<string, string> {
    return this.npointConfig.endpoints;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.fetchFromNpoint('pancasila', { useCache: false });
      return true;
    } catch (error) {
      return false;
    }
  }
}