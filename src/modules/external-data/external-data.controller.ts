import { Controller, Get, Post, Query, Body, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { ExternalDataService } from './external-data.service';

@Public()
@Controller('external-data')
export class ExternalDataController {
  constructor(private readonly externalDataService: ExternalDataService) { }

  // ========== PANCASILA ==========
  @Get('pancasila')
  async getPancasila(@Query('no-cache') noCache?: string) {
    const useCache = noCache !== 'true';
    return this.externalDataService.getPancasila(useCache);
  }

  // ========== UUD 1945 ==========
  @Get('uud1945')
  async getUUD1945(@Query('no-cache') noCache?: string) {
    const useCache = noCache !== 'true';
    return this.externalDataService.getUUD1945(useCache);
  }

  // ========== KUHP ==========
  @Get('kuhp')
  async getKUHP(@Query('no-cache') noCache?: string) {
    const useCache = noCache !== 'true';
    return this.externalDataService.getKUHP(useCache);
  }

  // ========== KUH PERDATA ==========
  @Get('kuhperdata')
  async getKUHPerdata(@Query('no-cache') noCache?: string) {
    const useCache = noCache !== 'true';
    return this.externalDataService.getKUHPerdata(useCache);
  }

  // ========== KUHD ==========
  @Get('kuhd')
  async getKUHD(@Query('no-cache') noCache?: string) {
    const useCache = noCache !== 'true';
    return this.externalDataService.getKUHD(useCache);
  }

  // ========== KUHAP ==========
  @Get('kuhap')
  async getKUHAP(@Query('no-cache') noCache?: string) {
    const useCache = noCache !== 'true';
    return this.externalDataService.getKUHAP(useCache);
  }

  // ========== CUSTOM FETCH ==========
  @Get('custom')
  async fetchCustom(
    @Query('url') url: string,
    @Query('no-cache') noCache?: string,
  ) {
    if (!url) {
      return {
        error: 'URL parameter is required',
        example: '/external-data/custom?url=https://api.npoint.io/your-bin-id',
      };
    }

    const useCache = noCache !== 'true';
    return this.externalDataService.fetchCustom(url, useCache);
  }

  // ========== CACHE MANAGEMENT ==========
  @Delete('cache')
  @HttpCode(HttpStatus.OK)
  clearAllCache() {
    this.externalDataService.clearCache();
    return {
      success: true,
      message: 'All cache cleared',
    };
  }

  @Delete('cache/:key')
  @HttpCode(HttpStatus.OK)
  clearSpecificCache(@Param('key') key: string) {
    this.externalDataService.clearCache(decodeURIComponent(key));
    return {
      success: true,
      message: `Cache cleared for key: ${key}`,
    };
  }

  // ========== ENDPOINT MANAGEMENT ==========
  @Get('endpoints')
  getEndpoints() {
    return {
      success: true,
      endpoints: this.externalDataService.getEndpoints(),
    };
  }

  @Post('endpoints')
  @HttpCode(HttpStatus.CREATED)
  addEndpoint(@Body() body: { key: string; path: string }) {
    const { key, path } = body;

    if (!key || !path) {
      return {
        success: false,
        message: 'Both key and path are required',
      };
    }

    this.externalDataService.addEndpoint(key, path);

    return {
      success: true,
      message: `Endpoint added: ${key} -> ${path}`,
    };
  }

  // ========== HEALTH CHECK ==========
  @Get('health')
  async healthCheck() {
    const isHealthy = await this.externalDataService.healthCheck();

    return {
      success: isHealthy,
      service: 'External Data (Npoint.io)',
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      endpoints: {
        pancasila: '/external-data/pancasila',
        uud1945: '/external-data/uud1945',
        kuhp: '/external-data/kuhp',
        kuhperdata: '/external-data/kuhperdata',
        kuhd: '/external-data/kuhd',
        kuhap: '/external-data/kuhap',
      },
    };
  }
}