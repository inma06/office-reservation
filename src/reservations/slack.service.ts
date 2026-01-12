import { Injectable, Logger } from '@nestjs/common';
import * as https from 'https';

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);
  private readonly webhookUrl: string;

  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL || '';
    if (!this.webhookUrl) {
      this.logger.warn('SLACK_WEBHOOK_URL이 설정되지 않았습니다.');
    }
  }

  async sendNotification(message: string): Promise<boolean> {
    if (!this.webhookUrl) {
      this.logger.error('Slack 웹훅 URL이 설정되지 않았습니다.');
      return false;
    }

    try {
      const payload = JSON.stringify({ text: message });
      const url = new URL(this.webhookUrl);

      return new Promise((resolve, reject) => {
        const options = {
          hostname: url.hostname,
          port: url.port || 443,
          path: url.pathname + url.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
        };

        const req = https.request(options, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            if (res.statusCode === 200) {
              this.logger.log('Slack 알림 전송 성공');
              resolve(true);
            } else {
              this.logger.error(`Slack 알림 전송 실패: ${res.statusCode} - ${data}`);
              resolve(false);
            }
          });
        });

        req.on('error', (error) => {
          this.logger.error(`Slack 알림 전송 중 오류 발생: ${error.message}`);
          resolve(false);
        });

        req.write(payload);
        req.end();
      });
    } catch (error) {
      this.logger.error(`Slack 알림 전송 중 예외 발생: ${error.message}`);
      return false;
    }
  }
}
