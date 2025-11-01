import { useMemo } from 'react';

export function useMemoizedDishes(dishes) {
  return useMemo(() => {
    return dishes || [];
  }, [dishes]);
}

export function useMemoizedOrders(orders) {
  return useMemo(() => {
    const now = Date.now();
    const cutoff = now - 48 * 60 * 60 * 1000;
    return orders?.filter(o => {
      try { 
        return new Date(o.created_at).getTime() >= cutoff; 
      } catch(e) { 
        return false; 
      }
    }) || [];
  }, [orders]);
}