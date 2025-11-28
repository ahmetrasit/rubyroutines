'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { trpc } from '@/lib/trpc/client';
import {
  Link2,
  UserPlus,
  Settings,
  Unlink,
  Loader2,
  Users,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { GenerateConnectionCodeModal } from './GenerateConnectionCodeModal';
import { ClaimConnectionCodeModal } from './ClaimConnectionCodeModal';
import { ConnectionScopeEditor } from './ConnectionScopeEditor';
import type { Person } from '@/lib/types/database';

interface PersonConnectionsManagerProps {
  person: Person;
  roleId: string;
  roleType: 'PARENT' | 'TEACHER';
  allPersons: Person[]; // All persons in this role (for claiming codes)
}

/**
 * Comprehensive connection manager for a person.
 * Shows:
 * - Outbound connections (who can see this person's tasks)
 * - Button to generate connection codes
 * - Button to claim connection codes (connect to others)
 */
export function PersonConnectionsManager({
  person,
  roleId,
  roleType,
  allPersons,
}: PersonConnectionsManagerProps) {
  const [expanded, setExpanded] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [editingConnection, setEditingConnection] = useState<{
    connectionId: string;
    targetPersonName: string;
    scopeMode: 'ALL' | 'SELECTED';
    visibleRoutineIds: string[];
    visibleGoalIds: string[];
  } | null>(null);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Fetch connections where this person is the origin (others can see their tasks)
  const { data: outboundConnections, isLoading } = trpc.personConnection.listAsOrigin.useQuery(
    { roleId, originPersonId: person.id },
    { enabled: !!roleId && !!person.id }
  );

  // Remove connection mutation
  const removeMutation = trpc.personConnection.remove.useMutation({
    onSuccess: () => {
      toast({
        title: 'Connection removed',
        description: 'The connection has been removed successfully.',
        variant: 'default',
      });
      utils.personConnection.listAsOrigin.invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Error removing connection',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleRemoveConnection = (connectionId: string, targetName: string) => {
    if (
      confirm(
        `Are you sure you want to remove the connection with ${targetName}? They will no longer be able to see ${person.name}'s task completion status.`
      )
    ) {
      removeMutation.mutate({ connectionId });
    }
  };

  const connectionCount = outboundConnections?.length || 0;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          )}
          <Link2 className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">Connections</h2>
          {connectionCount > 0 && (
            <Badge variant="secondary">{connectionCount}</Badge>
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-6 pb-6">
          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Button
              onClick={() => setShowGenerateModal(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Link2 className="h-4 w-4" />
              Generate Code
            </Button>
            <Button
              onClick={() => setShowClaimModal(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Use Code
            </Button>
          </div>

          {/* Outbound connections (who can see this person) */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Who can see {person.name}&apos;s tasks
            </h3>

            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : outboundConnections && outboundConnections.length > 0 ? (
              <div className="space-y-2">
                {outboundConnections.map((conn) => (
                  <div
                    key={conn.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-purple-600 font-semibold">
                          {conn.targetPerson.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {conn.targetPerson.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>from {conn.targetOwner.name || conn.targetOwner.email}&apos;s account</span>
                          <Badge
                            variant={conn.scopeMode === 'ALL' ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {conn.scopeMode === 'ALL' ? (
                              <>
                                <Eye className="h-3 w-3 mr-1" /> All visible
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-3 w-3 mr-1" /> Limited
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setEditingConnection({
                            connectionId: conn.id,
                            targetPersonName: conn.targetPerson.name,
                            scopeMode: conn.scopeMode as 'ALL' | 'SELECTED',
                            visibleRoutineIds: conn.visibleRoutineIds,
                            visibleGoalIds: conn.visibleGoalIds,
                          })
                        }
                        title="Edit visibility"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleRemoveConnection(conn.id, conn.targetPerson.name)
                        }
                        disabled={removeMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Remove connection"
                      >
                        <Unlink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 border rounded-lg border-dashed">
                <Link2 className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No one is connected to {person.name} yet</p>
                <p className="text-xs mt-1">
                  Generate a code to share with others
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <GenerateConnectionCodeModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        person={person}
        roleId={roleId}
        roleType={roleType}
      />

      <ClaimConnectionCodeModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        roleId={roleId}
        roleType={roleType}
        persons={allPersons}
        onSuccess={() => {
          utils.personConnection.getConnectedPersonsForDashboard.invalidate();
        }}
      />

      {editingConnection && (
        <ConnectionScopeEditor
          isOpen={!!editingConnection}
          onClose={() => setEditingConnection(null)}
          connectionId={editingConnection.connectionId}
          originPersonName={person.name}
          targetPersonName={editingConnection.targetPersonName}
          currentScopeMode={editingConnection.scopeMode}
          currentVisibleRoutineIds={editingConnection.visibleRoutineIds}
          currentVisibleGoalIds={editingConnection.visibleGoalIds}
          roleId={roleId}
          originPersonId={person.id}
        />
      )}
    </div>
  );
}
