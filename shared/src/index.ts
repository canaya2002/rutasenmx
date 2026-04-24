/**
 * Single barrel export. Both web (@/shared/...) and mobile (shared/...) import
 * from here. No runtime code lives here — just types, constants and string
 * enums that are safe to duplicate across platforms.
 */
export * from './types/plans';
export * from './types/places';
export * from './types/social';
export * from './types/trips';
export * from './types/analytics';
export * from './types/entitlements';
export * from './schemas/auth';
export * from './api';
export * from './constants';
export * from './deep-links';
