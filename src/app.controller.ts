import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator'; // Import decorator Public

@Controller()
@ApiTags('Root')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public() // Tambahkan ini agar tidak perlu auth
  @ApiOperation({ summary: 'API Information' })
  getHello() {
    return {
      success: true,
      message: 'Firma Hukum PERARI API',
      version: '1.0',
      documentation: '/api/docs',
      endpoints: {
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        klien: '/api/v1/klien',
        perkara: '/api/v1/perkara',
        tugas: '/api/v1/tugas',
        dokumen: '/api/v1/dokumen',
        sidang: '/api/v1/sidang',
        catatan: '/api/v1/catatan',
        timPerkara: '/api/v1/tim-perkara',
        konflik: '/api/v1/konflik',
        logs: '/api/v1/logs',
        dashboard: '/api/v1/dashboard',
      },
      quickStart: {
        login: 'POST /api/v1/auth/login',
        register: 'POST /api/v1/auth/register',
      },
    };
  }
}
