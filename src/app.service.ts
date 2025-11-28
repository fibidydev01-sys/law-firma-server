import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Firma Hukum PERARI API is running!';
  }
}
