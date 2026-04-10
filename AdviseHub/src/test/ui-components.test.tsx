import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@base-ui/react/button', () => ({
  Button: (props: React.ComponentProps<'button'>) => <button {...props} />,
}));

vi.mock('@base-ui/react/input', () => ({
  Input: (props: React.ComponentProps<'input'>) => <input {...props} />,
}));

vi.mock('@base-ui/react/switch', () => ({
  Switch: {
    Root: ({ children, defaultChecked, checked, ...props }: React.ComponentProps<'button'> & { defaultChecked?: boolean; checked?: boolean }) => (
      <button role="switch" aria-checked={checked ?? defaultChecked ?? false} {...props}>
        {children}
      </button>
    ),
    Thumb: (props: React.ComponentProps<'span'>) => <span {...props} />,
  },
}));

vi.mock('@base-ui/react/merge-props', () => ({
  mergeProps: (...sources: Record<string, unknown>[]) => {
    const merged: Record<string, unknown> = Object.assign({}, ...sources);
    const classes = sources.map((source) => source.className).filter(Boolean).join(' ');
    if (classes) {
      merged.className = classes;
    }
    return merged;
  },
}));

vi.mock('@base-ui/react/use-render', () => ({
  useRender: ({ defaultTagName, props, state }: { defaultTagName: string; props: Record<string, unknown>; state: Record<string, unknown> }) =>
    React.createElement(defaultTagName, { ...props, 'data-slot': state.slot, 'data-variant': state.variant }, props.children as React.ReactNode),
}));

import { Badge, badgeVariants } from '../components/ui/badge';
import { Button, buttonVariants } from '../components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';

describe('ui components', () => {
  it('renders button variants and sizes', () => {
    expect(buttonVariants()).toContain('bg-primary');
    expect(buttonVariants({ variant: 'outline', size: 'lg' })).toContain('border-border');

    render(
      <Button variant="destructive" size="icon-sm" className="extra-class">
        Delete
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button).toHaveAttribute('data-slot', 'button');
    expect(button.className).toContain('extra-class');
    expect(button.className).toContain('bg-destructive/10');
  });

  it('renders badge variants', () => {
    expect(badgeVariants()).toContain('bg-primary');
    expect(badgeVariants({ variant: 'outline' })).toContain('border-border');

    render(<Badge variant="destructive" className="chip">Warning</Badge>);

    const badge = screen.getByText('Warning');
    expect(badge).toHaveAttribute('data-slot', 'badge');
    expect(badge).toHaveAttribute('data-variant', 'destructive');
    expect(badge.className).toContain('chip');
  });

  it('renders all card slots', () => {
    render(
      <Card size="sm" className="outer-card">
        <CardHeader>
          <CardTitle>Card title</CardTitle>
          <CardDescription>Card description</CardDescription>
          <CardAction>Action</CardAction>
        </CardHeader>
        <CardContent>Body</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    );

    expect(screen.getByText('Card title')).toHaveAttribute('data-slot', 'card-title');
    expect(screen.getByText('Card description')).toHaveAttribute('data-slot', 'card-description');
    expect(screen.getByText('Action')).toHaveAttribute('data-slot', 'card-action');
    expect(screen.getByText('Body')).toHaveAttribute('data-slot', 'card-content');
    expect(screen.getByText('Footer')).toHaveAttribute('data-slot', 'card-footer');
    expect(screen.getByText('Body').closest('[data-slot="card"]')).toHaveAttribute('data-size', 'sm');
  });

  it('renders input label textarea skeleton and switch', () => {
    render(
      <>
        <Label className="custom-label">Name</Label>
        <Input aria-label="name" type="email" className="custom-input" />
        <Textarea aria-label="notes" className="custom-textarea" />
        <Skeleton className="custom-skeleton" />
        <Switch aria-label="toggle" size="sm" defaultChecked className="custom-switch" />
      </>,
    );

    expect(screen.getByText('Name')).toHaveAttribute('data-slot', 'label');
    expect(screen.getByLabelText('name')).toHaveAttribute('data-slot', 'input');
    expect(screen.getByLabelText('name')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('notes')).toHaveAttribute('data-slot', 'textarea');
    expect(document.querySelector('[data-slot="skeleton"]')).toHaveClass('custom-skeleton');
    expect(screen.getByRole('switch')).toHaveAttribute('data-slot', 'switch');
    expect(screen.getByRole('switch')).toHaveAttribute('data-size', 'sm');
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    expect(document.querySelector('[data-slot="switch-thumb"]')).toBeInTheDocument();
  });
});
