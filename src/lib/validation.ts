import { z } from 'zod';

// Profile validation
export const profileSchema = z.object({
  username: z.string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, dashes and underscores')
    .optional()
    .or(z.literal('')),
  bio: z.string()
    .trim()
    .max(500, 'Bio must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  x_profile: z.string()
    .trim()
    .max(15, 'X handle must be less than 15 characters')
    .regex(/^@?[a-zA-Z0-9_]*$/, 'X handle can only contain letters, numbers and underscores')
    .optional()
    .or(z.literal('')),
});

// Comment validation
export const commentSchema = z.object({
  comment_text: z.string()
    .trim()
    .min(1, 'Comment cannot be empty')
    .max(500, 'Comment must be less than 500 characters'),
});

// Phone validation
export const phoneSchema = z.string()
  .regex(/^\+[1-9]\d{1,14}$/, 'Please enter a valid phone number with country code (e.g., +1234567890)');

// Email validation
export const emailSchema = z.string()
  .trim()
  .email('Please enter a valid email address')
  .max(255, 'Email must be less than 255 characters');

// Settings validation
export const settingsSchema = z.object({
  email: emailSchema.optional().or(z.literal('')),
  phone_number: phoneSchema.optional().or(z.literal('')),
  ai_coach_frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  ai_coach_time: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time (HH:MM)')
    .optional(),
  ai_coach_style: z.enum(['motivational', 'analytical', 'casual']).optional(),
});
