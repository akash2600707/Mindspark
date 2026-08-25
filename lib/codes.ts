import crypto from 'crypto';
export function participantCode(){return `MM26-${crypto.randomBytes(4).toString('hex').toUpperCase()}`}
export function sessionToken(){return crypto.randomBytes(32).toString('base64url')}
