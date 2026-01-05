// src/dto/createUserDto.ts
import { z } from 'zod';

export const CreateUserDto = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export type CreateUserDto = z.infer<typeof CreateUserDto>;

// src/dto/updateUserDto.ts
import { z } from 'zod';

export const UpdateUserDto = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
});

export type UpdateUserDto = z.infer<typeof UpdateUserDto>;

// src/dto/aiPromptDto.ts
import { z } from 'zod';

export const AIPromptDto = z.object({
  prompt: z.string().min(1),
});

export type AIPromptDto = z.infer<typeof AIPromptDto>;
