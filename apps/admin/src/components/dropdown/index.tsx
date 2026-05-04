'use client';

import { Popover, PopoverContent, PopoverTrigger } from '@heroui/react';
import React from 'react';

interface DropdownProps {
  button: React.ReactElement;
  children: React.ReactNode;
  classNames?: string;
  // eslint-disable-next-line no-unused-vars
  onOpenChange?: (isOpen: boolean) => void;
  isOpen: boolean;
  placement?:
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'top-start'
    | 'top-end'
    | 'bottom-start'
    | 'bottom-end'
    | 'left-start'
    | 'left-end'
    | 'right-start'
    | 'right-end';
}

const Dropdown = (props: DropdownProps) => {
  const { button, children, classNames, onOpenChange, isOpen, placement = 'bottom-end' } = props;

  return (
    <Popover
      isOpen={isOpen}
      onOpenChange={(open) => onOpenChange?.(open)}
      placement={placement}
      offset={10}
      showArrow={false}
      backdrop="transparent"
    >
      <PopoverTrigger>
        <div className="inline-flex cursor-pointer outline-none">{button}</div>
      </PopoverTrigger>

      <PopoverContent className={`${classNames} pointer-events-auto`}>
        <div className="w-full h-full">{children}</div>
      </PopoverContent>
    </Popover>
  );
};

export default Dropdown;
