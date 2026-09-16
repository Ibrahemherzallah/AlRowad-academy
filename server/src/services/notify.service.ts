import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Notification service. Phase 1 ships stub providers that log intent;
 * swap the provider branches for Meta/Twilio/360dialog + Resend later.
 */

export async function sendWhatsApp(to: string, message: string): Promise<void> {
  if (env.WHATSAPP_PROVIDER === 'stub' || !env.WHATSAPP_API_KEY) {
    logger.info(`📱 [WhatsApp:stub] → ${to}: ${message}`);
    return;
  }
  // TODO: real provider integration
  logger.info(`📱 [WhatsApp:${env.WHATSAPP_PROVIDER}] → ${to}`);
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (env.EMAIL_PROVIDER === 'stub' || !env.EMAIL_API_KEY) {
    logger.info(`✉️  [Email:stub] → ${to} | ${subject}`);
    return;
  }
  // TODO: real provider integration
  void html;
  logger.info(`✉️  [Email:${env.EMAIL_PROVIDER}] → ${to} | ${subject}`);
}

/** Convenience: notify a student across all channels. */
export async function notifyStudent(
  student: { phone: string; email?: string },
  opts: { whatsapp?: string; emailSubject?: string; emailHtml?: string },
): Promise<void> {
  const tasks: Promise<void>[] = [];
  if (opts.whatsapp) tasks.push(sendWhatsApp(student.phone, opts.whatsapp));
  if (student.email && opts.emailSubject && opts.emailHtml)
    tasks.push(sendEmail(student.email, opts.emailSubject, opts.emailHtml));
  await Promise.allSettled(tasks);
}
