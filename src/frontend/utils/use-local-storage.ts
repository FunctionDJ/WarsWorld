import { useState } from "react";

export const useLocalStorage = (key: string, initialValue: string | undefined) => {
  const [valueInternal, setValueInternal] = useState<string | undefined>(() => {
    //check to see if this has a window (client side rendering) or not (server-side-rendering)
    if (typeof window === "undefined") {
      return initialValue;
    }

    const item = window.localStorage.getItem(key);

    //if item is undefined, lets return initialValue. else return item
    return item ?? initialValue;
  });

  const setValueExternal = (newValue: string | undefined) => {
    setValueInternal(newValue);

    if (newValue === undefined) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, newValue);
    }
  };

  return [valueInternal, setValueExternal] as const;
};
