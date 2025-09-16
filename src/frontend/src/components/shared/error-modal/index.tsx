import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, XCircle, Copy, CheckCircle } from 'lucide-react';
import { cn } from '@/lib';

interface ErrorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message: string;
  details?: string;
  severity?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({
  open,
  onOpenChange,
  title = 'An Error Occurred',
  message,
  details,
  severity = 'error',
  onRetry,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyDetails = async () => {
    if (!details) return;
    try {
      await navigator.clipboard.writeText(details);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getSeverityIcon = () => {
    switch (severity) {
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'error':
      default:
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getSeverityColor = () => {
    switch (severity) {
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      case 'error':
      default:
        return 'border-red-200 bg-red-50';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getSeverityIcon()}
            {title}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="mt-2">
              <Alert className={cn('border', getSeverityColor())}>
                <AlertDescription className="text-sm font-medium">
                  {message}
                </AlertDescription>
              </Alert>
            </div>
          </DialogDescription>
        </DialogHeader>

        {details && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Technical Details</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyDetails}
                className="h-8 text-xs"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="rounded-lg bg-gray-100 border border-gray-200 p-3 max-h-32 overflow-y-auto">
              <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap break-all">
                {details}
              </pre>
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2 sm:gap-2">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onRetry();
                onOpenChange(false);
              }}
            >
              Try Again
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            {onRetry ? 'Dismiss' : 'OK'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ErrorModal;