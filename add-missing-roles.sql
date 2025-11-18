-- Add missing roles for all users
-- This script ensures every user has both PARENT and TEACHER roles

DO $$
DECLARE
    user_record RECORD;
    parent_role_id TEXT;
    has_parent BOOLEAN;
    has_teacher BOOLEAN;
BEGIN
    -- Loop through all users
    FOR user_record IN SELECT id, email FROM users
    LOOP
        -- Check if user has PARENT role
        SELECT EXISTS(SELECT 1 FROM roles WHERE "userId" = user_record.id AND type = 'PARENT') INTO has_parent;

        -- Check if user has TEACHER role
        SELECT EXISTS(SELECT 1 FROM roles WHERE "userId" = user_record.id AND type = 'TEACHER') INTO has_teacher;

        -- Create PARENT role if missing
        IF NOT has_parent THEN
            INSERT INTO roles (id, "userId", type, tier, color, "subscriptionStatus", "createdAt", "updatedAt")
            VALUES (
                'role_parent_' || substring(md5(random()::text) from 1 for 20),
                user_record.id,
                'PARENT',
                'FREE',
                '#9333ea',
                'ACTIVE',
                NOW(),
                NOW()
            )
            RETURNING id INTO parent_role_id;

            RAISE NOTICE 'Created PARENT role for user: %', user_record.email;

            -- Create "Me" person for parent role if it doesn't exist
            IF NOT EXISTS(SELECT 1 FROM persons WHERE "roleId" = parent_role_id AND name = 'Me') THEN
                INSERT INTO persons (id, "roleId", name, avatar, "isAccountOwner", status, "createdAt", "updatedAt")
                VALUES (
                    'person_me_' || substring(md5(random()::text) from 1 for 20),
                    parent_role_id,
                    'Me',
                    '{"color":"#BAE1FF","emoji":"👤"}',
                    true,
                    'ACTIVE',
                    NOW(),
                    NOW()
                );
                RAISE NOTICE 'Created "Me" person for user: %', user_record.email;
            END IF;
        ELSE
            -- Get existing parent role id
            SELECT id INTO parent_role_id FROM roles WHERE "userId" = user_record.id AND type = 'PARENT' LIMIT 1;

            -- Ensure "Me" person exists
            IF NOT EXISTS(SELECT 1 FROM persons WHERE "roleId" = parent_role_id AND name = 'Me') THEN
                INSERT INTO persons (id, "roleId", name, avatar, "isAccountOwner", status, "createdAt", "updatedAt")
                VALUES (
                    'person_me_' || substring(md5(random()::text) from 1 for 20),
                    parent_role_id,
                    'Me',
                    '{"color":"#BAE1FF","emoji":"👤"}',
                    true,
                    'ACTIVE',
                    NOW(),
                    NOW()
                );
                RAISE NOTICE 'Created "Me" person for user: %', user_record.email;
            END IF;
        END IF;

        -- Create TEACHER role if missing
        IF NOT has_teacher THEN
            INSERT INTO roles (id, "userId", type, tier, color, "subscriptionStatus", "createdAt", "updatedAt")
            VALUES (
                'role_teacher_' || substring(md5(random()::text) from 1 for 20),
                user_record.id,
                'TEACHER',
                'FREE',
                '#3b82f6',
                'ACTIVE',
                NOW(),
                NOW()
            );
            RAISE NOTICE 'Created TEACHER role for user: %', user_record.email;
        END IF;

        RAISE NOTICE '✓ User % now has both roles', user_record.email;
    END LOOP;

    RAISE NOTICE '✅ All users updated successfully!';
END $$;
