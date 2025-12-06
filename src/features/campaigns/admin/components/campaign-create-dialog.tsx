"use client";

import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  AdvertiserCampaignCreateInputSchema,
  type AdvertiserCampaignCreateInput,
} from '@/features/campaigns/lib/dto';
import { useCreateCampaignMutation } from '@/features/campaigns/admin/hooks/useCreateCampaignMutation';

const formSchema = z.object({
  title: z.string().min(1, 'Please enter a campaign name.'),
  benefitSummary: z.string().min(1, 'Please enter a benefit summary.'),
  missionDetails: z.string().min(1, 'Please enter mission details.'),
  storeLocation: z.string().optional(),
  applicationStartAt: z.string().min(1, 'Please select a start date.'),
  applicationEndAt: z.string().min(1, 'Please select an end date.'),
  maxParticipants: z
    .string()
    .min(1, 'Please enter the number of participants.')
    .regex(/^[0-9]+$/, 'Only numbers are allowed.'),
});

type CampaignCreateFormValues = z.infer<typeof formSchema>;

type CampaignCreateDialogProps = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onCreated?: (campaign: AdvertiserCampaignCreateInput) => void;
};

const toIsoDateString = (value: string) => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toISOString();
};

export const CampaignCreateDialog = ({
  open,
  onOpenChange,
  onCreated,
}: CampaignCreateDialogProps) => {
  const form = useForm<CampaignCreateFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      benefitSummary: '',
      missionDetails: '',
      storeLocation: '',
      applicationStartAt: '',
      applicationEndAt: '',
      maxParticipants: '',
    },
  });

  const { toast } = useToast();
  const createMutation = useCreateCampaignMutation();

  const isSubmitting = createMutation.isPending;

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload: AdvertiserCampaignCreateInput = {
      title: values.title.trim(),
      benefitSummary: values.benefitSummary.trim(),
      missionDetails: values.missionDetails.trim(),
      storeLocation: values.storeLocation?.trim() || null,
      applicationStartAt: toIsoDateString(values.applicationStartAt),
      applicationEndAt: toIsoDateString(values.applicationEndAt),
      maxParticipants: Number.parseInt(values.maxParticipants, 10),
    };

    const parsed = AdvertiserCampaignCreateInputSchema.safeParse(payload);

    if (!parsed.success) {
      toast({
        title: 'Please check your inputs.',
        description: 'Review the campaign details and try again.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createMutation.mutateAsync(parsed.data);
      toast({
        title: 'Campaign created.',
        description: 'You can now see the campaign in your list.',
      });
      form.reset();
      onOpenChange(false);
      onCreated?.(parsed.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not create the campaign.';
      toast({
        title: 'Failed to create campaign.',
        description: message,
        variant: 'destructive',
      });
    }
  });

  const submitButtonLabel = useMemo(
    () => (isSubmitting ? 'Creating...' : 'Create campaign'),
    [isSubmitting],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-xl overflow-y-auto border-slate-200 bg-slate-50 p-6">
        <SheetHeader className="space-y-2 text-left">
          <SheetTitle className="text-xl font-semibold text-slate-900">Create a new campaign</SheetTitle>
          <SheetDescription className="text-sm text-slate-600">
            Enter recruiting details to publish to the list immediately.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Fall menu offline trial"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="benefitSummary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Benefit summary</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 30,000 KRW menu provided"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="missionDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mission details</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      placeholder="Visit proof + one Instagram post"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="storeLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store location (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 123 Teheran-ro, Gangnam-gu, Seoul"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
              name="applicationStartAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start date</FormLabel>
                  <FormControl>
                    <Input type="date" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
              name="applicationEndAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End date</FormLabel>
                  <FormControl>
                    <Input type="date" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="maxParticipants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Participant slots</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-slate-900 text-white hover:bg-slate-700">
                {submitButtonLabel}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};
