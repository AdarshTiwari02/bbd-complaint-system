// ===========================================
// Shared Utility Functions
// ===========================================

import { TICKET_NUMBER_PREFIX, SLA_CONFIG } from '../constants';
import { TicketPriority } from '../types/ticket.types';

/**
 * Generate a unique ticket number
 * Format: BBD-YYYYMMDD-XXXXX
 */
export function generateTicketNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.floor(10000 + Math.random() * 90000);
  return `${TICKET_NUMBER_PREFIX}-${dateStr}-${random}`;
}

/**
 * Calculate SLA due date based on priority
 */
export function calculateSlaDueDate(priority: TicketPriority, fromDate?: Date): Date {
  const hours = SLA_CONFIG[priority];
  const date = fromDate ? new Date(fromDate) : new Date();
  date.setHours(date.getHours() + hours);
  return date;
}

/**
 * Check if a ticket is past its SLA due date
 */
export function isSlaBreach(slaDueAt: Date | null | undefined, status: string): boolean {
  if (!slaDueAt) return false;
  if (['RESOLVED', 'CLOSED', 'REJECTED'].includes(status)) return false;
  return new Date() > new Date(slaDueAt);
}

/**
 * Calculate time remaining until SLA breach
 * Returns negative number if breached
 */
export function getSlaTimeRemaining(slaDueAt: Date | null | undefined): number {
  if (!slaDueAt) return Infinity;
  return new Date(slaDueAt).getTime() - Date.now();
}

/**
 * Format SLA time remaining for display
 */
export function formatSlaRemaining(slaDueAt: Date | null | undefined): string {
  const remaining = getSlaTimeRemaining(slaDueAt);
  
  if (remaining === Infinity) return 'No SLA';
  
  const hours = Math.floor(Math.abs(remaining) / (1000 * 60 * 60));
  const minutes = Math.floor((Math.abs(remaining) % (1000 * 60 * 60)) / (1000 * 60));
  
  if (remaining < 0) {
    return `Breached ${hours}h ${minutes}m ago`;
  }
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h remaining`;
  }
  
  return `${hours}h ${minutes}m remaining`;
}

/**
 * Generate anonymous identifier for a user
 */
export function generateAnonymousId(userId: string): string {
  const hash = userId.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  return `Anonymous-${Math.abs(hash).toString(36).substring(0, 6).toUpperCase()}`;
}

/**
 * Mask email for privacy
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***@***';
  const maskedLocal = local.length > 2 
    ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
    : '*'.repeat(local.length);
  return `${maskedLocal}@${domain}`;
}

/**
 * Mask phone number for privacy
 */
export function maskPhone(phone: string): string {
  if (phone.length <= 4) return '*'.repeat(phone.length);
  return '*'.repeat(phone.length - 4) + phone.slice(-4);
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Generate a random string (for tokens, codes, etc.)
 */
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate recovery codes for MFA
 */
export function generateRecoveryCodes(count: number = 10, length: number = 10): string[] {
  return Array.from({ length: count }, () => generateRandomString(length));
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone format
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

/**
 * Sanitize string for safe display (basic XSS prevention)
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Parse and validate pagination parameters
 */
export function parsePagination(page?: number | string, limit?: number | string): { page: number; limit: number; skip: number } {
  const parsedPage = Math.max(1, parseInt(String(page || 1), 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(String(limit || 20), 10) || 20));
  return {
    page: parsedPage,
    limit: parsedLimit,
    skip: (parsedPage - 1) * parsedLimit,
  };
}

/**
 * Calculate pagination metadata
 */
export function getPaginationMeta(total: number, page: number, limit: number) {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Get initials from name
 */
export function getInitials(firstName: string, lastName?: string): string {
  const first = firstName.charAt(0).toUpperCase();
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return first + last;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Delay execution (for rate limiting, retries, etc.)
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        await delay(baseDelay * Math.pow(2, attempt));
      }
    }
  }
  
  throw lastError;
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if object is empty
 */
export function isEmpty(obj: Record<string, unknown>): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Remove undefined values from object
 */
export function removeUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  ) as Partial<T>;
}

