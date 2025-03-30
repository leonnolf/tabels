import { useState } from "react";
import './CafeDashboard.css'; // Import the CSS file


export default function CafeDashboard() {
  const [activeTab, setActiveTab] = useState("tables");
  const [tables, setTables] = useState([
    { id: 1, count: 0, max: 4, mergedWith: null, orders: [], bill: 0 },
    { id: 2, count: 0, max: 4, mergedWith: null, orders: [], bill: 0 },
    { id: 3, count: 0, max: 3, mergedWith: null, orders: [], bill: 0 },
    { id: 4, count: 0, max: 4, mergedWith: null, orders: [], bill: 0 },
    { id: 5, count: 0, max: 3, mergedWith: null, orders: [], bill: 0 },
  ]);
  const [orders, setOrders] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [mergeTarget, setMergeTarget] = useState(null);
  const [menuItems] = useState({ "Coffee": 3, "Tea": 2.5, "Sandwich": 5, "Cake": 4 });
  const [orderSelections, setOrderSelections] = useState({});
  const [billDetailsTable, setBillDetailsTable] = useState(null);

  const updateTable = (id, delta) => {
    setTables((prev) =>
      prev.map((table) =>
        table.id === id ? { ...table, count: Math.max(0, Math.min(table.max, table.count + delta)) } : table
      )
    );
  };

  const confirmMerge = () => {
    if (selectedTable === null || mergeTarget === null || selectedTable === mergeTarget) return;
    setTables((prev) => {
      const sourceTable = prev.find((table) => table.id === mergeTarget);
      const targetTable = prev.find((table) => table.id === selectedTable);
      if (!sourceTable || !targetTable) return prev;
      return prev
        .filter((table) => table.id !== mergeTarget)
        .map((table) =>
          table.id === selectedTable
            ? { 
                ...table, 
                count: table.count + sourceTable.count, 
                max: table.max + sourceTable.max, 
                mergedWith: mergeTarget, 
                bill: table.bill + sourceTable.bill, 
                orders: [...table.orders, ...sourceTable.orders] 
              }
            : table
        );
    });
    setMergeTarget(null);
  };

  const splitTable = (id) => {
    const mergedData = tables.find((table) => table.id === id && table.mergedWith);
    if (!mergedData) return;
    setTables((prev) => [
      ...prev,
      { 
        id: mergedData.mergedWith, 
        count: 0, 
        max: mergedData.max, 
        mergedWith: null, 
        bill: 0, 
        orders: [] 
      },
    ].map((table) => (table.id === id ? { ...table, mergedWith: null } : table)));
  };

  const placeOrder = (tableId) => {
    const newOrder = Object.entries(orderSelections).map(([item, quantity]) => ({
      item,
      quantity,
      price: menuItems[item] * quantity,
    })).filter(order => order.quantity > 0); // Filter out items with zero quantity

    if (newOrder.length === 0) return; // Do not place empty orders

    setTables((prev) =>
      prev.map((table) =>
        table.id === tableId
          ? {
              ...table,
              orders: [...table.orders, ...newOrder],
              bill: table.bill + newOrder.reduce((sum, o) => sum + o.price, 0),
            }
          : table
      )
    );

    setOrders([...orders, { tableId, items: newOrder }]);
    setOrderSelections({});
  };

  const processOrder = (index) => {
    setOrders(orders.filter((_, i) => i !== index));
  };

  const payBill = (tableId) => {
    setTables((prev) =>
      prev.map((table) =>
        table.id === tableId ? { ...table, bill: 0 } : table
      )
    );
  };

  const viewBillDetails = (tableId) => {
    setBillDetailsTable(tableId);
  };

  return (
    <div className="cafe-dashboard">
      <h1 className="dashboard-title">Café Dashboard</h1>
      <div className="tabs">
        <button onClick={() => setActiveTab("tables")} className="tab-button">Tables</button>
        <button onClick={() => setActiveTab("orders")} className="tab-button">Orders</button>
        <button onClick={() => setActiveTab("billing")} className="tab-button">Billing</button>
      </div>
      <div className="content">
        {activeTab === "tables" && (
          <div className="tables-container">
            {tables.map((table) => (
              <div key={table.id} className="table-card">
                <h2 className="table-title">Table {table.id} {table.mergedWith ? `(${table.mergedWith})` : ""}</h2>
                <p className="table-info">People: {table.count} / {table.max}</p>
                <div className="table-controls">
                  <button onClick={() => updateTable(table.id, -1)} className="control-button">-</button>
                  <button onClick={() => updateTable(table.id, 1)} className="control-button">+</button>
                </div>
                <select className="merge-select" onChange={(e) => setMergeTarget(Number(e.target.value))}>
                  <option value="">Combine with...</option>
                  {tables.filter(t => t.id !== table.id).map(t => (
                    <option key={t.id} value={t.id}>Table {t.id}</option>
                  ))}
                </select>
                <button className="merge-button" onClick={() => { setSelectedTable(table.id); confirmMerge(); }}>Confirm Merge</button>
                {table.mergedWith && (
                  <button className="split-button" onClick={() => splitTable(table.id)}>Split Table</button>
                )}
                <div className="order-section">
                  <h3 className="order-title">Order</h3>
                  {Object.entries(menuItems).map(([item, price]) => (
                    <div key={item} className="order-item">
                      <span>{item} (${price})</span>
                      <input type="number" min="0" value={orderSelections[item] || 0} onChange={(e) => setOrderSelections({...orderSelections, [item]: parseInt(e.target.value)})} className="order-input" />
                    </div>
                  ))}
                  <button className="place-order-button" onClick={() => placeOrder(table.id)}>Place Order</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {activeTab === "orders" && (
          <div className="orders-container">
            <h2 className="orders-title">Orders</h2>
            {orders.map((order, index) => (
              <div key={index} className="order-details">
                <p><strong>Table {order.tableId}</strong> {tables.find(t => t.id === order.tableId)?.mergedWith ? `(Merged with Table ${tables.find(t => t.id === order.tableId).mergedWith})` : ""}</p>
                {order.items.map((item, i) => (
                  <p key={i}>{item.item}: {item.quantity} - ${item.price.toFixed(2)}</p>
                ))}
                <p>Total: ${order.items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</p>
                <button onClick={() => processOrder(index)} className="process-order-button">Order Processed</button>
              </div>
            ))}
          </div>
        )}
        {activeTab === "billing" && (
          <div className="billing-container">
            <h2 className="billing-title">Billing</h2>
            {tables.map((table) => (
              <div key={table.id} className="billing-details">
                <p><strong>Table {table.id} {table.mergedWith ? `(Merged with Table ${table.mergedWith})` : ""}</strong></p>
                <p>Total Bill: ${table.bill.toFixed(2)}</p>
                <button onClick={() => viewBillDetails(table.id)} className="view-details-button">View Details</button>
                <button onClick={() => payBill(table.id)} className="pay-bill-button">Bill Paid</button>
                {billDetailsTable === table.id && (
                  <div className="bill-item-details">
                    <h4 className="item-details-title">Order Details:</h4>
                    {table.orders.map((order, index) => (
                      <

div key={index} className="bill-item">
                        <span>{order.item}: {order.quantity} - ${order.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}