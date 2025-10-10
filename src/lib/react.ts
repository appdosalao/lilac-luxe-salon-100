// Centralização das importações do React para garantir instância única
export {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useContext,
  createContext,
  useRef,
  forwardRef,
  memo,
  lazy,
  Suspense,
  StrictMode,
} from 'react';

export type { 
  ReactNode,
  FC,
  ComponentProps,
  CSSProperties,
  ElementRef,
  ComponentPropsWithoutRef,
  ReactElement,
  RefObject,
  MutableRefObject,
} from 'react';

// Re-exportar React default
export { default } from 'react';
