import React from 'react';
import Modal from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title = '确认操作',
  message,
  confirmText = '确定',
  cancelText = '取消',
  variant = 'default',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const confirmBtnClass = variant === 'danger'
    ? 'bg-red-500 hover:bg-red-600 text-white'
    : 'ios-btn-primary';

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-6 py-2 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2 ${confirmBtnClass}`}
          >
            {loading && (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {confirmText}
          </button>
        </div>
      }
    >
      <p className="text-gray-600 text-center text-base py-4">{message}</p>
    </Modal>
  );
};

export default ConfirmDialog;
