import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@repo/ui/lib/utils';

type BrandLogoProps = {
  isCollapsed?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
};

export function BrandLogo({
  isCollapsed = false,
  onClick,
  size = 'md',
}: BrandLogoProps): React.JSX.Element {
  const logoSize = size === 'sm' ? 'size-10' : 'size-11';
  const imageSize = size === 'sm' ? 28 : 32;
  const textSize = size === 'sm' ? 'text-lg' : 'text-lg';

  return (
    <Link
      className={cn(
        'flex min-w-0 items-center gap-1 font-bold',
        isCollapsed && 'justify-center'
      )}
      href="/dashboard"
      onClick={onClick}
    >
      <span
        className={cn(
          'grid shrink-0 place-items-center overflow-hidden',
          logoSize
        )}
      >
        <Image
          alt="AI Logistics logo"
          className="size-4/5 object-contain"
          height={imageSize}
          src="/logo.png"
          width={imageSize}
        />
      </span>
      <span className={cn('truncate', textSize, isCollapsed && 'sr-only')}>
        AI Logistics
      </span>
    </Link>
  );
}
