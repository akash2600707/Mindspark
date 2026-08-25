import {z} from 'zod';
export const registerSchema=z.object({fullName:z.string().trim().min(2).max(120),dob:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),clubName:z.string().trim().min(2).max(160),city:z.string().trim().max(100).optional(),email:z.string().trim().email().max(160).optional().or(z.literal('')),mobile:z.string().trim().max(25).optional()});
export const joinSchema=z.object({participantCode:z.string().trim().min(6).max(30),sessionToken:z.string().trim().min(20).optional()});
export const answerSchema=z.object({participantCode:z.string().trim().min(6).max(30),sessionToken:z.string().trim().min(20),questionId:z.string().uuid(),selectedOption:z.enum(['A','B','C','D'])});
