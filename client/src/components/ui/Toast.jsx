import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#FFFFFF',
          color: '#1F2A23',
          border: '1px solid #DCE4DE',
          borderRadius: '12px',
          fontSize: '14px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        },
        success: { iconTheme: { primary: '#3F7652', secondary: '#FFFFFF' } },
        error: { iconTheme: { primary: '#C85B55', secondary: '#FFFFFF' } },
      }}
    />
  );
}
