// src/components/ToolTip.jsx

import React from 'react';
import * as TooltipPrimitives from '@radix-ui/react-tooltip';
import { cx } from '../utils/cx.js';

const Tooltip = React.forwardRef(
  (
    {
      children,
      className,
      content,
      delayDuration,
      defaultOpen,
      open,
      onClick,
      onOpenChange,
      showArrow = true,
      side,
      sideOffset = 10,
      asChild,
      ...props
    },
    forwardedRef
  ) => (
    <TooltipPrimitives.Provider delayDuration={150}>
      <TooltipPrimitives.Root
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
        delayDuration={delayDuration}
        tremor-id="tremor-raw"
      >
        <TooltipPrimitives.Trigger onClick={onClick} asChild={asChild}>
          {children}
        </TooltipPrimitives.Trigger>
        <TooltipPrimitives.Portal>
          <TooltipPrimitives.Content
            ref={forwardedRef}
            side={side}
            sideOffset={sideOffset}
            align="center"
            className={cx(
              'max-w-60 select-none rounded-md px-2.5 py-1.5 text-sm leading-5 shadow-md',
              'text-gray-50 dark:text-gray-900',
              'bg-gray-900 dark:bg-gray-50',
              'will-change-[transform,opacity]',
              'data-[side=bottom]:animate-slide-down-and-fade data-[side=left]:animate-slide-left-and-fade data-[side=right]:animate-slide-right-and-fade data-[side=top]:animate-slide-up-and-fade data-[state=closed]:animate-hide',
              className
            )}
            {...props}
          >
            {content}
            {showArrow && (
              <TooltipPrimitives.Arrow
                className="border-none fill-gray-900 dark:fill-gray-50"
                width={12}
                height={7}
                aria-hidden="true"
              />
            )}
          </TooltipPrimitives.Content>
        </TooltipPrimitives.Portal>
      </TooltipPrimitives.Root>
    </TooltipPrimitives.Provider>
  )
);

Tooltip.displayName = 'Tooltip';

export { Tooltip };
