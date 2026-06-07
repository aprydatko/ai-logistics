'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { useForm } from 'react-hook-form';

import {
  driverFormSchema,
  type DriverFormValues,
} from '@/lib/drivers/driver-form-schema';
import { saveDriver } from '@/lib/drivers/driver-mutations';
import type { DriversApiItem } from '@/lib/drivers/drivers-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@repo/ui/components/dialog';
import { Form } from '@repo/ui/components/form';

import { DialogFooter } from './dialog-footer';
import { DocumentsTab } from './documents-tab';
import { emptyDriverFormValues, toDriverFormValues } from './form-values';
import { ProfileTab } from './profile-tab';

interface DriverFormDialogProps {
  driver: DriversApiItem | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type DriverTab = 'profile' | 'documents';

export const DriverFormDialog = ({
  driver,
  isOpen,
  onOpenChange,
}: DriverFormDialogProps): React.JSX.Element => {
  const [tab, setTab] = React.useState<DriverTab>('profile');
  const queryClient = useQueryClient();
  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverFormSchema),
    defaultValues: emptyDriverFormValues,
  });
  const mutation = useMutation({
    mutationFn: saveDriver,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['drivers'] }),
      ]);
      onOpenChange(false);
    },
  });
  const resetMutation = mutation.reset;

  React.useEffect(() => {
    if (!isOpen) return;

    form.reset(toDriverFormValues(driver));
    resetMutation();
    setTab('profile');
  }, [driver, form, isOpen, resetMutation]);

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="flex h-[min(52rem,calc(100svh-2rem))] max-w-[36rem] flex-col">
        <div className="shrink-0 px-7 pt-6 pr-14">
          <DialogTitle>{driver ? 'Edit driver' : 'Add new driver'}</DialogTitle>
          <DialogDescription className="sr-only">
            Driver profile and document information.
          </DialogDescription>
          <div className="mt-5 flex gap-8 border-b border-border">
            {(['profile', 'documents'] as const).map((item) => (
              <button
                className={`border-b-2 px-1 pb-3 text-sm font-semibold capitalize transition ${
                  tab === item
                    ? 'border-primary-700 text-primary-700'
                    : 'border-transparent text-primary-700/70 hover:text-primary-700'
                }`}
                key={item}
                onClick={() => setTab(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <Form {...form}>
          <form
            className="flex min-h-0 flex-1 flex-col"
            noValidate
            onSubmit={form.handleSubmit((values) =>
              mutation.mutate({ driverId: driver?.id, values })
            )}
          >
            <div className="min-h-0 flex-1 overflow-y-auto px-7 py-5 pr-5 [scrollbar-color:var(--primary-700)_transparent] [scrollbar-gutter:stable] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:my-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-primary-700/35 [&::-webkit-scrollbar-thumb]:bg-clip-padding [&::-webkit-scrollbar-thumb:hover]:bg-primary-700/60">
              {tab === 'documents' ? (
                <DocumentsTab />
              ) : (
                <ProfileTab
                  form={form}
                  mutationError={
                    mutation.isError ? mutation.error.message : null
                  }
                />
              )}
            </div>
            <DialogFooter
              form={form}
              isEditing={Boolean(driver)}
              isPending={mutation.isPending}
              isSubmitDisabled={tab === 'documents'}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
