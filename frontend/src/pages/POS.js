import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function POS() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [cart, setCart]         = useState([]);
  const [search, setSearch]     = useState('');
  const [discount, setDiscount] = useState(0);
  const [payMethod, setPayMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [currency, setCurrency] = useState('ETB');
  const [currencies, setCurrencies] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [error, setError]       = useState('');
  const barcodeRef = useRef(null);

  useEffect(() => {
    api.get('/products?limit=500').then(r => setProducts(r.data.products));
    api.get('/currency').then(r => setCurrencies(r.data));
    barcodeRef.current?.focus();
  }, []);

  // Search/barcode
  const filteredProducts = search.length > 0
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search) || p.sku?.toLowerCase().includes(search.toLowerCase()))
    : products.slice(0, 30);

  const addToCart = (product) => {
    setCart(c => {
      const existing = c.find(i => i.productId === product.id);
      if (existing) return c.map(i => i.productId === product.id ? { ...i, qty: i.qty + 1, subtotal: (i.qty + 1) * i.unitPrice } : i);
      return [...c, { productId: product.id, name: product.name, unit: product.unit, unitPrice: parseFloat(product.sellingPrice), qty: 1, subtotal: parseFloat(product.sellingPrice) }];
    });
    setSearch('');
    barcodeRef.current?.focus();
  };

  const handleBarcodeEnter = async (e) => {
    if (e.key !== 'Enter') return;
    const val = search.trim();
    if (!val) return;
    try {
      const res = await api.get(`/products/barcode/${val}`);
      addToCart(res.data);
    } catch {
      // not found by barcode, let filter handle it
    }
  };

  const updateQty = (productId, qty) => {
    if (qty <= 0) { setCart(c => c.filter(i => i.productId !== productId)); return; }
    setCart(c => c.map(i => i.productId === productId ? { ...i, qty, subtotal: qty * i.unitPrice } : i));
  };

  const subtotal    = cart.reduce((s, i) => s + i.subtotal, 0);
  const totalAmount = Math.max(0, subtotal - parseFloat(discount || 0));
  const change      = parseFloat(amountPaid || 0) - totalAmount;

  const printReceipt = (sale) => {
    const w = window.open('', '_blank', 'width=400,height=600');
    const items = sale.items || cart.map(i => ({ name: i.name, quantity: i.qty, unitPrice: i.unitPrice, subtotal: i.subtotal }));
    w.document.write(`
      <html><head><title>Receipt</title>
      <style>
        body{font-family:monospace;font-size:13px;padding:16px;max-width:320px;margin:0 auto}
        h2{text-align:center;margin:0 0 4px}
        p{text-align:center;margin:2px 0;color:#555}
        hr{border:none;border-top:1px dashed #999;margin:8px 0}
        table{width:100%;border-collapse:collapse}
        td{padding:3px 0}
        .right{text-align:right}
        .total{font-weight:bold;font-size:15px}
        .footer{text-align:center;margin-top:12px;color:#777;font-size:11px}
      </style></head><body>
      <h2>🏪 StoreMS</h2>
      <p>${sale.branch?.name || user?.branch?.name || ''}</p>
      <p>Invoice: <strong>${sale.invoiceNumber}</strong></p>
      <p>${new Date(sale.createdAt || Date.now()).toLocaleString()}</p>
      <p>Cashier: ${sale.cashier?.name || user?.name}</p>
      <hr/>
      <table>
        <tr><td><b>Item</b></td><td class="right"><b>Qty</b></td><td class="right"><b>Price</b></td></tr>
        <tr><td colspan="3"><hr/></td></tr>
        ${items.map(i => `<tr><td>${i.name||i.product?.name}</td><td class="right">${i.quantity||i.qty}</td><td class="right">${Number(i.subtotal).toLocaleString()}</td></tr>`).join('')}
        <tr><td colspan="3"><hr/></td></tr>
        <tr><td>Subtotal</td><td></td><td class="right">${Number(sale.subtotal||subtotal).toLocaleString()}</td></tr>
        ${parseFloat(sale.discount||discount)>0?`<tr><td>Discount</td><td></td><td class="right">-${Number(sale.discount||discount).toLocaleString()}</td></tr>`:''}
        <tr class="total"><td>TOTAL</td><td></td><td class="right">${Number(sale.totalAmount||totalAmount).toLocaleString()} ETB</td></tr>
        ${parseFloat(sale.amountPaid||amountPaid)>0?`<tr><td>Paid</td><td></td><td class="right">${Number(sale.amountPaid||amountPaid).toLocaleString()}</td></tr>`:''}
        ${parseFloat(sale.change||Math.max(0,change))>0?`<tr><td>Change</td><td></td><td class="right">${Number(sale.change||Math.max(0,change)).toLocaleString()}</td></tr>`:''}
      </table>
      <hr/>
      <div class="footer">Payment: ${(sale.paymentMethod||payMethod).toUpperCase()}<br/>Thank you for your purchase!</div>
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  const handleCheckout = async () => {
    setProcessing(true); setError('');
    try {
      const res = await api.post('/sales', {
        branchId: user.branchId,
        items: cart.map(i => ({ productId: i.productId, quantity: i.qty, unitPrice: i.unitPrice })),
        discount: parseFloat(discount || 0),
        paymentMethod: payMethod,
        currency,
        amountPaid: parseFloat(amountPaid || totalAmount),
        notes: '',
      });
      setLastSale(res.data);
      printReceipt(res.data);
      setCart([]);
      setDiscount(0);
      setAmountPaid('');
    } catch (e) { setError(e.response?.data?.error || 'Checkout failed'); }
    finally { setProcessing(false); }
  };

  return (
    <div className="pos-layout">
      {/* Left — Products */}
      <div className="pos-products">
        <div className="pos-search-wrap">
          <input ref={barcodeRef} className="pos-search" placeholder="🔍 Search or scan barcode…" value={search}
            onChange={e => setSearch(e.target.value)} onKeyDown={handleBarcodeEnter} autoFocus />
        </div>
        <div className="pos-grid">
          {filteredProducts.map(p => (
            <button key={p.id} className="pos-product-card" onClick={() => addToCart(p)}>
              {p.image && <img src={p.image} alt={p.name} className="pos-product-img" />}
              <div className="pos-product-name">{p.name}</div>
              <div className="pos-product-price">{Number(p.sellingPrice).toLocaleString()} ETB</div>
            </button>
          ))}
        </div>
      </div>

      {/* Right — Cart */}
      <div className="pos-cart">
        <h2 className="pos-cart-title">🛒 Cart</h2>

        {error && <div className="alert alert-error">{error}</div>}

        {lastSale && (
          <div className="alert alert-success">
            ✅ Sale #{lastSale.invoiceNumber} completed!
            <button className="btn btn-sm ml-2" onClick={() => printReceipt(lastSale)}>🖨️ Reprint</button>
            <button className="btn btn-sm ml-2" onClick={() => setLastSale(null)}>Clear</button>
          </div>
        )}

        <div className="cart-items">
          {cart.length === 0 ? <div className="cart-empty">Cart is empty.<br />Tap a product or scan a barcode.</div>
          : cart.map(item => (
            <div key={item.productId} className="cart-item">
              <div className="cart-item-name">{item.name}</div>
              <div className="cart-item-controls">
                <button className="qty-btn" onClick={() => updateQty(item.productId, item.qty - 1)}>−</button>
                <input type="number" className="qty-input" value={item.qty} min="1"
                  onChange={e => updateQty(item.productId, parseInt(e.target.value) || 1)} />
                <button className="qty-btn" onClick={() => updateQty(item.productId, item.qty + 1)}>+</button>
              </div>
              <div className="cart-item-price">{item.subtotal.toLocaleString()} ETB</div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <div className="summary-row"><span>Subtotal</span><strong>{subtotal.toLocaleString()} ETB</strong></div>
          <div className="summary-row">
            <span>Discount</span>
            <input type="number" min="0" className="discount-input" value={discount} onChange={e => setDiscount(e.target.value)} />
          </div>
          <div className="summary-row total-row"><span>Total</span><strong>{totalAmount.toLocaleString()} ETB</strong></div>
        </div>

        <div className="cart-payment">
          <div className="form-row">
            <select className="select" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
              <option value="cash">💵 Cash</option>
              <option value="card">💳 Card</option>
              <option value="mobile">📱 Mobile Pay</option>
              <option value="credit">📒 Credit</option>
            </select>
            <select className="select" value={currency} onChange={e => setCurrency(e.target.value)}>
              {currencies.map(c => <option key={c.code} value={c.code}>{c.code} {c.symbol}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label>Amount Paid</label>
            <input type="number" className="pay-input" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder={totalAmount.toFixed(2)} />
          </div>
          {parseFloat(amountPaid) > 0 && <div className="change-display">Change: <strong>{change >= 0 ? change.toFixed(2) : 0} ETB</strong></div>}
        </div>

        <button className="btn btn-success btn-full btn-checkout" disabled={cart.length === 0 || processing} onClick={handleCheckout}>
          {processing ? 'Processing…' : `✅ Checkout — ${totalAmount.toLocaleString()} ETB`}
        </button>
        {cart.length > 0 && <button className="btn btn-outline btn-full mt-1" onClick={() => setCart([])}>🗑 Clear Cart</button>}
      </div>
    </div>
  );
}
