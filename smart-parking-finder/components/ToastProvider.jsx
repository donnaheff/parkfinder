'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [message, setMessage] = useState('');
  const [show, setShow] = useState(false);
  const timerRef = useRef(null);

  const showToast = useCallback((text) => {
    setMessage(text);
    setShow(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShow(false), 3200);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className={`toast${show ? ' show' : ''}`} role="status" aria-live="polite">
        {message}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
