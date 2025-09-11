// React availability checker and initializer
import React from 'react';

// Ensure React is available and properly initialized
export const ensureReactAvailability = (): boolean => {
  if (typeof React === 'undefined' || React === null) {
    console.error('React is undefined or null');
    return false;
  }
  
  if (typeof React.createElement !== 'function') {
    console.error('React.createElement is not a function');
    return false;
  }
  
  if (typeof React.useState !== 'function') {
    console.error('React.useState is not a function');
    return false;
  }
  
  if (typeof React.useEffect !== 'function') {
    console.error('React.useEffect is not a function');
    return false;
  }
  
  if (typeof React.createContext !== 'function') {
    console.error('React.createContext is not a function');
    return false;
  }
  
  return true;
};

// Global React reference for safety
(window as any).__REACT_INSTANCE__ = React;

export default React;