import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sonnerSpy: vi.fn(),
  useThemeMock: vi.fn(),
}));

function renderableComponent(tag: keyof React.JSX.IntrinsicElements, testId: string) {
  return ({ children, render, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
    if (React.isValidElement(render)) {
      return React.cloneElement(render, props as Record<string, unknown>, children);
    }

    return React.createElement(tag, { ...props, 'data-testid': testId }, children);
  };
}

vi.mock('@base-ui/react/dialog', () => {
  const Root = renderableComponent('div', 'dialog-root');
  const Trigger = renderableComponent('button', 'dialog-trigger');
  const Portal = renderableComponent('div', 'dialog-portal');
  const Close = renderableComponent('button', 'dialog-close');
  const Backdrop = renderableComponent('div', 'dialog-backdrop');
  const Popup = renderableComponent('div', 'dialog-popup');
  const Title = renderableComponent('h2', 'dialog-title');
  const Description = renderableComponent('p', 'dialog-description');

  return {
    Dialog: { Root, Trigger, Portal, Close, Backdrop, Popup, Title, Description },
  };
});

vi.mock('@base-ui/react/select', () => {
  const Root = renderableComponent('div', 'select-root');
  const Group = renderableComponent('div', 'select-group');
  const Value = renderableComponent('span', 'select-value');
  const Trigger = renderableComponent('button', 'select-trigger');
  const Icon = renderableComponent('span', 'select-icon');
  const Portal = renderableComponent('div', 'select-portal');
  const Positioner = renderableComponent('div', 'select-positioner');
  const Popup = renderableComponent('div', 'select-popup');
  const List = renderableComponent('div', 'select-list');
  const GroupLabel = renderableComponent('div', 'select-group-label');
  const Item = renderableComponent('div', 'select-item');
  const ItemText = renderableComponent('span', 'select-item-text');
  const ItemIndicator = renderableComponent('span', 'select-item-indicator');
  const Separator = renderableComponent('div', 'select-separator');
  const ScrollUpArrow = renderableComponent('button', 'select-scroll-up');
  const ScrollDownArrow = renderableComponent('button', 'select-scroll-down');

  return {
    Select: {
      Root,
      Group,
      Value,
      Trigger,
      Icon,
      Portal,
      Positioner,
      Popup,
      List,
      GroupLabel,
      Item,
      ItemText,
      ItemIndicator,
      Separator,
      ScrollUpArrow,
      ScrollDownArrow,
    },
  };
});

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ComponentProps<'button'>) => <button {...props}>{children}</button>,
}));

vi.mock('next-themes', () => ({
  useTheme: () => mocks.useThemeMock(),
}));

vi.mock('sonner', () => ({
  Toaster: (props: Record<string, unknown>) => {
    mocks.sonnerSpy(props);
    return <div data-testid="sonner" />;
  },
}));

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../components/ui/sheet';
import { Toaster } from '../components/ui/sonner';

describe('advanced ui components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useThemeMock.mockReturnValue({ theme: 'dark' });
  });

  it('renders dialog primitives and optional close buttons', () => {
    render(
      <>
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogPortal>
            <div>Portal content</div>
          </DialogPortal>
          <DialogClose>Close root</DialogClose>
          <DialogOverlay className="extra-overlay" />
          <DialogContent className="extra-content">
            <DialogHeader>
              <DialogTitle>Dialog title</DialogTitle>
              <DialogDescription>Dialog description</DialogDescription>
            </DialogHeader>
            <DialogFooter showCloseButton>
              <span>Dialog footer</span>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <DialogContent showCloseButton={false}>No close button</DialogContent>
        <DialogFooter showCloseButton={false}>Footer only</DialogFooter>
      </>,
    );

    expect(screen.getByText('Open')).toHaveAttribute('data-slot', 'dialog-trigger');
    expect(screen.getByText('Portal content')).toBeInTheDocument();
    expect(screen.getByText('Close root')).toHaveAttribute('data-slot', 'dialog-close');
    expect(document.querySelector('[data-slot="dialog-overlay"]')).toHaveClass('extra-overlay');
    expect(screen.getByText('Dialog title')).toHaveAttribute('data-slot', 'dialog-title');
    expect(screen.getByText('Dialog description')).toHaveAttribute('data-slot', 'dialog-description');
    expect(screen.getByText('Dialog footer').closest('[data-slot="dialog-footer"]')).toBeInTheDocument();
    expect(screen.getAllByText('Close').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('No close button')).toBeInTheDocument();
    expect(screen.getByText('Footer only')).toBeInTheDocument();
    expect(screen.getAllByText('Close root')).toHaveLength(1);
  });

  it('renders select primitives including icons, indicators and scroll buttons', () => {
    render(
      <>
        <Select>
          <SelectTrigger size="sm" className="trigger-extra">
            <SelectValue>Selected value</SelectValue>
          </SelectTrigger>
          <SelectContent side="top" align="start" alignOffset={2} sideOffset={8} alignItemWithTrigger={false} className="content-extra">
            <SelectGroup>
              <SelectLabel>Group label</SelectLabel>
              <SelectItem value="one">Item one</SelectItem>
              <SelectSeparator />
            </SelectGroup>
          </SelectContent>
        </Select>
        <SelectScrollUpButton className="up-extra" />
        <SelectScrollDownButton className="down-extra" />
      </>,
    );

    expect(screen.getByText('Selected value')).toHaveAttribute('data-slot', 'select-value');
    expect(screen.getByRole('button', { name: /Selected value/i })).toHaveAttribute('data-size', 'sm');
    expect(screen.getByRole('button', { name: /Selected value/i }).className).toContain('trigger-extra');
    expect(screen.getByText('Group label')).toHaveAttribute('data-slot', 'select-label');
    expect(screen.getByText('Item one').closest('[data-slot="select-item"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="select-separator"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="select-content"]')).toHaveClass('content-extra');
    expect(document.querySelector('[data-slot="select-content"]')).toHaveAttribute('data-align-trigger', 'false');
    expect(Array.from(document.querySelectorAll('[data-slot="select-scroll-up-button"]')).some((el) => el.className.includes('up-extra'))).toBe(true);
    expect(Array.from(document.querySelectorAll('[data-slot="select-scroll-down-button"]')).some((el) => el.className.includes('down-extra'))).toBe(true);
  });

  it('renders sheet primitives with and without close button', () => {
    render(
      <>
        <Sheet>
          <SheetTrigger>Open sheet</SheetTrigger>
          <SheetClose>Close sheet</SheetClose>
          <SheetContent side="left" className="sheet-extra">
            <SheetHeader>
              <SheetTitle>Sheet title</SheetTitle>
              <SheetDescription>Sheet description</SheetDescription>
            </SheetHeader>
            <SheetFooter>Sheet footer</SheetFooter>
          </SheetContent>
        </Sheet>
        <SheetContent side="top" showCloseButton={false}>No close sheet</SheetContent>
      </>,
    );

    expect(screen.getByText('Open sheet')).toHaveAttribute('data-slot', 'sheet-trigger');
    expect(screen.getByText('Close sheet')).toHaveAttribute('data-slot', 'sheet-close');
    expect(screen.getByText('Sheet title')).toHaveAttribute('data-slot', 'sheet-title');
    expect(screen.getByText('Sheet description')).toHaveAttribute('data-slot', 'sheet-description');
    expect(screen.getByText('Sheet footer').closest('[data-slot="sheet-footer"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="sheet-content"]')).toHaveAttribute('data-side', 'left');
    expect(document.querySelector('[data-slot="sheet-content"]')).toHaveClass('sheet-extra');
    expect(screen.getByText('No close sheet')).toBeInTheDocument();
  });

  it('passes themed props and icons to sonner toaster', () => {
    render(<Toaster position="top-right" richColors />);

    expect(screen.getByTestId('sonner')).toBeInTheDocument();
    expect(mocks.sonnerSpy).toHaveBeenCalledWith(expect.objectContaining({
      theme: 'dark',
      className: 'toaster group',
      position: 'top-right',
      richColors: true,
      toastOptions: { classNames: { toast: 'cn-toast' } },
    }));
    expect(mocks.sonnerSpy.mock.calls[0][0].icons).toBeTruthy();
    expect(mocks.sonnerSpy.mock.calls[0][0].style).toMatchObject({
      '--normal-bg': 'var(--popover)',
      '--normal-text': 'var(--popover-foreground)',
      '--normal-border': 'var(--border)',
      '--border-radius': 'var(--radius)',
    });
  });

  it('falls back to system theme when useTheme provides none', () => {
    mocks.useThemeMock.mockReturnValue({});

    render(<Toaster />);

    expect(mocks.sonnerSpy).toHaveBeenCalledWith(expect.objectContaining({ theme: 'system' }));
  });
});
