import { IProgSmsService } from './iprogSmsService';

/**
 * Singleton IProgSmsService instance shared across all API routes.
 * This ensures that runtime config updates (e.g. toggling mock mode
 * from SMS Studio) are reflected in the send route immediately.
 */
export const smsService = new IProgSmsService();
