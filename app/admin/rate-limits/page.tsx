'use client';

import { useState } from 'react';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { ModeSwitcher } from '@/components/mode-switcher';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { HomeButton } from '@/components/home-button';

export default function AdminRateLimitsPage() {
  return (
    <AdminGuard>
      <ModeSwitcher currentMode="admin" />
      <RateLimitsContent />
    </AdminGuard>
  );
}

function RateLimitsContent() {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data: rateLimits, isLoading } = trpc.adminSettings.getKioskRateLimits.useQuery();

  const [editedLimits, setEditedLimits] = useState<any>(null);

  const updateLimitsMutation = trpc.adminSettings.updateKioskRateLimits.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Rate limits updated successfully',
      });
      utils.adminSettings.getKioskRateLimits.invalidate();
      setEditedLimits(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    if (editedLimits) {
      updateLimitsMutation.mutate(editedLimits);
    }
  };

  const handleReset = () => {
    setEditedLimits(null);
  };

  const currentLimits = editedLimits || rateLimits;

  // Helper to convert milliseconds to hours for display
  const msToHours = (ms: number) => ms / (1000 * 60 * 60);
  const hoursToMs = (hours: number) => hours * 1000 * 60 * 60;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HomeButton />
            <div>
              <h1 className="text-3xl font-bold mb-1">Rate Limit Configuration</h1>
              <p className="text-muted-foreground">
                Configure rate limits for kiosk endpoints to prevent abuse
              </p>
            </div>
          </div>
          <Link href="/admin">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        {/* Warning Card */}
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertTriangle className="h-5 w-5" />
              Important Information
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-orange-800 space-y-2">
            <p>
              Rate limits protect your kiosk endpoints from abuse. Each identifier type has different limits:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>
                <strong>SESSION</strong>: Applied when a session ID is available (most permissive, session already validated)
              </li>
              <li>
                <strong>CODE</strong>: Applied when a kiosk code ID is available (moderate protection)
              </li>
              <li>
                <strong>IP</strong>: Applied when neither session nor code available (most restrictive, fallback)
              </li>
            </ul>
            <p className="mt-2">
              Changes take effect immediately. Set limits too low and legitimate users may be blocked. Set too high and you risk abuse.
            </p>
          </CardContent>
        </Card>

        {/* Rate Limits Card */}
        {isLoading ? (
          <Skeleton className="h-96" />
        ) : currentLimits ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Kiosk Rate Limits
              </CardTitle>
              <CardDescription>
                Configure the maximum number of requests allowed per time window
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* SESSION Limits */}
                <div className="space-y-4">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-lg font-semibold">SESSION</h3>
                    <span className="text-sm text-muted-foreground">
                      {currentLimits.SESSION.description}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="session-limit">Request Limit</Label>
                      <Input
                        id="session-limit"
                        type="number"
                        min="1"
                        max="1000"
                        value={currentLimits.SESSION.limit}
                        onChange={(e) =>
                          setEditedLimits({
                            ...currentLimits,
                            SESSION: {
                              ...currentLimits.SESSION,
                              limit: parseInt(e.target.value) || 1,
                            },
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum requests allowed
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="session-window">Time Window (hours)</Label>
                      <Input
                        id="session-window"
                        type="number"
                        min="0.1"
                        max="24"
                        step="0.5"
                        value={msToHours(currentLimits.SESSION.windowMs)}
                        onChange={(e) =>
                          setEditedLimits({
                            ...currentLimits,
                            SESSION: {
                              ...currentLimits.SESSION,
                              windowMs: hoursToMs(parseFloat(e.target.value) || 1),
                            },
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Time window in hours
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t" />

                {/* CODE Limits */}
                <div className="space-y-4">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-lg font-semibold">CODE</h3>
                    <span className="text-sm text-muted-foreground">
                      {currentLimits.CODE.description}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="code-limit">Request Limit</Label>
                      <Input
                        id="code-limit"
                        type="number"
                        min="1"
                        max="1000"
                        value={currentLimits.CODE.limit}
                        onChange={(e) =>
                          setEditedLimits({
                            ...currentLimits,
                            CODE: {
                              ...currentLimits.CODE,
                              limit: parseInt(e.target.value) || 1,
                            },
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum requests allowed
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="code-window">Time Window (hours)</Label>
                      <Input
                        id="code-window"
                        type="number"
                        min="0.1"
                        max="24"
                        step="0.5"
                        value={msToHours(currentLimits.CODE.windowMs)}
                        onChange={(e) =>
                          setEditedLimits({
                            ...currentLimits,
                            CODE: {
                              ...currentLimits.CODE,
                              windowMs: hoursToMs(parseFloat(e.target.value) || 1),
                            },
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Time window in hours
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t" />

                {/* IP Limits */}
                <div className="space-y-4">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-lg font-semibold">IP</h3>
                    <span className="text-sm text-muted-foreground">
                      {currentLimits.IP.description}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ip-limit">Request Limit</Label>
                      <Input
                        id="ip-limit"
                        type="number"
                        min="1"
                        max="1000"
                        value={currentLimits.IP.limit}
                        onChange={(e) =>
                          setEditedLimits({
                            ...currentLimits,
                            IP: {
                              ...currentLimits.IP,
                              limit: parseInt(e.target.value) || 1,
                            },
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum requests allowed
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="ip-window">Time Window (hours)</Label>
                      <Input
                        id="ip-window"
                        type="number"
                        min="0.1"
                        max="24"
                        step="0.5"
                        value={msToHours(currentLimits.IP.windowMs)}
                        onChange={(e) =>
                          setEditedLimits({
                            ...currentLimits,
                            IP: {
                              ...currentLimits.IP,
                              windowMs: hoursToMs(parseFloat(e.target.value) || 1),
                            },
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Time window in hours
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {editedLimits && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={handleSave}
                      disabled={updateLimitsMutation.isPending}
                    >
                      {updateLimitsMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      disabled={updateLimitsMutation.isPending}
                    >
                      Reset
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Current Values Summary */}
        {currentLimits && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Current Configuration Summary</CardTitle>
              <CardDescription>
                These are the currently active rate limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 font-mono text-sm">
                <div>
                  <strong>SESSION:</strong> {currentLimits.SESSION.limit} requests per {msToHours(currentLimits.SESSION.windowMs)} hour(s)
                </div>
                <div>
                  <strong>CODE:</strong> {currentLimits.CODE.limit} requests per {msToHours(currentLimits.CODE.windowMs)} hour(s)
                </div>
                <div>
                  <strong>IP:</strong> {currentLimits.IP.limit} requests per {msToHours(currentLimits.IP.windowMs)} hour(s)
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
