'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

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

export function ApiOrderProvider({ children }) {
  const [dishes, setDishes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState({ dishes: true, orders: true });
  const [pollTimer, setPollTimer] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());

  // Load initial data
  useEffect(() => {
    // Load data
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
      const response = await fetch('/api/dishes');
      if (response.ok) {
        const dishData = await response.json();
        setDishes(dishData);
      } else {
        console.error('Error loading dishes:', await response.text());
        setDishes([]);
      }
    } catch (error) {
      console.error("Error loading dishes:", error);
      setDishes([]);
    } finally {
      setIsLoading(prev => ({ ...prev, dishes: false }));
    }
  }, []);

  const loadOrders = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, orders: true }));
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const orderData = await response.json();
        setOrders(orderData);
      } else {
        console.error('Error loading orders:', await response.text());
        setOrders([]);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrders([]);
    } finally {
      setIsLoading(prev => ({ ...prev, orders: false }));
    }
  }, []);

  const refreshOrdersFromRemote = useCallback(async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const orderData = await response.json();
        
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
      } else {
        console.error('Error refreshing orders:', await response.text());
      }
    } catch (error) {
      console.error("Error refreshing orders:", error);
    }
  }, [orders]);

  // Dish operations
  const addDish = useCallback(async (dishData) => {
    try {
      const response = await fetch('/api/dishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dishData)
      });
      
      if (response.ok) {
        const newDish = await response.json();
        setDishes(prev => [newDish, ...prev]);
        return newDish;
      } else {
        const error = await response.text();
        console.error('Error adding dish:', error);
        throw new Error(error);
      }
    } catch (error) {
      console.error("Error adding dish:", error);
      throw error;
    }
  }, []);

  const updateDish = useCallback(async (id, dishData) => {
    try {
      const response = await fetch(`/api/dishes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dishData)
      });
      
      if (response.ok) {
        const updatedDish = await response.json();
        setDishes(prev => prev.map(dish => dish.id === id ? updatedDish : dish));
        return updatedDish;
      } else {
        const error = await response.text();
        console.error('Error updating dish:', error);
        throw new Error(error);
      }
    } catch (error) {
      console.error("Error updating dish:", error);
      throw error;
    }
  }, []);

  const deleteDish = useCallback(async (id) => {
    try {
      const response = await fetch(`/api/dishes/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setDishes(prev => prev.filter(dish => dish.id !== id));
      } else {
        const error = await response.text();
        console.error('Error deleting dish:', error);
        throw new Error(error);
      }
    } catch (error) {
      console.error("Error deleting dish:", error);
      throw error;
    }
  }, []);

  // Order operations
  const addOrder = useCallback(async (orderData) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      if (response.ok) {
        const newOrder = await response.json();
        setOrders(prev => [newOrder, ...prev]);
        
        // Show notification
        showNotification('Neue Bestellung eingegangen!', `Von: ${newOrder.customer_name}\nGerichte: ${newOrder.dishes.map(d => d.name).join(', ')}`);
        
        return newOrder;
      } else {
        const error = await response.text();
        console.error('Error adding order:', error);
        throw new Error(error);
      }
    } catch (error) {
      console.error("Error adding order:", error);
      throw error;
    }
  }, []);

  const updateOrderStatus = useCallback(async (id, status) => {
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        const updatedOrder = await response.json();
        setOrders(prev => prev.map(order => order.id === id ? updatedOrder : order));
        return updatedOrder;
      } else {
        const error = await response.text();
        console.error('Error updating order status:', error);
        throw new Error(error);
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  }, []);

  const deleteOrder = useCallback(async (id) => {
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setOrders(prev => prev.filter(order => order.id !== id));
      } else {
        const error = await response.text();
        console.error('Error deleting order:', error);
        throw new Error(error);
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      throw error;
    }
  }, []);

  const clearDoneOrders = useCallback(async () => {
    try {
      // First get done orders and delete them one by one
      const doneOrders = orders.filter(order => order.status === "done");
      const deletePromises = doneOrders.map(order => 
        fetch(`/api/orders/${order.id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      setOrders(prev => prev.filter(order => order.status !== "done"));
    } catch (error) {
      console.error("Error clearing done orders:", error);
      throw error;
    }
  }, [orders]);

  const clearAllOrders = useCallback(async () => {
    try {
      // Delete all orders
      const deletePromises = orders.map(order => 
        fetch(`/api/orders/${order.id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      setOrders([]);
    } catch (error) {
      console.error("Error clearing all orders:", error);
      throw error;
    }
  }, [orders]);

  const clearAllDishes = useCallback(async () => {
    try {
      // Delete all dishes
      const deletePromises = dishes.map(dish => 
        fetch(`/api/dishes/${dish.id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      setDishes([]);
    } catch (error) {
      console.error("Error clearing all dishes:", error);
      throw error;
    }
  }, [dishes]);

  const seedDishes = useCallback(async () => {
    const demoDishes = [
      { name: "Margherita", price: 7.5, desc: "Tomate, Mozzarella, Basilikum", tags: "vegetarisch" },
      { name: "Spaghetti Bolognese", price: 9.9, desc: "Hausgemachte Soße", tags: "" },
      { name: "Rotes Thai Curry", price: 11.5, desc: "Mit Gemüse & Kokos", tags: "scharf,vegan" }
    ];
    
    for (const dish of demoDishes) {
      try {
        await addDish(dish);
      } catch (error) {
        console.error("Error adding demo dish:", error);
      }
    }
  }, [addDish]);

  const value = {
    dishes,
    orders,
    isLoading,
    lastUpdateTime,
    loadDishes,
    loadOrders,
    addDish,
    updateDish,
    deleteDish,
    addOrder,
    updateOrderStatus,
    deleteOrder,
    clearDoneOrders,
    clearAllOrders,
    clearAllDishes,
    seedDishes,
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
    throw new Error('useOrders must be used within an ApiOrderProvider');
  }
  return context;
}