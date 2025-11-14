import { router, publicProcedure, protectedProcedure } from '../init';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  createVerificationCode,
  verifyCode,
  canResendCode,
  incrementResendCount
} from '@/lib/auth/verification';
import { CodeType } from '@/lib/types/prisma-enums';
import { logger } from '@/lib/utils/logger';
import {
  authRateLimitedProcedure,
  verificationRateLimitedProcedure,
} from '../middleware/ratelimit';
import {
  logAuthEvent,
  logDataChange,
  AUDIT_ACTIONS,
} from '@/lib/services/audit-log';

export const authRouter = router({
  signUp: authRateLimitedProcedure
    .input(z.object({
      email: z.string().email('Please enter a valid email address'),
      password: z.string().min(6, 'Password must be at least 6 characters'),
      name: z.string().min(2, 'Name must be at least 2 characters'),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            name: input.name,
          },
          // Supabase will send email confirmation automatically
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
      });

      if (error) {
        // Provide user-friendly error messages
        let message = error.message;
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          message = 'This email is already registered. Please log in instead.';
        } else if (error.message.includes('password')) {
          message = 'Password is too weak. Please use at least 6 characters.';
        } else if (error.message.includes('invalid') && error.message.includes('email')) {
          message = 'This email format is not accepted. Please use a real email address from a common provider (Gmail, Outlook, Yahoo, etc.). Test/temporary email addresses are not allowed.';
        } else if (error.message.includes('email')) {
          message = 'Invalid email address. Please use a valid email from a real email provider.';
        }

        throw new TRPCError({
          code: 'BAD_REQUEST',
          message,
        });
      }

      if (!data.user) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create account. Please try again.',
        });
      }

      // Check if user exists by email with different ID (seed data or old signup scenario)
      const existingUserByEmail = await ctx.prisma.user.findUnique({
        where: { email: input.email },
        include: { roles: true },
      });

      if (existingUserByEmail && existingUserByEmail.id !== data.user.id) {
        // User exists with different ID - this shouldn't happen in normal flow
        // Delete the old user and create with new Supabase ID
        logger.debug('User exists with different ID, migrating to new Supabase ID', {
          oldId: existingUserByEmail.id,
          newId: data.user.id,
          email: input.email,
        });

        await ctx.prisma.user.delete({
          where: { id: existingUserByEmail.id },
        });
      }

      // Create user in database
      try {
        const newUser = await ctx.prisma.user.create({
          data: {
            id: data.user.id,
            email: input.email,
            name: input.name,
            roles: {
              create: [
                {
                  type: 'PARENT',
                  tier: 'FREE',
                  color: '#9333ea', // Purple for parent mode
                },
                {
                  type: 'TEACHER',
                  tier: 'FREE',
                  color: '#3b82f6', // Blue for teacher mode
                },
              ],
            },
          },
          include: {
            roles: true,
          },
        });

        // Auto-create "Me" person for the parent role
        const parentRole = newUser.roles.find((role) => role.type === 'PARENT');
        if (parentRole) {
          const parentMePerson = await ctx.prisma.person.create({
            data: {
              roleId: parentRole.id,
              name: 'Me',
              avatar: JSON.stringify({
                color: '#BAE1FF', // Light blue
                emoji: '👤',
              }),
              status: 'ACTIVE',
            },
          });

          // Create default "Daily Routine" for parent "Me"
          await ctx.prisma.routine.create({
            data: {
              roleId: parentRole.id,
              name: 'Daily Routine',
              description: 'Default routine for daily tasks',
              resetPeriod: 'DAILY',
              status: 'ACTIVE',
              assignments: {
                create: {
                  personId: parentMePerson.id,
                },
              },
            },
          });
        }

        // Auto-create "Me" person for the teacher role
        const teacherRole = newUser.roles.find((role) => role.type === 'TEACHER');
        if (teacherRole) {
          const teacherMePerson = await ctx.prisma.person.create({
            data: {
              roleId: teacherRole.id,
              name: 'Me',
              avatar: JSON.stringify({
                color: '#BAE1FF',
                emoji: '👤',
              }),
              status: 'ACTIVE',
            },
          });

          // Create default "Daily Routine" for teacher "Me"
          await ctx.prisma.routine.create({
            data: {
              roleId: teacherRole.id,
              name: 'Daily Routine',
              description: 'Default routine for daily tasks',
              resetPeriod: 'DAILY',
              status: 'ACTIVE',
              assignments: {
                create: {
                  personId: teacherMePerson.id,
                },
              },
            },
          });

          // Create default classroom group for teacher
          await ctx.prisma.group.create({
            data: {
              roleId: teacherRole.id,
              name: 'Teacher-Only',
              description: 'For teachers and co-teachers only',
              type: 'CLASSROOM',
              isClassroom: true,
              status: 'ACTIVE',
              members: {
                create: {
                  personId: teacherMePerson.id,
                  role: 'member',
                },
              },
            },
          });
        }
      } catch (dbError) {
        // User already exists in DB, ensure they have roles
        logger.debug('User already exists in database', { userId: data.user.id, error: dbError });

        // Check if user has any roles, create both if not
        const existingUser = await ctx.prisma.user.findUnique({
          where: { id: data.user.id },
          include: { roles: true },
        });

        if (existingUser && existingUser.roles.length === 0) {
          const parentRole = await ctx.prisma.role.create({
            data: {
              userId: data.user.id,
              type: 'PARENT',
              tier: 'FREE',
              color: '#9333ea', // Purple for parent mode
            },
          });

          const teacherRole = await ctx.prisma.role.create({
            data: {
              userId: data.user.id,
              type: 'TEACHER',
              tier: 'FREE',
              color: '#3b82f6', // Blue for teacher mode
            },
          });

          // Auto-create "Me" person for parent
          const parentMePerson = await ctx.prisma.person.create({
            data: {
              roleId: parentRole.id,
              name: 'Me',
              avatar: JSON.stringify({
                color: '#BAE1FF',
                emoji: '👤',
              }),
              status: 'ACTIVE',
            },
          });

          // Create default "Daily Routine" for parent "Me"
          await ctx.prisma.routine.create({
            data: {
              roleId: parentRole.id,
              name: 'Daily Routine',
              description: 'Default routine for daily tasks',
              resetPeriod: 'DAILY',
              status: 'ACTIVE',
              assignments: {
                create: {
                  personId: parentMePerson.id,
                },
              },
            },
          });

          // Auto-create "Me" person for teacher
          const teacherMePerson = await ctx.prisma.person.create({
            data: {
              roleId: teacherRole.id,
              name: 'Me',
              avatar: JSON.stringify({
                color: '#BAE1FF',
                emoji: '👤',
              }),
              status: 'ACTIVE',
            },
          });

          // Create default "Daily Routine" for teacher "Me"
          await ctx.prisma.routine.create({
            data: {
              roleId: teacherRole.id,
              name: 'Daily Routine',
              description: 'Default routine for daily tasks',
              resetPeriod: 'DAILY',
              status: 'ACTIVE',
              assignments: {
                create: {
                  personId: teacherMePerson.id,
                },
              },
            },
          });

          // Create default classroom group for teacher
          await ctx.prisma.group.create({
            data: {
              roleId: teacherRole.id,
              name: 'Teacher-Only',
              description: 'For teachers and co-teachers only',
              type: 'CLASSROOM',
              isClassroom: true,
              status: 'ACTIVE',
              members: {
                create: {
                  personId: teacherMePerson.id,
                  role: 'member',
                },
              },
            },
          });
        }
      }

      // Log successful signup
      await logAuthEvent(AUDIT_ACTIONS.AUTH_SIGNUP, data.user.id, true, {
        email: input.email,
      });

      return { success: true, userId: data.user.id };
    }),

  signIn: authRateLimitedProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error) {
        // Log failed login attempt
        // Note: We don't have userId for failed logins, so we'll use email
        logger.warn('Failed login attempt', { email: input.email, error: error.message });

        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      // Check if user exists by email with different ID (seed data scenario)
      const existingUserByEmail = await ctx.prisma.user.findUnique({
        where: { email: data.user.email! },
        include: { roles: true },
      });

      let user;

      if (existingUserByEmail && existingUserByEmail.id !== data.user.id) {
        // User exists from seed data with different ID
        // Migrate roles to new Supabase Auth ID
        const existingRoles = existingUserByEmail.roles;

        // Delete old user (cascade will delete associated records)
        await ctx.prisma.user.delete({
          where: { id: existingUserByEmail.id },
        });

        // Create new user with Supabase Auth ID, preserving data and roles
        user = await ctx.prisma.user.create({
          data: {
            id: data.user.id,
            email: data.user.email!,
            name: existingUserByEmail.name,
            emailVerified: data.user.email_confirmed_at ? new Date(data.user.email_confirmed_at) : null,
            roles: {
              create: existingRoles.map((role: any) => ({
                type: role.type,
                tier: role.tier,
                color: role.color || (role.type === 'PARENT' ? '#9333ea' : role.type === 'TEACHER' ? '#3b82f6' : role.type === 'PRINCIPAL' ? '#f59e0b' : '#10b981'),
              })),
            },
          },
          include: { roles: true },
        });
      } else {
        // Normal upsert - user doesn't exist or has matching ID
        user = await ctx.prisma.user.upsert({
          where: { id: data.user.id },
          update: {
            email: data.user.email!,
            emailVerified: data.user.email_confirmed_at ? new Date(data.user.email_confirmed_at) : null,
          },
          create: {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
            emailVerified: data.user.email_confirmed_at ? new Date(data.user.email_confirmed_at) : null,
          },
          include: {
            roles: true,
          },
        });
      }

      // Auto-create both PARENT and TEACHER roles for first-time users
      if (user.roles.length === 0) {
        const parentRole = await ctx.prisma.role.create({
          data: {
            userId: user.id,
            type: 'PARENT',
            tier: 'FREE',
            color: '#9333ea', // Purple for parent mode
          },
        });

        const teacherRole = await ctx.prisma.role.create({
          data: {
            userId: user.id,
            type: 'TEACHER',
            tier: 'FREE',
            color: '#3b82f6', // Blue for teacher mode
          },
        });

        // Auto-create "Me" person for both parent and teacher roles
        const parentMePerson = await ctx.prisma.person.create({
          data: {
            roleId: parentRole.id,
            name: 'Me',
            avatar: JSON.stringify({
              color: '#BAE1FF',
              emoji: '👤',
            }),
            status: 'ACTIVE',
          },
        });

        // Create default "Daily Routine" for parent "Me"
        await ctx.prisma.routine.create({
          data: {
            roleId: parentRole.id,
            name: 'Daily Routine',
            description: 'Default routine for daily tasks',
            resetPeriod: 'DAILY',
            status: 'ACTIVE',
            assignments: {
              create: {
                personId: parentMePerson.id,
              },
            },
          },
        });

        const teacherMePerson = await ctx.prisma.person.create({
          data: {
            roleId: teacherRole.id,
            name: 'Me',
            avatar: JSON.stringify({
              color: '#BAE1FF',
              emoji: '👤',
            }),
            status: 'ACTIVE',
          },
        });

        // Create default "Daily Routine" for teacher "Me"
        await ctx.prisma.routine.create({
          data: {
            roleId: teacherRole.id,
            name: 'Daily Routine',
            description: 'Default routine for daily tasks',
            resetPeriod: 'DAILY',
            status: 'ACTIVE',
            assignments: {
              create: {
                personId: teacherMePerson.id,
              },
            },
          },
        });

        // Create default classroom group for teacher
        await ctx.prisma.group.create({
          data: {
            roleId: teacherRole.id,
            name: 'Teacher-Only',
            description: 'For teachers and co-teachers only',
            type: 'CLASSROOM',
            isClassroom: true,
            status: 'ACTIVE',
            members: {
              create: {
                personId: teacherMePerson.id,
                role: 'member',
              },
            },
          },
        });
      } else {
        // Ensure user has both PARENT and TEACHER roles
        const hasParentRole = user.roles.some((role: any) => role.type === 'PARENT');
        const hasTeacherRole = user.roles.some((role: any) => role.type === 'TEACHER');

        let parentRole = user.roles.find((role: any) => role.type === 'PARENT');
        let teacherRole = user.roles.find((role: any) => role.type === 'TEACHER');

        // Create missing PARENT role
        if (!hasParentRole) {
          parentRole = await ctx.prisma.role.create({
            data: {
              userId: user.id,
              type: 'PARENT',
              tier: 'FREE',
              color: '#9333ea',
            },
          });
        }

        // Create missing TEACHER role
        if (!hasTeacherRole) {
          teacherRole = await ctx.prisma.role.create({
            data: {
              userId: user.id,
              type: 'TEACHER',
              tier: 'FREE',
              color: '#3b82f6',
            },
          });
        }

        // Check if "Me" person exists for parent role
        if (parentRole) {
          const mePersonExists = await ctx.prisma.person.findFirst({
            where: {
              roleId: parentRole.id,
              name: 'Me',
            },
          });

          // Create "Me" person if it doesn't exist
          if (!mePersonExists) {
            const parentMePerson = await ctx.prisma.person.create({
              data: {
                roleId: parentRole.id,
                name: 'Me',
                avatar: JSON.stringify({
                  color: '#BAE1FF',
                  emoji: '👤',
                }),
                status: 'ACTIVE',
              },
            });

            // Create default "Daily Routine" for parent "Me"
            await ctx.prisma.routine.create({
              data: {
                roleId: parentRole.id,
                name: 'Daily Routine',
                description: 'Default routine for daily tasks',
                resetPeriod: 'DAILY',
                status: 'ACTIVE',
                assignments: {
                  create: {
                    personId: parentMePerson.id,
                  },
                },
              },
            });
          }
        }

        // Check if "Me" person exists for teacher role
        if (teacherRole) {
          const mePersonExists = await ctx.prisma.person.findFirst({
            where: {
              roleId: teacherRole.id,
              name: 'Me',
            },
          });

          // Create "Me" person if it doesn't exist
          if (!mePersonExists) {
            const teacherMePerson = await ctx.prisma.person.create({
              data: {
                roleId: teacherRole.id,
                name: 'Me',
                avatar: JSON.stringify({
                  color: '#BAE1FF',
                  emoji: '👤',
                }),
                status: 'ACTIVE',
              },
            });

            // Create default "Daily Routine" for teacher "Me"
            await ctx.prisma.routine.create({
              data: {
                roleId: teacherRole.id,
                name: 'Daily Routine',
                description: 'Default routine for daily tasks',
                resetPeriod: 'DAILY',
                status: 'ACTIVE',
                assignments: {
                  create: {
                    personId: teacherMePerson.id,
                  },
                },
              },
            });

            // Create default classroom group for teacher if it doesn't exist
            const classroomExists = await ctx.prisma.group.findFirst({
              where: {
                roleId: teacherRole.id,
                type: 'CLASSROOM',
              },
            });

            if (!classroomExists) {
              await ctx.prisma.group.create({
                data: {
                  roleId: teacherRole.id,
                  name: 'Teacher-Only',
                  description: 'For teachers and co-teachers only',
                  type: 'CLASSROOM',
                  isClassroom: true,
                  status: 'ACTIVE',
                  members: {
                    create: {
                      personId: teacherMePerson.id,
                      role: 'member',
                    },
                  },
                },
              });
            }
          }
        }
      }

      // Log successful login
      await logAuthEvent(AUDIT_ACTIONS.AUTH_LOGIN, data.user.id, true, {
        email: input.email,
      });

      return { success: true, userId: data.user.id };
    }),

  signOut: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Log logout
      await logAuthEvent(AUDIT_ACTIONS.AUTH_LOGOUT, ctx.user.id, true);

      await ctx.supabase.auth.signOut();
      return { success: true };
    }),

  getSession: publicProcedure
    .query(async ({ ctx }) => {
      const { data: { user } } = await ctx.supabase.auth.getUser();

      if (!user) {
        return { user: null };
      }

      const dbUser = await ctx.prisma.user.findUnique({
        where: { id: user.id },
        include: {
          roles: true,
        },
      });

      return { user: dbUser };
    }),

  sendVerificationCode: publicProcedure
    .input(z.object({
      userId: z.string(),
      email: z.string().email(),
    }))
    .mutation(async ({ ctx, input }) => {
      const code = await createVerificationCode(
        input.userId,
        input.email,
        CodeType.EMAIL_VERIFICATION
      );

      // TODO: Send email with code using your email service
      // For development only - DO NOT log codes in production
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Verification code generated', { email: input.email, code });
      }

      return { success: true };
    }),

  verifyEmailCode: verificationRateLimitedProcedure
    .input(z.object({
      userId: z.string(),
      code: z.string().length(6),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await verifyCode(
        input.userId,
        input.code,
        CodeType.EMAIL_VERIFICATION
      );

      if (!result.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.error || 'Invalid code',
        });
      }

      // Update user's emailVerified status in database
      await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { emailVerified: new Date() },
      });

      // Update Supabase user metadata for middleware checks (Edge Runtime compatible)
      await ctx.supabase.auth.updateUser({
        data: {
          emailVerified: true,
        },
      });

      // Log email verification
      await logAuthEvent(AUDIT_ACTIONS.EMAIL_VERIFY, input.userId, true);

      return { success: true };
    }),

  resendVerificationCode: verificationRateLimitedProcedure
    .input(z.object({
      userId: z.string(),
      email: z.string().email(),
    }))
    .mutation(async ({ ctx, input }) => {
      const canResend = await canResendCode(
        input.userId,
        CodeType.EMAIL_VERIFICATION
      );

      if (!canResend.canResend) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: canResend.error || 'Cannot resend code at this time',
        });
      }

      await incrementResendCount(input.userId, CodeType.EMAIL_VERIFICATION);

      const code = await createVerificationCode(
        input.userId,
        input.email,
        CodeType.EMAIL_VERIFICATION
      );

      // TODO: Send email with code using your email service
      // For development only - DO NOT log codes in production
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Verification code resent', { email: input.email, code });
      }

      return { success: true };
    }),
});
