import { X } from "lucide-react";

import { Button } from "@repo/ui/components/button";

import { BrandLogo } from "../brand-logo";

type SidebarHeaderProps = {
  isCollapsed: boolean;
  onCloseMobile: () => void;
  showMobileClose: boolean;
};

export function SidebarHeader({
  isCollapsed,
  onCloseMobile,
  showMobileClose,
}: SidebarHeaderProps): React.JSX.Element {
  return (
    <div className="flex h-16 items-center gap-3 border-b px-5">
      <BrandLogo isCollapsed={isCollapsed} onClick={onCloseMobile} />
      {showMobileClose ? (
        <Button
          aria-label="Close navigation"
          className="ml-auto lg:hidden"
          onClick={onCloseMobile}
          size="icon"
          type="button"
          variant="ghost"
        >
          <X />
        </Button>
      ) : null}
    </div>
  );
}
