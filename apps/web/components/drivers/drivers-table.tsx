'use client';

import { Ellipsis, Eye, Pencil, Trash2 } from 'lucide-react';
import * as React from 'react';

import { ActionMenu } from '@repo/ui/components/action-menu';
import { DriverAvatar } from '@repo/ui/components/avatar';
import { Button } from '@repo/ui/components/button';
import { Checkbox } from '@repo/ui/components/checkbox';
import { DataPagination } from '@repo/ui/components/pagination';
import { StatusBadge } from '@repo/ui/components/status-badge';
import {
  DataTable,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableScrollArea,
} from '@repo/ui/components/table';
import { cn } from '@repo/ui/lib/utils';

import { DriverProfilePanel } from './driver-profile-panel';
import { DriversToolbar } from './drivers-toolbar';
import { drivers, driverStatusTone, truckStateStyles } from './mock';
import { DriverRow } from './types';

function DriversPagination(): React.JSX.Element {
  const [pageSize, setPageSize] = React.useState(10);

  return (
    <DataPagination
      ariaLabel="Drivers pagination"
      currentPage={1}
      endItem={8}
      itemName="drivers"
      onPageSizeChange={setPageSize}
      pageSize={pageSize}
      pageSizeOptions={[10, 15, 20]}
      startItem={1}
      totalItems={128}
      totalPages={16}
    />
  );
}

export function DriversTable(): React.JSX.Element {
  const [selectedDriverIds, setSelectedDriverIds] = React.useState<Set<string>>(
    () => new Set([drivers[0]?.id].filter((id): id is string => Boolean(id)))
  );
  const [profileDriver, setProfileDriver] = React.useState<DriverRow | null>(
    null
  );
  const isAllSelected = selectedDriverIds.size === drivers.length;
  const isPartiallySelected = selectedDriverIds.size > 0 && !isAllSelected;

  const handleSelectAllChange = (checked: boolean | 'indeterminate'): void => {
    setSelectedDriverIds(
      checked === true ? new Set(drivers.map((driver) => driver.id)) : new Set()
    );
  };

  const handleDriverSelectChange = (
    driverId: string,
    checked: boolean | 'indeterminate'
  ): void => {
    setSelectedDriverIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (checked === true) {
        nextIds.add(driverId);
        return nextIds;
      }

      nextIds.delete(driverId);
      return nextIds;
    });
  };

  return (
    <section className="flex h-[calc(100svh-7rem)] gap-5 overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-hidden">
        <DriversToolbar />

        <DataTable className="flex min-h-0 flex-1 flex-col">
          <TableScrollArea className="min-h-0 flex-1 overflow-auto">
            <Table className="table-fixed">
              <colgroup>
                <col className="w-10" />
                <col className="w-[24%]" />
                <col className="w-[15%]" />
                <col className="w-[18%]" />
                <col className="w-[22%]" />
                <col className="w-[13%]" />
                <col className="w-16" />
              </colgroup>
              <TableHeader className="sticky top-0 z-10">
                <tr>
                  <TableHead className="w-8 text-center">
                    <span className="sr-only">Select</span>
                    <span className="inline-flex align-middle">
                      <Checkbox
                        aria-label="Select all drivers"
                        checked={
                          isPartiallySelected ? 'indeterminate' : isAllSelected
                        }
                        onCheckedChange={handleSelectAllChange}
                      />
                    </span>
                  </TableHead>
                  <TableHead className="truncate">Name</TableHead>
                  <TableHead className="truncate">Status</TableHead>
                  <TableHead className="truncate">Truck</TableHead>
                  <TableHead className="truncate">Current load</TableHead>
                  <TableHead className="truncate">ETA</TableHead>
                  <TableHead className="w-16">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {drivers.map((driver, index) => (
                  <TableRow
                    isSelected={selectedDriverIds.has(driver.id)}
                    key={driver.id}
                  >
                    <TableCell className="w-8 text-center">
                      <span className="inline-flex align-middle">
                        <Checkbox
                          aria-label={
                            index === 0
                              ? `Deselect ${driver.name}`
                              : `Select ${driver.name}`
                          }
                          checked={selectedDriverIds.has(driver.id)}
                          onCheckedChange={(checked) => {
                            handleDriverSelectChange(driver.id, checked);
                          }}
                        />
                      </span>
                    </TableCell>
                    <TableCell className="max-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <DriverAvatar
                          imageUrl={driver.avatarUrl}
                          name={driver.name}
                          size="default"
                        />
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => {
                              setProfileDriver(driver);
                            }}
                            className="block max-w-full truncate text-left text-xs leading-none font-semibold text-ink-900 underline-offset-2 transition hover:text-primary-700 hover:underline focus-visible:text-primary-700 focus-visible:underline focus-visible:outline-none"
                          >
                            {driver.name}
                          </button>
                          <p className="mt-1 truncate text-[0.65rem] leading-none font-normal text-primary-700">
                            ID: {driver.id}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-0">
                      <StatusBadge
                        size="sm"
                        tone={driverStatusTone[driver.status]}
                      >
                        {driver.status}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="max-w-0">
                      <span className="flex min-w-0 items-center gap-2.5 text-xs font-medium text-ink-900">
                        <span
                          className={cn(
                            'size-2 shrink-0 rounded-full',
                            truckStateStyles[driver.truckState]
                          )}
                        />
                        <span className="truncate">{driver.truck}</span>
                      </span>
                    </TableCell>
                    <TableCell className="max-w-0">
                      <span className="block truncate text-xs font-medium text-ink-900">
                        {driver.currentLoad ?? '-'}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-0">
                      {driver.eta.time ? (
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-ink-900">
                            {driver.eta.time}
                          </p>
                          {driver.eta.state ? (
                            <p
                              className={cn(
                                'mt-0.5 truncate text-xs font-semibold',
                                driver.eta.state === 'Delayed'
                                  ? 'text-warning'
                                  : 'text-teal-600'
                              )}
                            >
                              {driver.eta.state}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-primary-700">
                          -
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="w-16 text-right">
                      <ActionMenu
                        ariaLabel={`Actions for ${driver.name}`}
                        items={[
                          {
                            icon: Eye,
                            label: 'View driver profile',
                            onSelect: () => {
                              setProfileDriver(driver);
                            },
                          },
                          {
                            icon: Pencil,
                            label: 'Edit driver',
                          },
                          {
                            icon: Trash2,
                            label: 'Delete driver',
                            tone: 'danger',
                          },
                        ]}
                        trigger={(isOpen) => (
                          <Button
                            aria-label={`Open actions for ${driver.name}`}
                            className={cn(
                              'text-primary-700',
                              isOpen && 'bg-accent text-accent-foreground'
                            )}
                            size="icon-sm"
                            type="button"
                            variant="ghost"
                          >
                            <Ellipsis className="size-5" />
                          </Button>
                        )}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableScrollArea>
          <DriversPagination />
        </DataTable>
      </div>
      <DriverProfilePanel
        driver={profileDriver}
        isOpen={profileDriver !== null}
        onClose={() => {
          setProfileDriver(null);
        }}
      />
    </section>
  );
}
