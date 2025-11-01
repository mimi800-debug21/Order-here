'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  getDishes, 
  addDish, 
  updateDish, 
  deleteDish, 
  getOrders, 
  addOrder, 
  updateOrderStatus, 
  deleteOrder, 
  clearDoneOrders, 
  clearAllOrders, 
  clearAllDishes 
} from '../app/actions';

// Notification helper
async function showNotification(title, body) {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body: body,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍕</text></svg>'
    });
  } else if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification(title, {
        body: body,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍕</text></svg>'
      });
    }
  }
}

const OrderContext = createContext();

export function NeonOrderProvider({ children }) {
  const [dishes, setDishes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState({ dishes: true, orders: true });
  const [pollTimer, setPollTimer] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());

  // Load initial data
  useEffect(() => {
    loadAllData();
    
    // Set up polling for orders (every 10 seconds)
    const timer = setInterval(async () => {
      await refreshOrdersFromRemote();
    }, 10000);
    
    setPollTimer(timer);
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);

  const loadAllData = async () => {
    await loadDishes();
    await loadOrders();
  };

  const loadDishes = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, dishes: true }));
    try {
      const dishData = await getDishes();
      setDishes(dishData);
    } catch (error) {
      console.error("Error loading dishes:", error);
      // Optionally load demo dishes if DB is empty
      setDishes([]);
    } finally {
      setIsLoading(prev => ({ ...prev, dishes: false }));
    }
  }, []);

  const loadOrders = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, orders: true }));
    try {
      const orderData = await getOrders();
      setOrders(orderData);
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrders([]);
    } finally {
      setIsLoading(prev => ({ ...prev, orders: false }));
    }
  }, []);

  const refreshOrdersFromRemote = useCallback(async () => {
    try {
      const orderData = await getOrders();
      
      // Find new orders since last update
      const oldOrderIds = new Set(orders.map(o => o.id));
      const newOrders = orderData.filter(order => !oldOrderIds.has(order.id));
      
      setOrders(orderData);
      
      if (newOrders.length > 0) {
        for (const order of newOrders) {
          showNotification('Neue Bestellung eingegangen!', `Von: ${order.customer_name}\nGerichte: ${order.dishes.map(d => d.name).join(', ')}`);
        }
      }
      
      setLastUpdateTime(Date.now());
    } catch (error) {
      console.error("Error refreshing orders:", error);
    }
  }, [orders]);

  // Dish operations
  const addDishToDB = useCallback(async (dishData) => {
    try {
      const newDish = await addDish(dishData);
      setDishes(prev => [newDish, ...prev]);
      return newDish;
    } catch (error) {
      console.error("Error adding dish:", error);
      throw error;
    }
  }, []);

  const updateDishInDB = useCallback(async (id, dishData) => {
    try {
      const updatedDish = await updateDish(id, dishData);
      setDishes(prev => prev.map(dish => dish.id === id ? updatedDish : dish));
      return updatedDish;
    } catch (error) {
      console.error("Error updating dish:", error);
      throw error;
    }
  }, []);

  const deleteDishFromDB = useCallback(async (id) => {
    try {
      await deleteDish(id);
      setDishes(prev => prev.filter(dish => dish.id !== id));
    } catch (error) {
      console.error("Error deleting dish:", error);
      throw error;
    }
  }, []);

  // Order operations
  const addOrderToDB = useCallback(async (orderData) => {
    try {
      const newOrder = await addOrder(orderData);
      setOrders(prev => [newOrder, ...prev]);
      
      // Show notification
      showNotification('Neue Bestellung eingegangen!', `Von: ${newOrder.customer_name}\nGerichte: ${newOrder.dishes.map(d => d.name).join(', ')}`);
      
      return newOrder;
    } catch (error) {
      console.error("Error adding order:", error);
      throw error;
    }
  }, []);

  const updateOrderStatusInDB = useCallback(async (id, status) => {
    try {
      const updatedOrder = await updateOrderStatus(id, status);
      setOrders(prev => prev.map(order => order.id === id ? updatedOrder : order));
      return updatedOrder;
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  }, []);

  const deleteOrderFromDB = useCallback(async (id) => {
    try {
      await deleteOrder(id);
      setOrders(prev => prev.filter(order => order.id !== id));
    } catch (error) {
      console.error("Error deleting order:", error);
      throw error;
    }
  }, []);

  const clearDoneOrdersInDB = useCallback(async () => {
    try {
      await clearDoneOrders();
      setOrders(prev => prev.filter(order => order.status !== "done"));
    } catch (error) {
      console.error("Error clearing done orders:", error);
      throw error;
    }
  }, []);

  const clearAllOrdersInDB = useCallback(async () => {
    try {
      await clearAllOrders();
      setOrders([]);
    } catch (error) {
      console.error("Error clearing all orders:", error);
      throw error;
    }
  }, []);

  const clearAllDishesInDB = useCallback(async () => {
    try {
      await clearAllDishes();
      setDishes([]);
    } catch (error) {
      console.error("Error clearing all dishes:", error);
      throw error;
    }
  }, []);

  const value = {
    dishes,
    orders,
    isLoading,
    lastUpdateTime,
    loadDishes,
    loadOrders,
    addDish: addDishToDB,
    updateDish: updateDishInDB,
    deleteDish: deleteDishFromDB,
    addOrder: addOrderToDB,
    updateOrderStatus: updateOrderStatusInDB,
    deleteOrder: deleteOrderFromDB,
    clearDoneOrders: clearDoneOrdersInDB,
    clearAllOrders: clearAllOrdersInDB,
    clearAllDishes: clearAllDishesInDB,
    showNotification
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an NeonOrderProvider');
  }
  return context;
}