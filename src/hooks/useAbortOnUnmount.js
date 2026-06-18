import { useRef, useEffect, useCallback } from 'react';

/**
 * Fournit un AbortController dont le signal annule les requêtes en vol au
 * démontage du composant, pour éviter les setState sur un composant démonté.
 *
 * Recrée un controller frais à chaque montage — robuste au cycle
 * montage/démontage/remontage de React StrictMode (sinon le signal créé au 1er
 * montage resterait avorté au 2ᵉ et annulerait toute requête d'emblée).
 *
 * @returns {() => AbortSignal} Getter du signal courant, stable entre rendus
 */
export const useAbortOnUnmount = () => {
  const ref = useRef(null);
  if (!ref.current) ref.current = new AbortController();
  useEffect(() => {
    // Au (re)montage, repartir d'un controller non avorté.
    ref.current = new AbortController();
    return () => ref.current?.abort();
  }, []);
  return useCallback(() => ref.current.signal, []);
};
