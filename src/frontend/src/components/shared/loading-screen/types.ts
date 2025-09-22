/**
 * LoadingScreen component types and interfaces
 */

export interface LoadingScreenProps {
  /** Error message to display, if any */
  error?: string | null;
  /** Callback function to handle retry action */
  onRetry?: () => void;
}