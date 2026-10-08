import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(3000),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  SANJAYA_ENGINE_SPACE: z.string().default('netha01/sanjaya-engine'),
  HF_TOKEN: z.string().optional().transform((v) => v || undefined),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  SUPABASE_BUCKET: z.string().default('sanjaya'),
  GEMINI_API_KEY: z.string().optional().transform((v) => (v && !v.startsWith('your_') ? v : undefined)),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  SCANS_PER_HOUR: z.coerce.number().default(20),
});

export const env = schema.parse(process.env);
