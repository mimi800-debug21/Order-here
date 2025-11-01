'use client';

import { useState, useMemo } from 'react';
import { useOrders } from '../context/NeonOrderContext';
import { useMemoizedDishes } from '../hooks/useMemoizedData';
import Link from 'next/link';

export default function ClientPage() {
  const { dishes: allDishes, isLoading: { dishes: isLoading }, addOrder } = useOrders();
  const dishes = useMemoizedDishes(allDishes);
  const [selectedDishes, setSelectedDishes] = useState(new Set());
  const [customerName, setCustomerName] = useState('');

  const handleDishToggle = (dishId) => {
    const newSelected = new Set(selectedDishes);
    if (newSelected.has(dishId)) {
      newSelected.delete(dishId);
    } else {
      newSelected.add(dishId);
    }
    setSelectedDishes(newSelected);
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedDishes.size === 0) {
      alert("Bitte mindestens ein Gericht auswählen.");
      return;
    }
    
    if (!customerName.trim()) {
      alert("Bitte deinen Namen angeben.");
      return;
    }

    const selectedDishList = dishes.filter(dish => selectedDishes.has(dish.id));
    
    await addOrder({
      dishes: selectedDishList.map(d => ({ id: d.id, name: d.name, price: d.price || 0 })),
      destination: "N/A",
      customerName: customerName.trim(),
    });

    // Reset form
    setSelectedDishes(new Set());
    setCustomerName('');
    alert("Bestellung wurde übermittelt.");
  };

  const resetForm = () => {
    setSelectedDishes(new Set());
    setCustomerName('');
  };

  return (
    <div className="wrap">
      <header>
        <div className="brand">
          <div className="brand-badge" aria-hidden="true"></div>
          <div>
            <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Next.js App</div>
            <div style={{ fontSize: '18px' }}>Gerichte – Client & Admin</div>
          </div>
        </div>
        <nav>
          <Link href="/admin" className="btn">Admin</Link>
        </nav>
      </header>

      <section className="panel">
        <h1>Bestellung aufgeben</h1>
        <div className="grid grid-2">
          <div className="panel">
            <h2>1) Gerichte wählen</h2>
            {isLoading ? (
              <div className="empty">Laden...</div>
            ) : dishes.length === 0 ? (
              <div className="empty">Noch keine Gerichte verfügbar. Bitte Admin fragen, welche anzulegen.</div>
            ) : (
              <div id="client-dish-picker">
                {dishes.map(dish => (
                  <div key={dish.id} className="dish-checkbox-row">
                    <input
                      type="checkbox"
                      id={`dish-${dish.id}`}
                      checked={selectedDishes.has(dish.id)}
                      onChange={() => handleDishToggle(dish.id)}
                    />
                    <label htmlFor={`dish-${dish.id}`}>
                      {dish.name}
                      {dish.price && ` – ${dish.price.toFixed(2)} €`}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="panel">
            <h2>2) Name</h2>
            <form onSubmit={handleOrderSubmit}>
              <label htmlFor="customer-name">Name</label>
              <input
                id="customer-name"
                name="customer-name"
                placeholder="Max Mustermann"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
              <div className="actions" style={{ marginTop: '10px' }}>
                <button className="primary" type="submit">
                  Bestellen
                </button>
                <button type="button" onClick={resetForm}>
                  Zurücksetzen
                </button>
              </div>
              <div className="hint">Nach Absenden erscheint deine Bestellung im Admin-Bereich.</div>
            </form>
          </div>
        </div>
      </section>

      <div className="footer">
        Food Ordering Application
      </div>
    </div>
  );
}