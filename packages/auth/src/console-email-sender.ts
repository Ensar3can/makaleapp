import { createLogger } from '@aip/logging';
import type { EmailMessage, EmailSender } from '@aip/application';

const logger = createLogger({ component: 'email' });

export class ConsoleEmailSender implements EmailSender {
  public async send(message: EmailMessage): Promise<void> {
    logger.info('Outbound email queued for console delivery', { to: message.to, subject: message.subject });
    process.stdout.write(`\n[email] to=${message.to}\n${message.subject}\n${message.text}\n\n`);
  }
}
