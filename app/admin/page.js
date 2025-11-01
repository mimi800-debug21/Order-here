'use client';

import { useState } from 'react';
import { useOrders } from '../../context/ApiOrderContext';
import { useMemoizedOrders } from '../../hooks/useMemoizedData';
import Link from 'next/link';

export default function AdminPage() {
  const { 
    dishes, 
    orders, 
    isLoading: { dishes: isLoadingDishes, orders: isLoadingOrders },
    addDish,
    updateDish,
    deleteDish,
    updateOrderStatus,
    deleteOrder,
    clearDoneOrders,
    clearAllOrders,
    clearAllDishes,
    seedDishes
  } = useOrders();
  
  const [dishName, setDishName] = useState('');
  const [dishPrice, setDishPrice] = useState('');
  const [dishDesc, setDishDesc] = useState('');
  const [dishTags, setDishTags] = useState('');
  const [editingDishId, setEditingDishId] = useState(null);

  const handleDishSubmit = async (e) => {
    e.preventDefault();
    
    const name = dishName.trim();
    const price = parseFloat(dishPrice);
    
    if (!name) {
      alert("Gerichtsname erforderlich.");
      return;
    }
    
    const dishData = {
      name,
      price: isFinite(price) ? price : 0,
      desc: dishDesc,
      tags: dishTags
    };
    
    if (editingDishId) {
      await updateDish(editingDishId, dishData);
    } else {
      await addDish(dishData);
    }
    
    // Reset form
    setDishName('');
    setDishPrice('');
    setDishDesc('');
    setDishTags('');
    setEditingDishId(null);
  };

  const handleEditDish = (dish) => {
    setDishName(dish.name);
    setDishPrice(dish.price || '');
    setDishDesc(dish.desc || '');
    setDishTags(dish.tags || '');
    setEditingDishId(dish.id);
    
    // Scroll to form
    document.getElementById('dish-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteDish = async (id) => {
    if (!confirm("Gericht wirklich löschen?")) return;
    await deleteDish(id);
  };

  const handleDeleteOrder = async (id) => {
    if (!confirm("Bestellung wirklich löschen?")) return;
    await deleteOrder(id);
  };

  const handleClearAllDishes = async () => {
    if (!confirm("Alle Gerichte wirklich löschen?")) return;
    await clearAllDishes();
  };

  const recentOrders = useMemoizedOrders(orders);

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
          <Link href="/" className="btn">Client</Link>
        </nav>
      </header>

      <section className="panel">
        <h1>Admin</h1>
        <div className="grid grid-2">
          <div className="panel">
            <h2>Gerichte verwalten</h2>
            <form id="dish-form" onSubmit={handleDishSubmit}>
              <label htmlFor="dish-name">Gericht</label>
              <input
                id="dish-name"
                placeholder="z. B. Spaghetti Bolognese"
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                required
              />
              <div className="row">
                <div>
                  <label htmlFor="dish-price">Preis (€)</label>
                  <input
                    id="dish-price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="9.90"
                    value={dishPrice}
                    onChange={(e) => setDishPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="dish-tags">Tags (optional)</label>
                  <input
                    id="dish-tags"
                    placeholder="vegan, scharf, ..."
                    value={dishTags}
                    onChange={(e) => setDishTags(e.target.value)}
                  />
                </div>
              </div>
              <label htmlFor="dish-desc">Beschreibung (optional)</label>
              <textarea
                id="dish-desc"
                placeholder="Kurzbeschreibung..."
                value={dishDesc}
                onChange={(e) => setDishDesc(e.target.value)}
              ></textarea>
              <div className="actions" style={{ marginTop: '10px' }}>
                <button className="primary" type="submit">
                  {editingDishId ? "Gericht aktualisieren" : "Gericht anlegen"}
                </button>
                <button type="button" onClick={seedDishes}>
                  Demo-Daten füllen
                </button>
                <button 
                  type="button" 
                  className="warn"
                  onClick={handleClearAllDishes}
                >
                  Alle Gerichte löschen
                </button>
              </div>
            </form>

            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={() => {
                const data = dishes;
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "gerichte_export_" + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + ".json";
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              }}>
                Gerichte exportieren
              </button>
              <div className="muted" style={{ alignSelf: 'center', fontSize: '13px' }}>
                Export/Import synchronisiert manuell zwischen Geräten.
              </div>
            </div>

            <div id="dish-list" className="list" style={{ marginTop: '10px' }}>
              {isLoadingDishes ? (
                <div className="empty">Laden...</div>
              ) : dishes.length === 0 ? (
                <div className="empty">Keine Gerichte vorhanden.</div>
              ) : (
                dishes.map(dish => (
                  <div key={dish.id} className="item">
                    <div className="item-header">
                      <strong>{dish.name}</strong>
                      <div>
                        {dish.price ? (
                          <span className="badge">{dish.price.toFixed(2)} €</span>
                        ) : null}
                      </div>
                    </div>
                    {dish.desc && <div className="muted">{dish.desc}</div>}
                    {dish.tags && <div className="muted">Tags: {dish.tags}</div>}
                    <div className="actions">
                      <button 
                        className="primary" 
                        onClick={() => handleEditDish(dish)}
                      >
                        Bearbeiten
                      </button>
                      <button 
                        className="danger" 
                        onClick={() => handleDeleteDish(dish.id)}
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="panel">
            <h2>Eingehende Bestellungen (letzte 48 Stunden)</h2>
            <div className="actions" style={{ marginBottom: '8px' }}>
              <button 
                className="warn" 
                id="clear-done-btn" 
                type="button"
                onClick={clearDoneOrders}
              >
                Erledigte entfernen
              </button>
              <button 
                className="danger" 
                id="clear-orders-btn" 
                type="button"
                onClick={clearAllOrders}
              >
                Alle Bestellungen löschen
              </button>
            </div>
            <div id="order-list" className="list">
              {isLoadingOrders ? (
                <div className="empty">Laden...</div>
              ) : recentOrders.length === 0 ? (
                <div className="empty">Noch keine Bestellungen in den letzten 48 Stunden.</div>
              ) : (
                recentOrders.map(order => {
                  const created = new Date(order.created_at);
                  const meta = `${created.toLocaleDateString()} ${created.toLocaleTimeString()}`;
                  const statusLabel = order.status === "done" ? "erledigt" : 
                                     (order.status === "in_progress" ? "in Arbeit" : "offen");
                  const badgeClass = order.status === "done" ? "badge ok" : 
                                    (order.status === "in_progress" ? "badge warn" : "badge");
                  
                  return (
                    <div key={order.id} className="item">
                      <div className="item-header">
                        <strong>{order.customer_name}</strong>
                        <div>
                          <span className={badgeClass}>{statusLabel}</span>
                        </div>
                      </div>
                      <div className="muted">Bestellt am {meta}</div>
                      {order.destination && order.destination !== "N/A" && (
                        <div>Wohin: {order.destination}</div>
                      )}
                      <ul className="inline-list">
                        {order.dishes.map((dish, idx) => (
                          <li key={idx}>
                            {dish.name}
                            {typeof dish.price === 'number' && dish.price > 0 && 
                             ` (${dish.price.toFixed(2)} €)`}
                          </li>
                        ))}
                      </ul>
                      <div className="actions">
                        <button
                          className="ok"
                          onClick={() => updateOrderStatus(order.id, "in_progress")}
                        >
                          In Arbeit
                        </button>
                        <button
                          className="warn"
                          onClick={() => updateOrderStatus(order.id, "done")}
                        >
                          Abhaken (erledigt)
                        </button>
                        <button
                          className="primary"
                          onClick={() => updateOrderStatus(order.id, "open")}
                        >
                          Zurück auf 'offen'
                        </button>
                        <button
                          className="danger"
                          onClick={() => handleDeleteOrder(order.id)}
                        >
                          Löschen
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="hint">
              Admin aktualisiert Bestellungen automatisch (Polling). Bestellungen werden in der Neon-Datenbank gespeichert.
            </div>
          </div>
        </div>
      </section>

      <div className="footer">
        Food Ordering Admin Panel
      </div>
    </div>
  );
}