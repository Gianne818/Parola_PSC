import { IProgSmsService } from './iprogSmsService';

/**
 * Singleton IProgSmsService instance shared across all API routes.
 * This ensures that runtime config updates (e.g. toggling mock mode)
 * are reflected in the send route immediately.
 */
export const smsService = new IProgSmsService();
