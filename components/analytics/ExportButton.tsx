'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';

interface ExportButtonProps {
  roleId: string;
  personId: string | null;
  startDate: Date;
  endDate: Date;
  days: number;
}

export function ExportButton({ roleId, personId, startDate, endDate, days }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportQuery = trpc.analytics.exportCSV.useQuery(
    {
      roleId,
      personId,
      startDate,
      endDate,
      days,
    },
    {
      enabled: false,
    }
  );

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const result = await exportQuery.refetch();

      if (result.data?.csv) {
        // Create blob and download
        const blob = new Blob([result.data.csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute(
          'download',
          `analytics-export-${new Date().toISOString().split('T')[0]}.csv`
        );
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: 'Success',
          description: 'Analytics data exported successfully',
          variant: 'success',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export analytics data',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button onClick={handleExport} disabled={isExporting} variant="outline">
      <Download className="h-4 w-4 mr-2" />
      {isExporting ? 'Exporting...' : 'Export CSV'}
    </Button>
  );
}
