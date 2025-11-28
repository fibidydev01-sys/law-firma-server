// ============================================================================
// FILE: src/modules/google-drive/google-drive-oauth.controller.ts
// One-time OAuth authorization for admin to connect Google Drive
// ============================================================================
import { Controller, Get, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { google } from 'googleapis';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Google Drive OAuth Setup')
@Controller('google-drive/oauth')
export class GoogleDriveOAuthController {
  private oauth2Client;

  constructor(private configService: ConfigService) {
    this.initializeOAuthClient();
  }

  private initializeOAuthClient() {
    const clientId = this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'GOOGLE_OAUTH_CLIENT_SECRET',
    );
    const redirectUri =
      this.configService.get<string>('GOOGLE_OAUTH_REDIRECT_URI') ||
      'http://localhost:3000/api/v1/google-drive/oauth/callback';

    if (!clientId || !clientSecret) {
      console.warn(
        '⚠️  OAuth not configured. Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET',
      );
      return;
    }

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri,
    );
  }

  @Public()
  @Get('authorize')
  @ApiOperation({
    summary: 'Step 1: Get OAuth authorization URL (Admin only - one time setup)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns OAuth authorization URL for admin to visit',
  })
  authorize() {
    if (!this.oauth2Client) {
      return {
        success: false,
        message:
          'OAuth not configured. Please set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in .env',
      };
    }

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline', // Important: Get refresh token
      scope: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file',
      ],
      prompt: 'consent', // Force consent screen to get refresh token
    });

    return {
      success: true,
      message: 'Please visit this URL to authorize (admin only, one-time setup)',
      authUrl: authUrl,
      instructions: [
        '1. Visit the URL above',
        '2. Login with your Google account (admin account with 15GB free Drive)',
        '3. Grant permissions',
        '4. You will be redirected back with authorization code',
        '5. The refresh token will be displayed - copy it to .env file',
      ],
    };
  }

  @Public()
  @Get('callback')
  @ApiOperation({
    summary: 'Step 2: OAuth callback handler (DO NOT call manually)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns refresh token to add to .env',
  })
  async callback(@Query('code') code: string, @Res() res: Response) {
    if (!this.oauth2Client) {
      return res.status(400).json({
        success: false,
        message: 'OAuth not configured',
      });
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'No authorization code provided',
      });
    }

    try {
      // Exchange authorization code for tokens
      const { tokens } = await this.oauth2Client.getToken(code);

      const refreshToken = tokens.refresh_token;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message:
            'No refresh token received. Make sure you are doing first-time authorization with prompt=consent',
        });
      }

      // Display success page with refresh token
      const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Google Drive OAuth - Success!</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 { color: #10b981; }
    h2 { color: #374151; margin-top: 30px; }
    .token-box {
      background: #f3f4f6;
      border: 2px solid #d1d5db;
      border-radius: 5px;
      padding: 15px;
      margin: 20px 0;
      word-break: break-all;
      font-family: monospace;
      font-size: 14px;
    }
    .step {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 15px;
      margin: 10px 0;
    }
    .warning {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
    }
    button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
    }
    button:hover {
      background: #2563eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>✅ Authorization Successful!</h1>
    <p>Google Drive has been authorized successfully. Now follow these steps:</p>

    <h2>📋 Your Refresh Token:</h2>
    <div class="token-box" id="refreshToken">${refreshToken}</div>
    <button onclick="copyToken()">📋 Copy Refresh Token</button>

    <h2>🔧 Setup Instructions:</h2>

    <div class="step">
      <strong>Step 1:</strong> Open your <code>apps/server/.env</code> file
    </div>

    <div class="step">
      <strong>Step 2:</strong> Add these lines (or update if they exist):
      <pre style="background: white; padding: 10px; margin-top: 10px;">
GOOGLE_OAUTH_CLIENT_ID=${this.configService.get('GOOGLE_OAUTH_CLIENT_ID')}
GOOGLE_OAUTH_CLIENT_SECRET=${this.configService.get('GOOGLE_OAUTH_CLIENT_SECRET')}
GOOGLE_OAUTH_REDIRECT_URI=${this.configService.get('GOOGLE_OAUTH_REDIRECT_URI') || 'http://localhost:3000/api/v1/google-drive/oauth/callback'}
GOOGLE_OAUTH_REFRESH_TOKEN=${refreshToken}
      </pre>
    </div>

    <div class="step">
      <strong>Step 3:</strong> Restart your server:
      <pre style="background: white; padding: 10px; margin-top: 10px;">
npm run start:dev
      </pre>
    </div>

    <div class="step">
      <strong>Step 4:</strong> Check server logs. You should see:
      <pre style="background: white; padding: 10px; margin-top: 10px;">
✅ Google Drive API initialized with OAuth
📦 Using admin's Google Drive for centralized storage
💾 15GB free quota available
      </pre>
    </div>

    <div class="warning">
      <strong>⚠️ Important:</strong> Keep this refresh token secret!
      It allows access to your Google Drive. Never commit it to Git.
    </div>

    <h2>✨ What's Next?</h2>
    <p>Once configured, all users can upload documents and files will be stored in YOUR Google Drive (15GB free quota).</p>
    <p>Users don't need to connect their Google accounts - they just use normal email/password login!</p>

    <script>
      function copyToken() {
        const token = document.getElementById('refreshToken').textContent;
        navigator.clipboard.writeText(token).then(() => {
          alert('Refresh token copied to clipboard!');
        });
      }
    </script>
  </div>
</body>
</html>
      `;

      res.send(html);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to exchange authorization code for tokens',
        error: error.message,
      });
    }
  }
}
