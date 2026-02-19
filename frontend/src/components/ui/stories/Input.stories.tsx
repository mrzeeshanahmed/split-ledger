import type { Meta, StoryObj } from '@storybook/react';
import { InputField, TextAreaField, SelectField, SearchField } from '../Input';

const meta = {
  title: 'UI/Input',
  component: InputField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: {
      control: 'boolean',
    },
    required: {
      control: 'boolean',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InputField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Email',
    placeholder: 'Enter your email',
    type: 'email',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter your username',
    helperText: 'Your username must be at least 3 characters long.',
  },
};

export const WithError: Story = {
  args: {
    label: 'Password',
    placeholder: 'Enter your password',
    type: 'password',
    error: 'Password must be at least 8 characters long.',
  },
};

export const Required: Story = {
  args: {
    label: 'Email',
    placeholder: 'Enter your email',
    type: 'email',
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'This input is disabled',
    disabled: true,
  },
};

export const Small: Story = {
  args: {
    label: 'Small Input',
    placeholder: 'Small size',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    label: 'Large Input',
    placeholder: 'Large size',
    size: 'lg',
  },
};

export const WithLeftIcon: Story = {
  args: {
    label: 'Email',
    placeholder: 'Enter your email',
    type: 'email',
    leftElement: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
};

export const SearchInput: Story = {
  render: () => <SearchField label="Search" placeholder="Search..." />,
};

export const TextArea: Story = {
  render: () => (
    <TextAreaField
      label="Description"
      placeholder="Enter a description..."
      rows={4}
    />
  ),
};

export const TextAreaWithError: Story = {
  render: () => (
    <TextAreaField
      label="Description"
      placeholder="Enter a description..."
      error="Description is required."
    />
  ),
};

export const Select: Story = {
  render: () => (
    <SelectField
      label="Country"
      placeholder="Select a country"
      options={[
        { value: 'us', label: 'United States' },
        { value: 'uk', label: 'United Kingdom' },
        { value: 'ca', label: 'Canada' },
        { value: 'au', label: 'Australia' },
      ]}
    />
  ),
};

export const SelectWithError: Story = {
  render: () => (
    <SelectField
      label="Country"
      placeholder="Select a country"
      error="Please select a country."
      options={[
        { value: 'us', label: 'United States' },
        { value: 'uk', label: 'United Kingdom' },
        { value: 'ca', label: 'Canada' },
        { value: 'au', label: 'Australia' },
      ]}
    />
  ),
};

export const AllInputs: Story = {
  render: () => (
    <div className="space-y-4">
      <InputField label="Text Input" placeholder="Enter text" />
      <InputField label="Email Input" type="email" placeholder="Enter email" />
      <InputField label="Password Input" type="password" placeholder="Enter password" />
      <SearchField label="Search" placeholder="Search..." />
      <TextAreaField label="Text Area" placeholder="Enter description" rows={3} />
      <SelectField
        label="Select"
        placeholder="Select option"
        options={[
          { value: '1', label: 'Option 1' },
          { value: '2', label: 'Option 2' },
          { value: '3', label: 'Option 3' },
        ]}
      />
    </div>
  ),
};
