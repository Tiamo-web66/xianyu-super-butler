import { useState, useCallback, useMemo } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

interface UseConfirmOptions {
  title?: string;
  variant?: 'default' | 'danger';
  confirmText?: string;
  cancelText?: string;
}

export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean;
    message: string;
    onConfirm: (() => void) | null;
    onCancel: (() => void) | null;
    options: UseConfirmOptions;
  }>({
    open: false,
    message: '',
    onConfirm: null,
    onCancel: null,
    options: {},
  });

  const confirm = useCallback((message: string, options: UseConfirmOptions = {}) => {
    return new Promise<boolean>((resolve) => {
      setState({
        open: true,
        message,
        onConfirm: () => {
          resolve(true);
          setState((s) => ({ ...s, open: false }));
        },
        onCancel: () => {
          resolve(false);
          setState((s) => ({ ...s, open: false }));
        },
        options,
      });
    });
  }, []);

  const ConfirmDialogComponent = useMemo(() => (
    <ConfirmDialog
      open={state.open}
      message={state.message}
      title={state.options.title}
      variant={state.options.variant}
      confirmText={state.options.confirmText}
      cancelText={state.options.cancelText}
      onConfirm={state.onConfirm || (() => {})}
      onCancel={state.onCancel || (() => {})}
    />
  ), [state]);

  return { confirm, ConfirmDialogComponent };
}

export default useConfirm;
