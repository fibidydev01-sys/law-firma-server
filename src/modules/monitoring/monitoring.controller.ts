// ===== FILE: src/modules/monitoring/monitoring.controller.ts =====
import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { MonitoringService } from './monitoring.service';

@ApiTags('Monitoring')
@Controller()
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Public()
  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiOperation({ summary: 'Prometheus metrics endpoint (public)' })
  async getMetrics(): Promise<string> {
    // 🔥 RETURN STRING!
    return await this.monitoringService.getMetrics(); // 🔥 LANGSUNG RETURN STRING
  }

  @Public()
  @Get('metrics/json')
  @ApiExcludeEndpoint()
  async getMetricsJSON() {
    return this.monitoringService.getMetricsJSON(); // Ini tetap JSON wrapper
  }
}
