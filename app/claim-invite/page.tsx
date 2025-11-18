'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Mail, ArrowRight } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import Link from 'next/link';

export default function ClaimInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [inviteCode, setInviteCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [inviteDetails, setInviteDetails] = useState<any>(null);

  // Get code from URL params
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setInviteCode(code);
      validateCode(code);
    }
  }, [searchParams]);

  const validateMutation = trpc.personSharing.validateInvite.useMutation();

  const validateCode = async (code: string) => {
    setIsValidating(true);
    try {
      const details = await validateMutation.mutateAsync(code);
      setInviteDetails(details);
    } catch (error: any) {
      toast({
        title: 'Invalid Code',
        description: error.message || 'This invitation code is invalid or expired',
        variant: 'destructive',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleValidate = () => {
    if (!inviteCode) {
      toast({
        title: 'Error',
        description: 'Please enter an invitation code',
        variant: 'destructive',
      });
      return;
    }
    validateCode(inviteCode);
  };

  const handleContinue = () => {
    // Redirect to parent or teacher dashboard where they can complete the claim
    router.push(`/parent?inviteCode=${inviteCode}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-900 mb-2">Ruby Routines</h1>
          <p className="text-purple-700">Person Sharing Invitation</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-purple-600" />
              Claim Your Invitation
            </CardTitle>
            <CardDescription>
              Enter your invitation code to start collaborating
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!inviteDetails ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Invitation Code</label>
                  <Input
                    placeholder="word1-word2-word3"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="text-center font-mono"
                    disabled={isValidating}
                  />
                </div>

                {isValidating ? (
                  <Button disabled className="w-full">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </Button>
                ) : (
                  <Button onClick={handleValidate} className="w-full">
                    Validate Code
                  </Button>
                )}

                <div className="text-center text-sm text-muted-foreground">
                  <p>Don't have an account?</p>
                  <Link href="/signup" className="text-purple-600 hover:underline">
                    Sign up to continue
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium text-purple-900">
                    <strong>{inviteDetails.ownerRole.user.name || inviteDetails.ownerRole.user.email}</strong>
                    {' '}has invited you to collaborate
                  </p>

                  {inviteDetails.person && (
                    <p className="text-sm text-purple-700">
                      Person: <strong>{inviteDetails.person.name}</strong>
                    </p>
                  )}

                  <p className="text-sm text-purple-700">
                    Share Type: <strong>{inviteDetails.shareType.replace(/_/g, ' ')}</strong>
                  </p>

                  <p className="text-sm text-purple-700">
                    Permissions: <strong>{inviteDetails.permissions}</strong>
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                  Expires: {new Date(inviteDetails.expiresAt).toLocaleDateString()}
                </div>

                <Button onClick={handleContinue} className="w-full">
                  Continue to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <div className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setInviteDetails(null);
                      setInviteCode('');
                    }}
                    className="text-sm"
                  >
                    Try a different code
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Already have an account?{' '}
            <Link href="/login" className="text-purple-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
