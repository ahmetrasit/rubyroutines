'use client';

import { AdminGuard } from '@/components/admin/AdminGuard';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings as SettingsIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminSettingsPage() {
  return (
    <AdminGuard>
      <SettingsContent />
    </AdminGuard>
  );
}

function SettingsContent() {
  const { data: settings, isLoading } = trpc.adminSettings.getAll.useQuery();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">System Settings</h1>
            <p className="text-muted-foreground">Configure system-wide settings</p>
          </div>
          <Link href="/admin">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : settings ? (
          <div className="space-y-6">
            {Object.entries(settings).map(([category, categorySettings]: [string, any]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SettingsIcon className="h-5 w-5" />
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </CardTitle>
                  <CardDescription>Settings for {category}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categorySettings.map((setting: any) => (
                      <div key={setting.key} className="border-b pb-4 last:border-0">
                        <div className="font-medium mb-1">{setting.key}</div>
                        {setting.description && (
                          <div className="text-sm text-muted-foreground mb-2">
                            {setting.description}
                          </div>
                        )}
                        <div className="text-sm font-mono bg-muted p-2 rounded">
                          {JSON.stringify(setting.value, null, 2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
