import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, StatCard, ActionCard } from '../Card';
import { PrimaryButton, SecondaryButton } from '../Button';

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
    shadow: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
    hover: {
      control: 'boolean',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'This is a basic card component.',
  },
};

export const WithHeader: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-text-secondary">
          This is the card content. It can contain any elements.
        </p>
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Card with Footer</CardTitle>
        <CardDescription>Actions can be placed in the footer.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-text-secondary">Card content here.</p>
      </CardContent>
      <CardFooter>
        <SecondaryButton size="sm">Cancel</SecondaryButton>
        <PrimaryButton size="sm">Save</PrimaryButton>
      </CardFooter>
    </Card>
  ),
};

export const NoPadding: Story = {
  args: {
    padding: 'none',
    children: (
      <div className="p-4 bg-secondary-50">
        Content with custom padding
      </div>
    ),
  },
};

export const LargePadding: Story = {
  args: {
    padding: 'lg',
    children: 'Large padding around this content.',
  },
};

export const WithHover: Story = {
  args: {
    hover: true,
    children: 'Hover over me to see the effect.',
  },
};

export const StatCardStory: Story = {
  render: () => (
    <StatCard
      label="Total Revenue"
      value="$45,231.89"
      change={{ value: 20.1, type: 'increase' }}
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
    />
  ),
  name: 'StatCard',
};

export const StatCardDecrease: Story = {
  render: () => (
    <StatCard
      label="Active Users"
      value="2,350"
      change={{ value: 5.2, type: 'decrease' }}
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      }
    />
  ),
  name: 'StatCard Decrease',
};

export const ActionCardStory: Story = {
  render: () => (
    <ActionCard
      title="Create New Group"
      description="Start a new expense group with friends or roommates"
      onClick={() => console.log('clicked')}
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      }
    />
  ),
  name: 'ActionCard',
};

export const DashboardCards: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-[600px]">
      <StatCard
        label="Total Balance"
        value="$1,234.56"
        change={{ value: 12.5, type: 'increase' }}
      />
      <StatCard
        label="You Owe"
        value="$234.00"
        change={{ value: 8.2, type: 'decrease' }}
      />
      <ActionCard
        title="Add Expense"
        description="Record a new shared expense"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        }
      />
      <ActionCard
        title="Settle Up"
        description="Pay your debts or request payments"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        }
      />
    </div>
  ),
  name: 'Dashboard Cards',
};
