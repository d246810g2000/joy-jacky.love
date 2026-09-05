import { useEffect, useRef } from 'react';

/** 開啟 modal 時 push history，瀏覽器返回鍵可關閉 */
export function useModalHistory(isOpen: boolean, close: () => void) {
  const isBack = useRef(false);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ modal: true }, '');
      isBack.current = false;
      wasOpen.current = true;
    } else if (wasOpen.current) {
      if (!isBack.current) {
        window.history.back();
      }
      wasOpen.current = false;
      isBack.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    const handlePop = () => {
      if (isOpen) {
        isBack.current = true;
        close();
      }
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [isOpen, close]);
}
