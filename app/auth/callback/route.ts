import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  // Get the host from the request headers (this will be the actual IP or localhost)
  const host = request.headers.get('host');
  const protocol = process.env.NODE_ENV === 'production' ? 'https:' : 'http:';
  const redirectBase = `${protocol}//${host || 'localhost:3000'}`;

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
        console.log('OAuth user authenticated:', data.user.email);

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
        console.log('User roles count:', user.roles.length);

        if (user.roles.length === 0) {
          console.log('Creating both roles for new user');
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

        // Auto-create "Me" person for both parent and teacher roles
        const parentMePerson = await prisma.person.create({
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
        await prisma.routine.create({
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

        const teacherMePerson = await prisma.person.create({
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
        await prisma.routine.create({
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
        } else {
          console.log('User has existing roles, checking for missing roles');
          // Ensure existing users have both roles
          const hasParentRole = user.roles.some((role: any) => role.type === 'PARENT');
          const hasTeacherRole = user.roles.some((role: any) => role.type === 'TEACHER');
          console.log('Has PARENT role:', hasParentRole, '| Has TEACHER role:', hasTeacherRole);

        let parentRole = user.roles.find((role: any) => role.type === 'PARENT');
          let teacherRole = user.roles.find((role: any) => role.type === 'TEACHER');

          // Create missing PARENT role
          if (!hasParentRole) {
            console.log('Creating missing PARENT role');
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
            console.log('Creating missing TEACHER role');
            teacherRole = await prisma.role.create({
              data: {
                userId: user.id,
                type: 'TEACHER',
                tier: 'FREE',
                color: '#3b82f6',
              },
            });
          }

        // Ensure "Me" person exists for parent role
        if (parentRole) {
          const mePersonExists = await prisma.person.findFirst({
            where: {
              roleId: parentRole.id,
              name: 'Me',
            },
          });

          if (!mePersonExists) {
            const parentMePerson = await prisma.person.create({
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
            await prisma.routine.create({
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

        // Ensure "Me" person exists for teacher role
        if (teacherRole) {
          const mePersonExists = await prisma.person.findFirst({
            where: {
              roleId: teacherRole.id,
              name: 'Me',
            },
          });

          if (!mePersonExists) {
            const teacherMePerson = await prisma.person.create({
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
            await prisma.routine.create({
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
          }
        }
        }

        console.log('✓ OAuth callback completed successfully for user:', data.user.email);
      }
    } catch (err) {
      console.error('Error in OAuth callback:', err);
      return NextResponse.redirect(`${redirectBase}/login?error=callback_error`);
    }
  }

  // Redirect to parent mode by default
  return NextResponse.redirect(`${redirectBase}/parent`);
}
