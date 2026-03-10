import crypto from 'crypto';

export function generatePropertyReferenceId(): string {
  const year = new Date().getFullYear();
  const rand = crypto.randomInt(1000, 10000);
  return `PR-${year}-${rand}`;
}
