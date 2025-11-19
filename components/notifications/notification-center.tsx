'use client';

import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import {
  Bell,
  BellRing,
  Target,
  Trophy,
  Flame,
  AlertCircle,
  Calendar,
  Check,
  CheckCheck,
  Loader2,
  Settings
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { NotificationType } from '@/lib/types/prisma-enums';

interface NotificationCenterProps {
  roleId: string;
  userId: string;
}

export function NotificationCenter({ roleId, userId }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Fetch notifications
  const { data: notifications, isLoading } = trpc.notification.list.useQuery(
    { roleId, limit: 20 },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      enabled: !!roleId
    }
  );

  // Get unread count
  const { data: unreadCount = 0 } = trpc.notification.getUnreadCount.useQuery(
    { roleId },
    {
      refetchInterval: 30000,
      enabled: !!roleId
    }
  );

  // Mark as read mutation
  const markAsReadMutation = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate();
      utils.notification.getUnreadCount.invalidate();
    }
  });

  // Mark all as read mutation
  const markAllAsReadMutation = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate();
      utils.notification.getUnreadCount.invalidate();
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
        variant: 'success'
      });
    }
  });

  // Auto-mark notifications as read when dropdown opens
  useEffect(() => {
    if (isOpen && notifications?.some(n => !n.read)) {
      // Mark visible notifications as read after a short delay
      const timer = setTimeout(() => {
        notifications
          ?.filter(n => !n.read)
          .slice(0, 5) // Mark first 5 as read
          .forEach(n => {
            markAsReadMutation.mutate({ notificationId: n.id });
          });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, notifications]);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'GOAL_ACHIEVED':
        return <Trophy className="h-4 w-4 text-green-500" />;
      case 'STREAK_MILESTONE':
        return <Flame className="h-4 w-4 text-orange-500" />;
      case 'GOAL_REMINDER':
        return <Target className="h-4 w-4 text-blue-500" />;
      case 'STREAK_RISK':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'CONDITION_TRIGGERED':
        return <Settings className="h-4 w-4 text-purple-500" />;
      case 'DAILY_SUMMARY':
        return <Calendar className="h-4 w-4 text-gray-500" />;
      case 'ENCOURAGEMENT':
        return <BellRing className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationBadgeColor = (type: NotificationType) => {
    const colors: Record<NotificationType, string> = {
      GOAL_ACHIEVED: 'bg-green-100 text-green-800',
      STREAK_MILESTONE: 'bg-orange-100 text-orange-800',
      GOAL_REMINDER: 'bg-blue-100 text-blue-800',
      STREAK_RISK: 'bg-red-100 text-red-800',
      CONDITION_TRIGGERED: 'bg-purple-100 text-purple-800',
      DAILY_SUMMARY: 'bg-gray-100 text-gray-800',
      ENCOURAGEMENT: 'bg-yellow-100 text-yellow-800',
      MILESTONE_REACHED: 'bg-pink-100 text-pink-800',
      PROGRESS_UPDATE: 'bg-cyan-100 text-cyan-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatNotificationType = (type: NotificationType) => {
    return type.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center"
              variant="destructive"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96" align="end">
        <DropdownMenuHeader className="flex items-center justify-between">
          <div className="font-semibold">Notifications</div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate({ roleId })}
              disabled={markAllAsReadMutation.isPending}
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Mark all read
                </>
              )}
            </Button>
          )}
        </DropdownMenuHeader>
        <DropdownMenuSeparator />

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="space-y-1 p-1">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`border-0 shadow-none ${!notification.read ? 'bg-blue-50' : ''}`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm">{notification.title}</p>
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsReadMutation.mutate({ notificationId: notification.id });
                              }}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${getNotificationBadgeColor(notification.type)}`}
                          >
                            {formatNotificationType(notification.type)}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>
                        </div>

                        {/* Additional data display */}
                        {notification.data && (
                          <div className="mt-2 space-y-1">
                            {notification.data.streakCount && (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Flame className="h-3 w-3 text-orange-500" />
                                <span>{notification.data.streakCount} day streak</span>
                              </div>
                            )}
                            {notification.data.completionRate !== undefined && (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Target className="h-3 w-3 text-blue-500" />
                                <span>{notification.data.completionRate}% complete</span>
                              </div>
                            )}
                            {notification.data.achievementValue && (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Trophy className="h-3 w-3 text-green-500" />
                                <span>
                                  {notification.data.achievementValue} / {notification.data.targetValue}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Bell className="h-8 w-8 mb-2" />
              <p className="text-sm">No notifications yet</p>
            </div>
          )}
        </ScrollArea>

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Button variant="ghost" className="w-full justify-center" size="sm">
            View all notifications
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}