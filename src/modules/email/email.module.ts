// ============================================================================
// FILE: server/src/modules/email/email.module.ts (ESLINT FIXED)
// Email Service Module with Mailer Integration
// ============================================================================

import { Module, Global } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { EmailService } from './email.service';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      // ✅ FIX: Remove async since we don't await anything
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('email.host', 'smtp.gmail.com'),
          port: configService.get<number>('email.port', 587),
          secure: false, // true for 465, false for other ports
          auth: {
            user: configService.get<string>('email.user'),
            pass: configService.get<string>('email.password'),
          },
        },
        defaults: {
          from: configService.get<string>(
            'email.from',
            '"Law Firm System" <noreply@lawfirm.com>',
          ),
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
