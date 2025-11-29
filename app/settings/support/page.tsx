'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, MessageSquare, FileText, ExternalLink, ChevronLeft, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';

export default function SupportPage() {
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: Implement actual support ticket submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: 'Message sent',
      description: "We'll get back to you as soon as possible.",
      variant: 'success',
    });

    setSubject('');
    setMessage('');
    setIsSubmitting(false);
  };

  const supportResources = [
    {
      title: 'Blog',
      description: 'Tips, updates, and parenting insights',
      icon: BookOpen,
      href: '/blog',
      external: false,
    },
    {
      title: 'Documentation',
      description: 'Learn how to use Ruby Routines',
      icon: FileText,
      href: 'https://docs.rubyroutines.com',
      external: true,
    },
    {
      title: 'Email Support',
      description: 'support@rubyroutines.com',
      icon: Mail,
      href: 'mailto:support@rubyroutines.com',
      external: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Settings
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Support</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Get help with Ruby Routines
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Contact Us
              </CardTitle>
              <CardDescription>Send us a message and we'll respond within 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="How can we help?"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue or question..."
                    rows={5}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="space-y-4">
            {supportResources.map((resource) => {
              const Icon = resource.icon;
              return (
                <a
                  key={resource.title}
                  href={resource.href}
                  target={resource.external ? '_blank' : undefined}
                  rel={resource.external ? 'noopener noreferrer' : undefined}
                  className="block"
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="flex flex-row items-center gap-4">
                      <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                        <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          {resource.title}
                          {resource.external && (
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          )}
                        </CardTitle>
                        <CardDescription className="text-sm">{resource.description}</CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                </a>
              );
            })}

            {/* FAQ Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-1">How do I reset my password?</h4>
                  <p className="text-sm text-muted-foreground">
                    Go to the login page and click "Forgot password" to receive a reset link.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">Can I share routines with other parents?</h4>
                  <p className="text-sm text-muted-foreground">
                    Yes! You can share routines privately using a code or publish them to the community.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">How do I cancel my subscription?</h4>
                  <p className="text-sm text-muted-foreground">
                    Go to Settings → Billing and click "Manage Subscription" to cancel or change plans.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
