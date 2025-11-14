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

      if (!error && data.user) {
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

        await prisma.role.create({
          data: {
            userId: user.id,
            type: 'TEACHER',
            tier: 'FREE',
            color: '#3b82f6', // Blue for teacher mode
          },
        });

        // Auto-create "Me" person for parent role
        await prisma.person.create({
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
      } else {
        // Ensure existing users have both roles
        const hasParentRole = user.roles.some((role: any) => role.type === 'PARENT');
        const hasTeacherRole = user.roles.some((role: any) => role.type === 'TEACHER');

        let parentRole = user.roles.find((role: any) => role.type === 'PARENT');

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
          await prisma.role.create({
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
            await prisma.person.create({
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
          }
        }
      }
      }
    } catch (err) {
      console.error('Error in OAuth callback:', err);
      return NextResponse.redirect(`${redirectBase}/login?error=callback_error`);
    }
  }

  // Redirect to dashboard using the actual host from request
  return NextResponse.redirect(`${redirectBase}/dashboard`);
}
