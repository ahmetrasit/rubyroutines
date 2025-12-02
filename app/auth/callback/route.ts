import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

const LAST_MODE_COOKIE = 'rubyroutines_last_mode';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  // Get the host from the request headers (this will be the actual IP or localhost)
  const host = request.headers.get('host');
  const protocol = process.env.NODE_ENV === 'production' ? 'https:' : 'http:';
  const redirectBase = `${protocol}//${host || 'localhost:3000'}`;

  // Get last visited mode from cookie
  const cookieStore = await cookies();
  const lastMode = cookieStore.get(LAST_MODE_COOKIE)?.value;
  const redirectPath = lastMode === 'teacher' ? '/teacher' : '/parent';

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, error_description);
    return NextResponse.redirect(`${redirectBase}/login?error=${encodeURIComponent(error_description || error)}`);
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(`${redirectBase}/login?error=auth_failed`);
      }

      if (data.user) {
        // Check if user exists by email with different ID
        const existingUserByEmail = await prisma.user.findUnique({
          where: { email: data.user.email! },
          include: { roles: true },
        });

        let user;

      if (existingUserByEmail && existingUserByEmail.id !== data.user.id) {
        // User exists with different ID - migrate to new Supabase Auth ID
        const existingRoles = existingUserByEmail.roles;

        // Delete old user (cascade will delete associated records)
        await prisma.user.delete({
          where: { id: existingUserByEmail.id },
        });

        // Create new user with Supabase Auth ID, preserving data and roles
        user = await prisma.user.create({
          data: {
            id: data.user.id,
            email: data.user.email!,
            name: existingUserByEmail.name || data.user.user_metadata.full_name || data.user.email!.split('@')[0],
            emailVerified: new Date(),
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
        user = await prisma.user.upsert({
          where: { id: data.user.id },
          create: {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata.full_name || data.user.email!.split('@')[0],
            emailVerified: new Date(),
          },
          update: {
            emailVerified: new Date(),
          },
          include: {
            roles: true,
          },
        });
      }

        // Ensure user has both PARENT and TEACHER roles
        if (user.roles.length === 0) {
          // Create both roles for new users
          const parentRole = await prisma.role.create({
          data: {
            userId: user.id,
            type: 'PARENT',
            tier: 'FREE',
            color: '#9333ea', // Purple for parent mode
          },
        });

        const teacherRole = await prisma.role.create({
          data: {
            userId: user.id,
            type: 'TEACHER',
            tier: 'FREE',
            color: '#3b82f6', // Blue for teacher mode
          },
        });

        // Auto-create account owner person for both parent and teacher roles
        // Use user's actual name and role-specific emoji
        const userName = user.name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User';

        const parentMePerson = await prisma.person.create({
          data: {
            roleId: parentRole.id,
            name: userName,
            avatar: JSON.stringify({
              color: '#9333ea', // Purple for parent
              emoji: '💫',      // Dizzy star for parent
            }),
            isAccountOwner: true,
            status: 'ACTIVE',
          },
        });

        // Create default "Daily Routine" for parent "Me"
        await prisma.routine.create({
          data: {
            roleId: parentRole.id,
            name: '☀️ Daily Routine',
            description: 'Default routine for daily tasks',
            resetPeriod: 'DAILY',
            color: '#3B82F6',
            status: 'ACTIVE',
            assignments: {
              create: {
                personId: parentMePerson.id,
              },
            },
          },
        });

        const teacherMePerson = await prisma.person.create({
          data: {
            roleId: teacherRole.id,
            name: userName,
            avatar: JSON.stringify({
              color: '#3b82f6', // Blue for teacher
              emoji: '🏫',      // School for teacher
            }),
            isAccountOwner: true,
            status: 'ACTIVE',
          },
        });

        // Create default "Daily Routine" for teacher "Me"
        await prisma.routine.create({
          data: {
            roleId: teacherRole.id,
            name: '☀️ Daily Routine',
            description: 'Default routine for daily tasks',
            resetPeriod: 'DAILY',
            color: '#3B82F6',
            status: 'ACTIVE',
            assignments: {
              create: {
                personId: teacherMePerson.id,
              },
            },
          },
        });

        // Create default classroom group for teacher
        const defaultClassroom = await prisma.group.create({
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
          // Ensure existing users have both roles
          const hasParentRole = user.roles.some((role: any) => role.type === 'PARENT');
          const hasTeacherRole = user.roles.some((role: any) => role.type === 'TEACHER');

        let parentRole = user.roles.find((role: any) => role.type === 'PARENT');
          let teacherRole = user.roles.find((role: any) => role.type === 'TEACHER');

          // Create missing PARENT role
          if (!hasParentRole) {
            parentRole = await prisma.role.create({
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
            teacherRole = await prisma.role.create({
              data: {
                userId: user.id,
                type: 'TEACHER',
                tier: 'FREE',
                color: '#3b82f6',
              },
            });
          }

        // Get user name for account owner creation
        const existingUserName = user.name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User';

        // Ensure account owner person exists for parent role
        if (parentRole) {
          const accountOwnerExists = await prisma.person.findFirst({
            where: {
              roleId: parentRole.id,
              isAccountOwner: true,
            },
          });

          if (!accountOwnerExists) {
            const parentMePerson = await prisma.person.create({
              data: {
                roleId: parentRole.id,
                name: existingUserName,
                avatar: JSON.stringify({
                  color: '#9333ea', // Purple for parent
                  emoji: '💫',      // Dizzy star for parent
                }),
                isAccountOwner: true,
                status: 'ACTIVE',
              },
            });

            // Create default "Daily Routine" for parent
            await prisma.routine.create({
              data: {
                roleId: parentRole.id,
                name: '☀️ Daily Routine',
                description: 'Default routine for daily tasks',
                resetPeriod: 'DAILY',
                color: '#3B82F6',
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

        // Ensure account owner person exists for teacher role
        if (teacherRole) {
          const accountOwnerExists = await prisma.person.findFirst({
            where: {
              roleId: teacherRole.id,
              isAccountOwner: true,
            },
          });

          if (!accountOwnerExists) {
            const teacherMePerson = await prisma.person.create({
              data: {
                roleId: teacherRole.id,
                name: existingUserName,
                avatar: JSON.stringify({
                  color: '#3b82f6', // Blue for teacher
                  emoji: '🏫',      // School for teacher
                }),
                isAccountOwner: true,
                status: 'ACTIVE',
              },
            });

            // Create default "Daily Routine" for teacher
            await prisma.routine.create({
              data: {
                roleId: teacherRole.id,
                name: '☀️ Daily Routine',
                description: 'Default routine for daily tasks',
                resetPeriod: 'DAILY',
                color: '#3B82F6',
                status: 'ACTIVE',
                assignments: {
                  create: {
                    personId: teacherMePerson.id,
                  },
                },
              },
            });

            // Create default classroom group for teacher if it doesn't exist
            const classroomExists = await prisma.group.findFirst({
              where: {
                roleId: teacherRole.id,
                type: 'CLASSROOM',
              },
            });

            if (!classroomExists) {
              await prisma.group.create({
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
      }
    } catch (err) {
      console.error('Error in OAuth callback:', err);
      return NextResponse.redirect(`${redirectBase}/login?error=callback_error`);
    }
  }

  // Redirect to last visited mode (parent or teacher)
  return NextResponse.redirect(`${redirectBase}${redirectPath}`);
}
