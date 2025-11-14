import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  // Get the host from the request headers (this will be the actual IP or localhost)
  const host = request.headers.get('host');
  const protocol = requestUrl.protocol;
  const redirectBase = host ? `${protocol}//${host}` : requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Create or update user in database
      const user = await prisma.user.upsert({
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

      // Auto-create both PARENT and TEACHER roles for first-time OAuth users
      if (user.roles.length === 0) {
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
      }
    }
  }

  // Redirect to dashboard using the actual host from request
  return NextResponse.redirect(`${redirectBase}/dashboard`);
}
