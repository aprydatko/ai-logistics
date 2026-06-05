import { Plus } from 'lucide-react';

import { Button } from '@repo/ui/components/button';
import { DateButton } from '@repo/ui/components/date-button';
import { SearchField } from '@repo/ui/components/search-field';
import { SelectButton } from '@repo/ui/components/select-button';

const driverStatusOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'On Duty', value: 'on-duty' },
  { label: 'Off Duty', value: 'off-duty' },
  { label: 'Break', value: 'break' },
];

export function DriversToolbar(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-7 xl:justify-between">
      <div>
        <h1 className="text-2xl leading-9 text-ink-900">Drivers</h1>
        <p className="max-w-2xl text-sm text-primary-700">
          List cards, status filter, profile tabs, primary action calls
        </p>
      </div>
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
        <SearchField
          className="min-w-0 flex-1"
          label="Search drivers"
          placeholder="Search drivers"
        />
        <SelectButton
          className="sm:min-w-44"
          options={driverStatusOptions}
          placeholder="Status"
        />
        <DateButton />
        <Button className="h-9 rounded-lg bg-primary-700 px-3! shadow-none hover:bg-primary-600">
          <Plus className="size-4" />
          Create driver
        </Button>
      </div>
    </div>
  );
}
