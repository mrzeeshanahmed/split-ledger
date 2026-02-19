/**
 * UI Components
 *
 * This module exports all UI components for the design system.
 * Import components from this barrel file:
 *
 * import { Button, Card, Input } from '@/components';
 */

// Button components
export {
  Button,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  GhostButton,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
} from './ui/Button';

// Input components
export {
  InputField,
  TextAreaField,
  SelectField,
  SearchField,
  type InputFieldProps,
  type TextAreaFieldProps,
  type SelectFieldProps,
  type InputSize,
} from './ui/Input';

// Card components
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  StatCard,
  ActionCard,
  type CardProps,
  type StatCardProps,
  type ActionCardProps,
} from './ui/Card';

// Modal components
export {
  Modal,
  ConfirmationModal,
  type ModalProps,
  type ConfirmationModalProps,
} from './ui/Modal';

// Badge components
export {
  Badge,
  DotIndicator,
  ProgressBar,
  StatusBadge,
  type BadgeProps,
  type BadgeVariant,
  type BadgeSize,
  type DotIndicatorProps,
  type ProgressBarProps,
} from './ui/Badge';

// Table components
export {
  DataTable,
  type DataTableProps,
  type Column,
} from './ui/Table';

// Navigation components
export {
  AppShell,
  SidebarNav,
  NavItem,
  TopBar,
  Breadcrumb,
  type NavItemProps,
  type SidebarNavProps,
  type TopBarProps,
  type AppShellProps,
  type BreadcrumbProps,
} from './ui/Navigation';

// Loading components
export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonStat,
  Spinner,
  LoadingOverlay,
  type SkeletonProps,
  type SkeletonTextProps,
  type SkeletonCardProps,
  type SkeletonTableProps,
  type SkeletonStatProps,
  type SpinnerProps,
  type LoadingOverlayProps,
} from './ui/Loading';

// Empty state components
export {
  EmptyState,
  ErrorState,
  NoPermissionState,
  NoDataState,
  NoSearchResultsState,
  type EmptyStateProps,
  type ErrorStateProps,
  type NoPermissionStateProps,
} from './ui/EmptyState';

// Toast components
export {
  Toast,
  ToastContainer,
  ToastProvider,
  useToast,
  ToastButton,
  type ToastData,
  type ToastVariant,
  type ToastPosition,
  type ToastProps,
  type ToastContainerProps,
  type ToastButtonProps,
} from './ui/Toast';

// Form components
export {
  Form,
  FormSection,
  FieldGroup,
  FormDivider,
  FormActions,
  FormRow,
  useFormContext,
  type FormProps,
  type FormSectionProps,
  type FieldGroupProps,
  type FormDividerProps,
  type FormActionsProps,
  type FormRowProps,
} from './ui/Form';

// Auth components
export {
  PasswordStrengthIndicator,
  type PasswordStrengthIndicatorProps,
} from './auth/PasswordStrengthIndicator';
export {
  ProtectedRoute,
  type ProtectedRouteProps,
} from './auth/ProtectedRoute';

// Layout components
export {
  AuthLayout,
  type AuthLayoutProps,
} from './layouts/AuthLayout';

// API Key components
export {
  ApiKeyReveal,
  CreateApiKeyModal,
  RevokeConfirmationModal,
  UsageChart,
  type ApiKeyRevealProps,
  type CreateApiKeyModalProps,
  type RevokeConfirmationModalProps,
  type UsageChartProps,
} from './api-keys';
