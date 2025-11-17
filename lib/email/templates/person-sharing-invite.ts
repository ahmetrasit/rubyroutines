interface PersonSharingInviteEmailParams {
  inviterName: string;
  personName?: string;
  shareType: 'PERSON' | 'ROUTINE_ACCESS' | 'FULL_ROLE';
  permissions: 'VIEW' | 'EDIT' | 'MANAGE';
  inviteCode: string;
  appUrl: string;
  expiresAt: Date;
}

function getShareTypeText(shareType: string, personName?: string): string {
  switch (shareType) {
    case 'PERSON':
      return personName ? `share ${personName} with you` : 'share a person with you';
    case 'ROUTINE_ACCESS':
      return 'share routine access with you';
    case 'FULL_ROLE':
      return 'collaborate as a co-parent/co-teacher';
    default:
      return 'share access with you';
  }
}

function getPermissionText(permissions: string): string {
  switch (permissions) {
    case 'VIEW':
      return 'View Only - You can see task completions';
    case 'EDIT':
      return 'Edit Access - You can view and complete tasks';
    case 'MANAGE':
      return 'Full Management - You can view, edit, and manage routines';
    default:
      return 'Access granted';
  }
}

export function renderPersonSharingInviteEmail(params: PersonSharingInviteEmailParams): string {
  const {
    inviterName,
    personName,
    shareType,
    permissions,
    inviteCode,
    appUrl,
    expiresAt,
  } = params;

  const shareTypeText = getShareTypeText(shareType, personName);
  const permissionText = getPermissionText(permissions);
  const expiryDate = new Date(expiresAt).toLocaleDateString();

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <!-- Header -->
      <div style="background-color: #7c3aed; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Ruby Routines</h1>
        <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Person Sharing Invitation</p>
      </div>

      <!-- Content -->
      <div style="background-color: #f9fafb; padding: 30px 20px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
        <p style="font-size: 16px; margin-bottom: 20px;">
          <strong>${inviterName}</strong> has invited you to ${shareTypeText} on Ruby Routines.
        </p>

        <div style="background-color: #ede9fe; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #7c3aed;">
          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #6b21a8;">Permission Level:</p>
          <p style="margin: 0; font-size: 14px; color: #6b21a8;">${permissionText}</p>
        </div>

        <div style="background-color: white; padding: 20px; border-radius: 8px; border: 2px dashed #7c3aed; text-align: center; margin-bottom: 20px;">
          <p style="margin: 0 0 10px 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Your Invite Code</p>
          <p style="margin: 0; font-size: 28px; font-weight: bold; color: #7c3aed; letter-spacing: 2px; font-family: monospace;">
            ${inviteCode}
          </p>
        </div>

        <div style="text-align: center; margin-bottom: 20px;">
          <a
            href="${appUrl}/claim-invite?code=${inviteCode}"
            style="display: inline-block; background-color: #7c3aed; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;"
          >
            Accept Invitation
          </a>
        </div>

        <div style="background-color: #fef3c7; padding: 12px; border-radius: 6px; font-size: 13px; color: #92400e; margin-bottom: 20px;">
          ⏰ This invitation expires on <strong>${expiryDate}</strong>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
          <h3 style="font-size: 16px; margin-bottom: 12px; color: #7c3aed;">How to claim your invitation:</h3>
          <ol style="font-size: 14px; color: #666; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Click the "Accept Invitation" button above</li>
            <li style="margin-bottom: 8px;">Sign in to your Ruby Routines account (or create one)</li>
            <li style="margin-bottom: 8px;">Enter the invite code: <code style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${inviteCode}</code></li>
            <li>Start collaborating!</li>
          </ol>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #666;">
        <p style="margin: 0 0 8px 0;">
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
        <p style="margin: 0;">
          <a href="${appUrl}" style="color: #7c3aed; text-decoration: none;">Ruby Routines</a>
          • Building better routines, together
        </p>
      </div>
    </div>
  </body>
</html>
`;
}
