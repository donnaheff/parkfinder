(function () {
  const LOTS_KEY = 'parkswift-lots-v2';
  const TIER_KEY = 'parkswift-tier';
  const BOOKING_KEY = 'parkswift-last-booking';
  const FILTER_KEY = 'parkswift-filters';
  let selectedLotId = 1;
  let toastTimer;

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function getTier() { return localStorage.getItem(TIER_KEY) || 'free'; }
  function setTier(tier) {
    localStorage.setItem(TIER_KEY, tier);
    document.body.dataset.tier = tier;
    updateTierUi();
    showToast(tier === 'premium' ? 'Premium features unlocked for this prototype.' : 'Free tier selected. Premium-only tools are locked.');
  }
  function isPremium() { return getTier() === 'premium'; }

  function envConfig() { return window.PARKSWIFT_ENV || {}; }
  function isFlagEnabled(flag) { return envConfig()[flag] === true || envConfig()[flag] === 'true'; }
  function featureLabel(flag) { return flag ? flag.replace(/^FEATURE_/, '').replaceAll('_', ' ').toLowerCase() : 'feature flag'; }

  function getLots() {
    try {
      const saved = JSON.parse(localStorage.getItem(LOTS_KEY));
      if (Array.isArray(saved) && saved.length) return saved;
    } catch (_) {}
    const initial = clone(window.PARKSWIFT_INITIAL_LOTS || []);
    localStorage.setItem(LOTS_KEY, JSON.stringify(initial));
    return initial;
  }

  function saveLots(lots) { localStorage.setItem(LOTS_KEY, JSON.stringify(lots)); }
  function getLot(id) { return getLots().find(lot => lot.id === Number(id)) || getLots()[0]; }

  function formatNaira(amount) {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);
  }

  function availabilityClass(lot) {
    const ratio = lot.spaces / lot.capacity;
    if (lot.spaces === 0) return 'full';
    if (ratio < 0.25) return 'low';
    return 'open';
  }

  function availabilityText(lot) {
    const cls = availabilityClass(lot);
    if (cls === 'full') return 'Full';
    if (cls === 'low') return 'Filling fast';
    return 'Available';
  }

  function showToast(message) {
    let toast = $('#toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3400);
  }

  function gatePremium(feature) {
    if (isPremium()) return true;
    showToast(`${feature} is a Premium feature. Open Pricing to upgrade in this prototype.`);
    return false;
  }

  function readFiltersFromUi() {
    return {
      destination: ($('#destination')?.value || '').trim().toLowerCase(),
      vehicle: $('#vehicleType')?.value || 'car',
      walk: $('#maxWalk')?.value || 'all'
    };
  }

  function saveFilters() {
    const values = readFiltersFromUi();
    localStorage.setItem(FILTER_KEY, JSON.stringify(values));
  }

  function restoreFilters() {
    let values = {};
    try { values = JSON.parse(localStorage.getItem(FILTER_KEY)) || {}; } catch (_) {}
    if ($('#destination') && values.destination) $('#destination').value = values.destination;
    if ($('#vehicleType') && values.vehicle) $('#vehicleType').value = values.vehicle;
    if ($('#maxWalk') && values.walk) $('#maxWalk').value = values.walk;
  }

  function lotMatchesFilters(lot, filters) {
    if (filters.destination && !(lot.name.toLowerCase().includes(filters.destination) || lot.area.toLowerCase().includes(filters.destination))) return false;
    if (filters.vehicle === 'ev' && !lot.ev) return false;
    if (filters.vehicle === 'accessible' && !lot.accessible) return false;
    if (filters.vehicle === 'bike' && !lot.bike) return false;
    if (filters.walk !== 'all' && lot.walk > Number(filters.walk)) return false;
    return true;
  }

  function getFilteredLots() {
    const filters = readFiltersFromUi();
    return getLots().filter(lot => lotMatchesFilters(lot, filters)).sort((a, b) => {
      const premiumBoostA = isPremium() ? (a.covered ? -5 : 0) + (a.ev ? -3 : 0) : 0;
      const premiumBoostB = isPremium() ? (b.covered ? -5 : 0) + (b.ev ? -3 : 0) : 0;
      const scoreA = (a.spaces > 0 ? 0 : 1000) + a.drive * 8 + a.walk / 100 - a.spaces / 4 + premiumBoostA;
      const scoreB = (b.spaces > 0 ? 0 : 1000) + b.drive * 8 + b.walk / 100 - b.spaces / 4 + premiumBoostB;
      return scoreA - scoreB;
    });
  }

  function renderStats() {
    const lots = getLots();
    const total = lots.reduce((sum, lot) => sum + lot.spaces, 0);
    const openLots = lots.filter(lot => lot.spaces > 0).length;
    const savedMinutes = Math.max(7, Math.round(18 - openLots * .9));
    const fuel = (savedMinutes * openLots * 0.07).toFixed(1);
    if ($('#totalSpaces')) $('#totalSpaces').textContent = total;
    if ($('#avgTime')) $('#avgTime').textContent = `${savedMinutes} min`;
    if ($('#fuelSaved')) $('#fuelSaved').textContent = `${fuel} L`;
    if ($('#tierMetric')) $('#tierMetric').textContent = isPremium() ? 'Premium' : 'Free';
  }

  function renderLotCard(lot, compact = false) {
    const cls = availabilityClass(lot);
    const ratio = Math.round((lot.spaces / lot.capacity) * 100);
    return `
      <article class="card lot-card" data-lot-card="${lot.id}">
        <div class="card-header">
          <div>
            <h3>${lot.name}</h3>
            <div class="muted">${lot.area}</div>
          </div>
          <span class="badge ${cls}">${availabilityText(lot)}</span>
        </div>
        <div class="lot-meta">
          <span>🅿️ ${lot.spaces}/${lot.capacity} spaces</span>
          <span>🚗 ${lot.drive} min</span>
          <span>🚶 ${lot.walk}m</span>
          <span>⭐ ${lot.rating}</span>
          <span>${formatNaira(lot.price)}/hr</span>
          ${lot.ev ? '<span>⚡ EV</span>' : ''}
          ${lot.accessible ? '<span>♿ Access</span>' : ''}
        </div>
        <div class="progress-track"><div class="progress-bar ${cls}" style="width:${ratio}%"></div></div>
        ${compact ? '' : `
        <div class="lot-actions">
          <button class="btn secondary" type="button" data-route="${lot.id}">Route</button>
          <a class="btn primary" ${lot.spaces === 0 ? 'aria-disabled="true"' : ''} href="${lot.spaces === 0 ? '#' : `checkout.html?lot=${lot.id}`}">${lot.spaces === 0 ? 'Full' : 'Reserve'}</a>
          <button class="btn blue" type="button" data-premium-action="price" data-lot="${lot.id}">Price alert</button>
          <button class="btn secondary" type="button" data-premium-action="hold" data-lot="${lot.id}">Priority hold</button>
        </div>`}
      </article>`;
  }

  function simulateLiveUpdate(manual = false) {
    const lots = getLots();
    lots.forEach(lot => {
      const delta = Math.floor(Math.random() * 7) - 3;
      lot.spaces = Math.max(0, Math.min(lot.capacity, lot.spaces + delta));
      lot.drive = Math.max(3, Math.min(18, lot.drive + Math.floor(Math.random() * 3) - 1));
    });
    saveLots(lots);
    renderPage();
    if (manual) showToast('Live sensor and crowdsourced availability refreshed.');
  }

  function updateTierUi() {
    const tier = getTier();
    document.body.dataset.tier = tier;
    $$('.tier-label').forEach(el => { el.textContent = tier === 'premium' ? 'Premium' : 'Free'; });
    $$('.premium-lock-note').forEach(el => { el.style.display = isPremium() ? 'none' : ''; });
    $$('[data-tier-card]').forEach(card => card.classList.toggle('selected-tier', card.dataset.tierCard === tier));
    $$('[data-set-tier]').forEach(btn => { btn.textContent = btn.dataset.setTier === tier ? 'Current plan' : (btn.dataset.setTier === 'premium' ? 'Upgrade to Premium' : 'Use Free'); });
  }

  function setupChrome() {
    const page = document.body.dataset.page;
    $$('[data-nav]').forEach(link => link.classList.toggle('active', link.dataset.nav === page));
    $$('.bottom-nav a').forEach(link => link.classList.toggle('active', link.dataset.nav === page));
    updateTierUi();
    renderStats();
    const clock = $('#clock');
    if (clock) {
      const tick = () => { clock.textContent = new Intl.DateTimeFormat('en-NG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date()); };
      tick(); setInterval(tick, 1000);
    }
    $$('[data-set-tier]').forEach(button => button.addEventListener('click', () => setTier(button.dataset.setTier)));
    $$('[data-premium-link]').forEach(button => button.addEventListener('click', () => {
      if (!gatePremium(button.dataset.premiumLink || 'This tool')) location.href = 'pricing.html';
    }));
  }

  function setupSearchForms() {
    restoreFilters();
    ['destination', 'vehicleType', 'maxWalk'].forEach(id => {
      const el = $('#' + id);
      if (el) el.addEventListener('input', () => { saveFilters(); renderPage(); });
    });
    const form = $('#searchForm');
    if (form) form.addEventListener('submit', event => {
      event.preventDefault();
      saveFilters();
      if (document.body.dataset.page === 'home') location.href = 'lots.html';
      else {
        renderPage();
        showToast(`${getFilteredLots().length} matching parking options found.`);
      }
    });
  }

  function renderHome() {
    const lots = getFilteredLots().slice(0, 3);
    const preview = $('#homeLots');
    if (preview) preview.innerHTML = lots.map(lot => renderLotCard(lot, true)).join('');
    const booking = $('#recentBooking');
    if (booking) {
      let saved = null;
      try { saved = JSON.parse(localStorage.getItem(BOOKING_KEY)); } catch (_) {}
      booking.innerHTML = saved ? `<strong>${saved.lot}</strong><span class="muted">${saved.duration} hr • ${saved.method} • ${new Date(saved.createdAt).toLocaleString()}</span>` : '<strong>No active booking</strong><span class="muted">Reserve a space from the parking lots page.</span>';
    }
  }

  function renderMap() {
    const mapWrap = $('#mapWrap');
    if (!mapWrap) return;
    $$('.marker', mapWrap).forEach(marker => marker.remove());
    getLots().forEach(lot => {
      const marker = document.createElement('button');
      marker.className = `marker ${availabilityClass(lot)} ${selectedLotId === lot.id ? 'selected' : ''}`;
      marker.style.left = lot.x + '%';
      marker.style.top = lot.y + '%';
      marker.type = 'button';
      marker.setAttribute('aria-label', `${lot.name}: ${lot.spaces} spaces`);
      marker.innerHTML = `<span>${lot.spaces}</span>`;
      marker.addEventListener('click', () => {
        selectedLotId = lot.id;
        renderMap();
        renderMapLot(lot);
      });
      mapWrap.appendChild(marker);
    });
    renderMapLot(getLot(selectedLotId));
  }

  function renderMapLot(lot) {
    if ($('#mapSubtitle')) $('#mapSubtitle').textContent = `${lot.name}: ${lot.spaces} spaces, ${lot.drive} min drive`;
    if ($('#selectedLot')) $('#selectedLot').innerHTML = renderLotCard(lot, false);
    bindLotActions();
  }

  function renderLotsPage() {
    const list = $('#lotList');
    if (!list) return;
    const lots = getFilteredLots();
    if ($('#resultCount')) $('#resultCount').textContent = lots.length ? `${lots.length} options ranked by availability, distance, and congestion` : 'No spaces match your filters';
    list.innerHTML = lots.length ? lots.map(lot => renderLotCard(lot)).join('') : '<article class="card"><h3>No matching lots</h3><p class="muted">Try increasing walking distance or choosing another vehicle type.</p></article>';
    bindLotActions();
  }

  function bindLotActions() {
    $$('[data-route]').forEach(button => button.onclick = () => {
      const lot = getLot(button.dataset.route);
      if (isPremium()) showToast(`Premium route to ${lot.name}: avoiding traffic hotspots and minimizing fuel use.`);
      else showToast(`Basic route selected to ${lot.name}. Upgrade for congestion-aware routing.`);
    });
    $$('[data-premium-action]').forEach(button => button.onclick = () => {
      const lot = getLot(button.dataset.lot);
      if (!gatePremium(button.dataset.premiumAction === 'price' ? 'Dynamic price alerts' : 'Priority reservation holds')) return;
      showToast(button.dataset.premiumAction === 'price' ? `Premium alert set: notify when ${lot.name} drops below ${formatNaira(lot.price)}.` : `Premium hold requested for ${lot.name}. Bay protection extended.`);
    });
    $$('a[aria-disabled="true"]').forEach(link => link.onclick = (event) => { event.preventDefault(); showToast('This lot is currently full. Try a nearby option.'); });
  }

  function renderCheckout() {
    const params = new URLSearchParams(location.search);
    const lot = getLot(params.get('lot') || selectedLotId);
    selectedLotId = lot.id;
    if ($('#checkoutTitle')) $('#checkoutTitle').textContent = `Reserve ${lot.name}`;
    if ($('#checkoutSubtitle')) $('#checkoutSubtitle').textContent = `${lot.area} • ${lot.drive} min drive • ${lot.walk}m walk`;
    if ($('#checkoutLot')) $('#checkoutLot').innerHTML = renderLotCard(lot, true);
    const duration = $('#duration');
    if (duration) {
      duration.innerHTML = isPremium()
        ? '<option value="1">1 hour</option><option value="2">2 hours</option><option value="3">3 hours</option><option value="6">6 hours</option><option value="12">12 hours</option><option value="24">24 hours</option>'
        : '<option value="1">1 hour</option><option value="2">2 hours</option><option value="3">3 hours</option>';
      duration.onchange = () => updateCheckoutSummary(lot);
    }
    const premiumNotice = $('#premiumNotice');
    if (premiumNotice) premiumNotice.style.display = isPremium() ? '' : 'none';
    const premiumHoldField = $('#premiumHoldField');
    if (premiumHoldField) premiumHoldField.style.display = isPremium() ? '' : 'none';
    updateCheckoutSummary(lot);
  }

  function updateCheckoutSummary(lot) {
    const hours = Number($('#duration')?.value || 1);
    const service = isPremium() ? 0 : 150;
    const holdFee = isPremium() && $('#priorityHold')?.checked ? 250 : 0;
    const subtotal = lot.price * hours;
    const total = subtotal + service + holdFee;
    if ($('#paymentSummary')) $('#paymentSummary').innerHTML = `
      <div class="summary-line"><span>Parking</span><span>${formatNaira(lot.price)} × ${hours} hr</span></div>
      <div class="summary-line"><span>${isPremium() ? 'Premium service fee waived' : 'Reservation fee'}</span><span>${formatNaira(service)}</span></div>
      ${holdFee ? `<div class="summary-line"><span>Priority bay hold</span><span>${formatNaira(holdFee)}</span></div>` : ''}
      <div class="summary-line total"><span>Total due</span><span>${formatNaira(total)}</span></div>`;
    if ($('#payButton')) $('#payButton').textContent = `Pay ${formatNaira(total)} and reserve`;
  }

  function setupCheckoutForm() {
    const form = $('#paymentForm');
    if (!form) return;
    $('#priorityHold')?.addEventListener('change', () => updateCheckoutSummary(getLot(selectedLotId)));
    form.addEventListener('submit', event => {
      event.preventDefault();
      const lot = getLot(selectedLotId);
      if (lot.spaces <= 0) { showToast('Sorry, that lot just became full. Please choose another option.'); return; }
      const receipt = $('#receipt')?.value.trim();
      if (!receipt) { showToast('Add a phone number or email for your receipt.'); return; }
      const lots = getLots().map(item => item.id === lot.id ? { ...item, spaces: item.spaces - 1 } : item);
      saveLots(lots);
      const booking = { lot: lot.name, duration: $('#duration')?.value || '1', method: $('#paymentMethod')?.value || 'Mobile wallet', tier: getTier(), createdAt: new Date().toISOString() };
      localStorage.setItem(BOOKING_KEY, JSON.stringify(booking));
      showToast(`Reservation confirmed at ${lot.name}. Digital receipt sent.`);
      setTimeout(() => location.href = 'index.html', 1000);
    });
  }

  function renderPricing() { updateTierUi(); }



  function statusBadge(status) {
    const normalized = String(status || '').toLowerCase();
    const cls = normalized.includes('over') || normalized.includes('unknown') || normalized.includes('offline') ? 'full' : (normalized.includes('review') || normalized.includes('degraded') ? 'low' : 'open');
    return `<span class="badge ${cls}">${status}</span>`;
  }

  function statusDot(status) {
    const normalized = String(status || '').toLowerCase();
    const cls = normalized.includes('online') || normalized.includes('paid') || normalized.includes('valid') ? '' : (normalized.includes('review') || normalized.includes('degraded') ? 'warn' : 'danger');
    return `<span class="status-dot ${cls}"></span>`;
  }

  function renderRecommendations() {
    const moduleList = $('#moduleList');
    if (moduleList) moduleList.innerHTML = (window.PARKSWIFT_MODULES || []).map(module => `
      <a class="card module-card" href="${module.url}">
        <div>
          <span class="badge premium">Implemented</span>
          <h3 style="margin-top:10px">${module.icon} ${module.title}</h3>
          <p class="muted">${module.copy}</p>
        </div>
        <span class="muted small">Open module →</span>
      </a>`).join('');

    const nextList = $('#nextStageList');
    if (nextList) nextList.innerHTML = (window.PARKSWIFT_NEXT_STAGE_MODULES || []).map(module => {
      const enabled = isFlagEnabled(module.flag);
      return `<a class="card module-card ${enabled ? '' : 'flag-off'}" href="${module.url}">
        <div>
          <span class="badge ${enabled ? 'premium' : 'low'}">${enabled ? 'Enabled' : 'Disabled in .env'}</span>
          <h3 style="margin-top:10px">${module.icon} ${module.title}</h3>
          <p class="muted">${module.copy}</p>
          <p class="small muted"><code>${module.flag}=false</code></p>
        </div>
        <span class="muted small">Open implemented module →</span>
      </a>`;
    }).join('');

    const list = $('#recommendationList');
    if (list) list.innerHTML = (window.PARKSWIFT_RECOMMENDATIONS || []).map(([title, copy], index) => `
      <article class="card">
        <div class="badge">Implemented ${index + 1}</div>
        <h3 style="margin-top:10px">${title}</h3>
        <p class="muted">${copy}</p>
      </article>`).join('');

    const further = $('#furtherRecommendationList');
    if (further) further.innerHTML = (window.PARKSWIFT_FURTHER_RECOMMENDATIONS || []).map(([title, copy], index) => `
      <article class="card">
        <div class="badge premium">Implemented next-stage ${index + 1}</div>
        <h3 style="margin-top:10px">${title}</h3>
        <p class="muted">${copy}</p>
      </article>`).join('');

    const sovereign = $('#sovereignRecommendationList');
    if (sovereign) sovereign.innerHTML = (window.PARKSWIFT_SOVEREIGN_RECOMMENDATIONS || []).map(([title, copy], index) => `
      <article class="sovereign-item">
        <span class="badge ${index < 4 ? 'premium' : ''}">Sovereign ${index + 1}</span>
        <strong style="margin-top:10px">${title}</strong>
        <span class="muted">${copy}</span>
      </article>`).join('');
  }

  function renderSensors() {
    const sensors = window.PARKSWIFT_SENSORS || [];
    const avgHealth = Math.round(sensors.reduce((sum, sensor) => sum + sensor.health, 0) / sensors.length);
    if ($('#sensorKpis')) $('#sensorKpis').innerHTML = `
      <div class="kpi"><strong>${sensors.length}</strong><span>connected devices</span></div>
      <div class="kpi"><strong>${avgHealth}%</strong><span>average health</span></div>
      <div class="kpi"><strong>${sensors.filter(s => s.trusted).length}</strong><span>trusted feeds</span></div>
      <div class="kpi"><strong>${sensors.filter(s => s.status === 'online').length}</strong><span>online now</span></div>`;
    if ($('#sensorTable')) $('#sensorTable').innerHTML = `
      <table class="data-table"><thead><tr><th>Device</th><th>Lot</th><th>Type</th><th>Health</th><th>Latency</th><th>Status</th><th>Trust</th></tr></thead><tbody>
      ${sensors.map(sensor => `<tr><td>${sensor.id}</td><td>${sensor.lot}</td><td>${sensor.type}</td><td><div class="mini-bar"><span style="width:${sensor.health}%"></span></div> ${sensor.health}%</td><td>${sensor.latency}</td><td>${statusDot(sensor.status)}${sensor.status}</td><td>${sensor.trusted ? 'Signed feed' : 'Needs audit'}</td></tr>`).join('')}
      </tbody></table>`;
    if ($('#gatewayLog')) $('#gatewayLog').innerHTML = [
      ['Now', 'Sensor packets validated and matched to parking lots.'],
      ['-2 min', 'Crowd report from Yaba Tech Hub marked for operator review.'],
      ['-7 min', 'Barrier loop at Marina synchronized with payment sessions.'],
      ['-15 min', 'Signed gateway health report archived.']
    ].map(([time, text]) => `<div class="timeline-item"><div class="timeline-time">${time}</div><div class="muted">${text}</div></div>`).join('');
  }

  function predictionForLot(lot, horizon) {
    const eventPressure = lot.area.includes('Island') || lot.area.includes('Victoria') ? 1.18 : 0.92;
    const weatherPressure = horizon >= 60 ? 1.08 : 1;
    const demand = Math.round((horizon / 30) * eventPressure * weatherPressure * (lot.capacity / 22));
    const turnover = Math.round((horizon / 60) * (lot.capacity / 18));
    return Math.max(0, Math.min(lot.capacity, lot.spaces - demand + turnover));
  }

  function renderPredictions() {
    const horizon = Number($('#predictionHorizon')?.value || 30);
    const rows = getLots().map(lot => ({ ...lot, predicted: predictionForLot(lot, horizon) }));
    const best = rows.filter(lot => lot.predicted > 0).sort((a, b) => b.predicted - a.predicted)[0] || rows[0];
    if ($('#predictionKpis')) $('#predictionKpis').innerHTML = `
      <div class="kpi"><strong>${horizon}m</strong><span>forecast horizon</span></div>
      <div class="kpi"><strong>${rows.reduce((s, l) => s + l.predicted, 0)}</strong><span>predicted spaces</span></div>
      <div class="kpi"><strong>${best.name.split(' ')[0]}</strong><span>best area pick</span></div>
      <div class="kpi"><strong>${isPremium() ? 'AI' : 'Basic'}</strong><span>model mode</span></div>`;
    if ($('#predictionTable')) $('#predictionTable').innerHTML = `
      <table class="data-table"><thead><tr><th>Lot</th><th>Now</th><th>Forecast</th><th>Confidence</th><th>Demand factors</th><th>Action</th></tr></thead><tbody>
      ${rows.map(lot => {
        const confidence = Math.max(62, Math.min(96, 96 - Math.abs(lot.predicted - lot.spaces)));
        return `<tr><td>${lot.name}<br><span class="small muted">${lot.area}</span></td><td>${lot.spaces}</td><td><strong>${lot.predicted}</strong> spaces</td><td><div class="mini-bar"><span style="width:${confidence}%"></span></div> ${confidence}%</td><td>Traffic, events, weather, turnover</td><td><a class="btn secondary" href="checkout.html?lot=${lot.id}">Reserve</a></td></tr>`;
      }).join('')}
      </tbody></table>`;
    if ($('#predictionNarrative')) $('#predictionNarrative').innerHTML = `Recommended: <strong>${best.name}</strong>. ${isPremium() ? 'Premium AI is weighting event pressure, covered parking, EV support, traffic, and walk distance.' : 'Free forecast uses current occupancy and simple demand assumptions. Upgrade for richer AI weighting.'}`;
  }

  function renderOperator() {
    const lots = getLots();
    const revenue = lots.reduce((sum, lot) => sum + (lot.capacity - lot.spaces) * lot.price, 0);
    if ($('#operatorKpis')) $('#operatorKpis').innerHTML = `
      <div class="kpi"><strong>${lots.length}</strong><span>managed locations</span></div>
      <div class="kpi"><strong>${Math.round(lots.reduce((s,l)=>s+(1-l.spaces/l.capacity),0)/lots.length*100)}%</strong><span>average occupancy</span></div>
      <div class="kpi"><strong>${formatNaira(revenue)}</strong><span>today revenue estimate</span></div>
      <div class="kpi"><strong>3</strong><span>maintenance tickets</span></div>`;
    if ($('#operatorTable')) $('#operatorTable').innerHTML = `
      <table class="data-table"><thead><tr><th>Lot</th><th>Occupancy</th><th>Price/hr</th><th>Revenue</th><th>Controls</th></tr></thead><tbody>
      ${lots.map(lot => {
        const occ = Math.round((1 - lot.spaces / lot.capacity) * 100);
        return `<tr><td>${lot.name}<br><span class="small muted">${lot.area}</span></td><td><div class="mini-bar"><span style="width:${occ}%"></span></div> ${occ}%</td><td>${formatNaira(lot.price)}</td><td>${formatNaira((lot.capacity-lot.spaces)*lot.price)}</td><td><div class="inline-controls"><button class="btn secondary" data-price-lot="${lot.id}" data-delta="-50">-₦50</button><button class="btn secondary" data-price-lot="${lot.id}" data-delta="50">+₦50</button><button class="btn danger" data-refund-lot="${lot.id}">Refund</button></div></td></tr>`;
      }).join('')}
      </tbody></table>`;
    bindOperatorActions();
  }

  function bindOperatorActions() {
    $$('[data-price-lot]').forEach(button => button.onclick = () => {
      const lots = getLots().map(lot => lot.id === Number(button.dataset.priceLot) ? { ...lot, price: Math.max(100, lot.price + Number(button.dataset.delta)) } : lot);
      saveLots(lots);
      renderOperator();
      showToast('Operator price control updated.');
    });
    $$('[data-refund-lot]').forEach(button => button.onclick = () => {
      const lot = getLot(button.dataset.refundLot);
      showToast(`Refund workflow opened for ${lot.name}. In production this would call the payment processor.`);
    });
  }

  function getPermits() {
    const fallback = [
      { holder: 'Ada Okafor', plate: 'APP-204-FE', type: 'Resident', zone: 'Ikoyi Zone B', expires: '2026-12-31', status: 'Active' },
      { holder: 'Nova Mobility', plate: 'FLEET-128', type: 'Corporate', zone: 'Victoria Island', expires: '2026-09-30', status: 'Active' },
      { holder: 'Yaba Campus', plate: 'CAMP-500', type: 'Campus', zone: 'Yaba', expires: '2026-08-15', status: 'Review' }
    ];
    try { return JSON.parse(localStorage.getItem('parkswift-permits')) || fallback; } catch (_) { return fallback; }
  }

  function savePermits(permits) { localStorage.setItem('parkswift-permits', JSON.stringify(permits)); }

  function renderPermits() {
    const permits = getPermits();
    if ($('#permitKpis')) $('#permitKpis').innerHTML = `
      <div class="kpi"><strong>${permits.length}</strong><span>issued permits</span></div>
      <div class="kpi"><strong>${permits.filter(p=>p.status==='Active').length}</strong><span>active permits</span></div>
      <div class="kpi"><strong>4</strong><span>supported permit types</span></div>
      <div class="kpi"><strong>QR</strong><span>validation mode</span></div>`;
    if ($('#permitTable')) $('#permitTable').innerHTML = `
      <table class="data-table"><thead><tr><th>Holder</th><th>Plate</th><th>Type</th><th>Zone</th><th>Expires</th><th>Status</th></tr></thead><tbody>
      ${permits.map(permit => `<tr><td>${permit.holder}</td><td>${permit.plate}</td><td>${permit.type}</td><td>${permit.zone}</td><td>${permit.expires}</td><td>${statusBadge(permit.status)}</td></tr>`).join('')}
      </tbody></table>`;
  }

  function setupPermitForm() {
    const form = $('#permitForm');
    if (!form) return;
    form.addEventListener('submit', event => {
      event.preventDefault();
      const permit = {
        holder: $('#permitHolder').value.trim(),
        plate: $('#permitPlate').value.trim().toUpperCase(),
        type: $('#permitType').value,
        zone: $('#permitZone').value.trim(),
        expires: $('#permitExpiry').value || '2026-12-31',
        status: 'Active'
      };
      if (!permit.holder || !permit.plate || !permit.zone) return showToast('Complete holder, plate, and zone to issue a permit.');
      const permits = getPermits(); permits.unshift(permit); savePermits(permits); form.reset(); renderPermits(); showToast('Digital permit issued with QR validation token.');
    });
  }

  function renderAccessibility() {
    const data = window.PARKSWIFT_ACCESSIBILITY || [];
    if ($('#accessKpis')) $('#accessKpis').innerHTML = `
      <div class="kpi"><strong>${data.reduce((s,l)=>s+l.bays,0)}</strong><span>accessible bays tracked</span></div>
      <div class="kpi"><strong>${data.filter(l=>l.elevator==='Online').length}</strong><span>elevators online</span></div>
      <div class="kpi"><strong>${data.filter(l=>l.cctv==='Yes').length}</strong><span>full CCTV locations</span></div>
      <div class="kpi"><strong>Step-free</strong><span>route priority</span></div>`;
    if ($('#accessTable')) $('#accessTable').innerHTML = `
      <table class="data-table"><thead><tr><th>Lot</th><th>Bays</th><th>Elevator</th><th>Lighting</th><th>CCTV</th><th>Step-free</th><th>Notes</th></tr></thead><tbody>
      ${data.map(item => `<tr><td>${item.lot}</td><td>${item.bays}</td><td>${item.elevator}</td><td>${item.lighting}</td><td>${item.cctv}</td><td>${item.stepFree}</td><td>${item.notes}</td></tr>`).join('')}
      </tbody></table>`;
    if ($('#accessRoute')) $('#accessRoute').innerHTML = ['Choose Civic Centre Garage accessible bay A2.', 'Follow covered ramp toward the east lobby.', 'Use elevator 1 to street level; elevator status is online.', 'Continue on well-lit, CCTV-covered walkway for 110m.'].map((step, i) => `<div class="route-step"><div class="route-icon">${i+1}</div><div>${step}</div></div>`).join('');
  }

  function renderEnforcement() {
    const rows = window.PARKSWIFT_ENFORCEMENT || [];
    if ($('#enforcementKpis')) $('#enforcementKpis').innerHTML = `
      <div class="kpi"><strong>${rows.length}</strong><span>active checks</span></div>
      <div class="kpi"><strong>${rows.filter(r=>r.status==='Overstay').length}</strong><span>overstay alerts</span></div>
      <div class="kpi"><strong>${rows.filter(r=>r.status==='Unknown').length}</strong><span>manual reviews</span></div>
      <div class="kpi"><strong>LPR</strong><span>plate validation</span></div>`;
    if ($('#enforcementTable')) $('#enforcementTable').innerHTML = `
      <table class="data-table"><thead><tr><th>Plate</th><th>Lot</th><th>Status</th><th>Due</th><th>Action</th></tr></thead><tbody>
      ${rows.map(row => `<tr><td>${row.plate}</td><td>${row.lot}</td><td>${statusBadge(row.status)}</td><td>${row.due}</td><td>${row.action}</td></tr>`).join('')}
      </tbody></table>`;
  }

  function setupEnforcementForm() {
    const form = $('#plateCheckForm');
    if (!form) return;
    form.addEventListener('submit', event => {
      event.preventDefault();
      const plate = $('#plateInput').value.trim().toUpperCase();
      const match = (window.PARKSWIFT_ENFORCEMENT || []).find(row => row.plate === plate);
      $('#plateResult').innerHTML = match ? `<div class="notice">${plate}: ${match.status} at ${match.lot}. Recommended action: ${match.action}.</div>` : `<div class="notice warn">${plate}: no paid session or permit found. Send to manual review.</div>`;
    });
  }

  function getCorporate() {
    try { return JSON.parse(localStorage.getItem('parkswift-corporate')) || clone(window.PARKSWIFT_CORPORATE); } catch (_) { return clone(window.PARKSWIFT_CORPORATE); }
  }
  function saveCorporate(data) { localStorage.setItem('parkswift-corporate', JSON.stringify(data)); }

  function renderCorporate() {
    const data = getCorporate();
    if ($('#corpKpis')) $('#corpKpis').innerHTML = `
      <div class="kpi"><strong>${formatNaira(data.wallet)}</strong><span>team wallet</span></div>
      <div class="kpi"><strong>${formatNaira(data.monthlySpend)}</strong><span>month-to-date spend</span></div>
      <div class="kpi"><strong>${data.activeDrivers}</strong><span>active drivers</span></div>
      <div class="kpi"><strong>${formatNaira(data.policyLimit)}</strong><span>per-driver limit</span></div>`;
    if ($('#employeeTable')) $('#employeeTable').innerHTML = `
      <table class="data-table"><thead><tr><th>Employee</th><th>Role</th><th>Trips</th><th>Spend</th><th>Status</th></tr></thead><tbody>
      ${data.employees.map(employee => `<tr><td>${employee.name}</td><td>${employee.role}</td><td>${employee.trips}</td><td>${formatNaira(employee.spend)}</td><td>${employee.spend > data.policyLimit * 3 ? statusBadge('Review') : statusBadge('OK')}</td></tr>`).join('')}
      </tbody></table>`;
    if ($('#invoiceBox')) $('#invoiceBox').innerHTML = `<div class="invoice-box"><h3>${data.company}</h3><div class="summary-line"><span>Parking sessions</span><span>${data.employees.reduce((s,e)=>s+e.trips,0)}</span></div><div class="summary-line"><span>Subtotal</span><span>${formatNaira(data.monthlySpend)}</span></div><div class="summary-line"><span>VAT estimate</span><span>${formatNaira(Math.round(data.monthlySpend * .075))}</span></div><div class="summary-line total"><span>Invoice total</span><span>${formatNaira(Math.round(data.monthlySpend * 1.075))}</span></div></div>`;
  }

  function setupCorporateForm() {
    const form = $('#employeeForm');
    if (!form) return;
    form.addEventListener('submit', event => {
      event.preventDefault();
      const data = getCorporate();
      const name = $('#employeeName').value.trim();
      const role = $('#employeeRole').value.trim() || 'Driver';
      if (!name) return showToast('Add an employee name.');
      data.employees.unshift({ name, role, spend: 0, trips: 0 });
      data.activeDrivers += 1;
      saveCorporate(data); form.reset(); renderCorporate(); showToast('Corporate driver invited and wallet policy applied.');
    });
  }

  function renderPrivacy() {
    const lots = getLots();
    const sessions = lots.reduce((sum, lot) => sum + lot.capacity - lot.spaces, 0);
    if ($('#privacyKpis')) $('#privacyKpis').innerHTML = `
      <div class="kpi"><strong>${sessions}</strong><span>aggregated sessions</span></div>
      <div class="kpi"><strong>0</strong><span>raw identities exposed</span></div>
      <div class="kpi"><strong>30d</strong><span>default retention</span></div>
      <div class="kpi"><strong>k≥10</strong><span>anonymity threshold</span></div>`;
    if ($('#privacyAnalytics')) $('#privacyAnalytics').innerHTML = lots.map(lot => {
      const used = lot.capacity - lot.spaces;
      const share = Math.round(used / lot.capacity * 100);
      return `<div class="switch-row"><div><strong>${lot.area}</strong><div class="muted small">Aggregated parking demand, no plate or user ID shown</div></div><div style="min-width:160px"><div class="mini-bar"><span style="width:${share}%"></span></div><span class="small muted">${share}% demand</span></div></div>`;
    }).join('');
    if ($('#privacyAudit')) $('#privacyAudit').innerHTML = ['Location traces generalized to zones', 'Payment identifiers tokenized', 'Sensor data signed at gateway', 'Operator exports audited', 'City analytics aggregated before display'].map(item => `<li>${item}</li>`).join('');
  }

  function setupModuleActions() {
    setupPermitForm();
    setupEnforcementForm();
    setupCorporateForm();
    setupManageLotsForm();
    const horizon = $('#predictionHorizon');
    if (horizon) horizon.addEventListener('change', renderPredictions);
    const sync = $('#syncSensors');
    if (sync) sync.addEventListener('click', () => { simulateLiveUpdate(false); renderSensors(); showToast('Verified IoT gateway synchronized with live lot availability.'); });
    const route = $('#buildAccessRoute');
    if (route) route.addEventListener('click', () => showToast('Accessible route generated with step-free priority and elevator status checks.'));
    const invoice = $('#downloadInvoice');
    if (invoice) invoice.addEventListener('click', () => showToast('Invoice export prepared. In production this would download a PDF/CSV.'));
    const anonymize = $('#anonymizeNow');
    if (anonymize) anonymize.addEventListener('click', () => showToast('Privacy pass complete: analytics remain aggregated and identifying data is hidden.'));
    const demoToken = $('#demoToken');
    if (demoToken) demoToken.addEventListener('click', () => showToast('V2I token flow is implemented but currently controlled by .env.'));
    const publishCurb = $('#publishCurb');
    if (publishCurb) publishCurb.addEventListener('click', () => showToast('Curb rule publication is implemented and awaits feature enablement.'));
    const publishApi = $('#publishApi');
    if (publishApi) publishApi.addEventListener('click', () => showToast('API product publication is implemented and gated by the marketplace flag.'));
    const runSecurityScan = $('#runSecurityScan');
    if (runSecurityScan) runSecurityScan.addEventListener('click', () => showToast('Fraud scan queued. Enable the defense flag for live actions.'));
  }


  function renderManageLots() {
    const lots = getLots();
    if ($('#manageLotsKpis')) $('#manageLotsKpis').innerHTML = `
      <div class="kpi"><strong>${lots.length}</strong><span>registered parking lots</span></div>
      <div class="kpi"><strong>${lots.reduce((s,l)=>s+l.capacity,0)}</strong><span>total capacity</span></div>
      <div class="kpi"><strong>${lots.reduce((s,l)=>s+l.spaces,0)}</strong><span>available spaces</span></div>
      <div class="kpi"><strong>${formatNaira(Math.round(lots.reduce((s,l)=>s+l.price,0)/lots.length || 0))}</strong><span>average hourly price</span></div>`;
    if ($('#manageLotsTable')) $('#manageLotsTable').innerHTML = `
      <table class="data-table"><thead><tr><th>Lot</th><th>Area</th><th>Spaces</th><th>Price/hr</th><th>Flags</th><th>Map</th><th>Actions</th></tr></thead><tbody>
      ${lots.map(lot => `<tr><td><strong>${lot.name}</strong></td><td>${lot.area}</td><td>${lot.spaces}/${lot.capacity}</td><td>${formatNaira(lot.price)}</td><td>${lot.ev ? 'EV ' : ''}${lot.accessible ? 'Accessible ' : ''}${lot.bike ? 'Bike ' : ''}${lot.covered ? 'Covered' : ''}</td><td>${lot.x}%, ${lot.y}%</td><td><div class="inline-controls"><button class="btn secondary" data-fill-lot="${lot.id}">+5 spaces</button><button class="btn secondary" data-empty-lot="${lot.id}">-5 spaces</button><button class="btn danger" data-delete-lot="${lot.id}">Delete</button></div></td></tr>`).join('')}
      </tbody></table>`;
    if ($('#lotsJson')) $('#lotsJson').textContent = JSON.stringify(lots, null, 2);
    bindManageLotActions();
  }

  function bindManageLotActions() {
    $$('[data-fill-lot]').forEach(btn => btn.onclick = () => {
      const lots = getLots().map(lot => lot.id === Number(btn.dataset.fillLot) ? { ...lot, spaces: Math.min(lot.capacity, lot.spaces + 5) } : lot);
      saveLots(lots); renderManageLots(); renderStats(); showToast('Availability increased for selected lot.');
    });
    $$('[data-empty-lot]').forEach(btn => btn.onclick = () => {
      const lots = getLots().map(lot => lot.id === Number(btn.dataset.emptyLot) ? { ...lot, spaces: Math.max(0, lot.spaces - 5) } : lot);
      saveLots(lots); renderManageLots(); renderStats(); showToast('Availability reduced for selected lot.');
    });
    $$('[data-delete-lot]').forEach(btn => btn.onclick = () => {
      const lot = getLot(btn.dataset.deleteLot);
      if (!confirm(`Delete ${lot.name}? This only affects browser localStorage.`)) return;
      const lots = getLots().filter(item => item.id !== lot.id);
      saveLots(lots); renderManageLots(); renderStats(); showToast('Parking lot removed from local prototype data.');
    });
  }

  function setupManageLotsForm() {
    const form = $('#lotForm');
    if (!form) return;
    form.addEventListener('submit', event => {
      event.preventDefault();
      const lots = getLots();
      const capacity = Math.max(1, Number($('#lotCapacity').value || 1));
      const spaces = Math.max(0, Math.min(capacity, Number($('#lotSpaces').value || 0)));
      const newLot = {
        id: lots.reduce((max, lot) => Math.max(max, lot.id), 0) + 1,
        name: $('#lotName').value.trim(),
        area: $('#lotArea').value.trim(),
        x: Math.max(8, Math.min(92, Number($('#lotMapX').value || Math.floor(10 + Math.random() * 80)))),
        y: Math.max(8, Math.min(92, Number($('#lotMapY').value || Math.floor(10 + Math.random() * 80)))),
        spaces,
        capacity,
        price: Math.max(0, Number($('#lotPrice').value || 0)),
        walk: Math.max(0, Number($('#lotWalk').value || 0)),
        drive: Math.max(1, Number($('#lotDrive').value || 1)),
        rating: Math.max(1, Math.min(5, Number($('#lotRating').value || 4.2))),
        ev: $('#lotEv').checked,
        accessible: $('#lotAccessible').checked,
        bike: $('#lotBike').checked,
        covered: $('#lotCovered').checked
      };
      if (!newLot.name || !newLot.area) return showToast('Add a lot name and area.');
      lots.push(newLot); saveLots(lots); form.reset(); renderManageLots(); renderStats(); showToast(`${newLot.name} added to ParkSwift.`);
    });
    $('#resetLots')?.addEventListener('click', () => {
      if (!confirm('Reset parking lots to the defaults from assets/data.js?')) return;
      saveLots(clone(window.PARKSWIFT_INITIAL_LOTS || [])); renderManageLots(); renderStats(); showToast('Parking lots reset to default data.');
    });
    $('#copyLotsJson')?.addEventListener('click', async () => {
      const json = JSON.stringify(getLots(), null, 2);
      try { await navigator.clipboard.writeText(json); showToast('Parking lots JSON copied.'); }
      catch (_) { showToast('Copy unavailable in this browser; select the JSON manually.'); }
    });
  }

  function renderSovereignSuiteCategory() {
    const category = document.body.dataset.sovereignCategory;
    if (!category) return;
    const info = (window.PARKSWIFT_SOVEREIGN_CATEGORIES || {})[category] || { title: 'Sovereign modules', copy: '' };
    const modules = (window.PARKSWIFT_SOVEREIGN_MODULES || []).filter(module => module.category === category);
    const enabled = modules.filter(module => isFlagEnabled(module.flag)).length;
    if ($('#sovereignCategoryTitle')) $('#sovereignCategoryTitle').textContent = info.title;
    if ($('#sovereignCategoryCopy')) $('#sovereignCategoryCopy').textContent = info.copy;
    if ($('#sovereignCategoryKpis')) $('#sovereignCategoryKpis').innerHTML = `
      <div class="kpi"><strong>${modules.length}</strong><span>implemented modules</span></div>
      <div class="kpi"><strong>${enabled}</strong><span>enabled by .env</span></div>
      <div class="kpi"><strong>${modules.length - enabled}</strong><span>disabled by .env</span></div>
      <div class="kpi"><strong>Prototype</strong><span>status</span></div>`;
    if ($('#sovereignCategoryList')) $('#sovereignCategoryList').innerHTML = modules.map(module => {
      const on = isFlagEnabled(module.flag);
      return `<article class="card ${on ? '' : 'flag-off'}">
        <div class="card-header"><div><span class="badge ${on ? 'premium' : 'low'}">${on ? 'Enabled' : 'Disabled by .env'}</span><h3 style="margin-top:10px">${module.icon} ${module.title}</h3></div></div>
        <p class="muted">${module.copy}</p>
        <div class="notice ${on ? '' : 'warn'}"><strong>Implemented:</strong> ${module.implementation}</div>
        <div class="actions"><button class="btn primary" ${on ? '' : 'disabled'}>Open console</button><button class="btn secondary" ${on ? '' : 'disabled'}>Export config</button></div>
        <p class="small muted"><code>${module.flag}=${on ? 'true' : 'false'}</code></p>
      </article>`;
    }).join('');
  }


  function renderFeatureFlagBanner() {
    const flag = document.body.dataset.featureFlag;
    if (!flag) return;
    const enabled = isFlagEnabled(flag);
    const hero = $('.page-hero');
    if (!hero || $('#featureFlagBanner')) return;
    const banner = document.createElement('div');
    banner.id = 'featureFlagBanner';
    banner.className = 'disabled-banner';
    banner.innerHTML = enabled
      ? `<strong>Feature enabled</strong><span><code>${flag}=true</code> in .env-generated config.</span>`
      : `<strong>Implemented but disabled</strong><span>Enable by setting <code>${flag}=true</code> in <code>smart-parking-finder/.env</code>, then run <code>node scripts/sync-env.js</code>.</span>`;
    hero.insertAdjacentElement('afterend', banner);
  }

  function applyFeatureFlagState() {
    const flag = document.body.dataset.featureFlag;
    if (!flag) return;
    const enabled = isFlagEnabled(flag);
    renderFeatureFlagBanner();
    $$('[data-feature-content]').forEach(el => el.classList.toggle('feature-disabled', !enabled));
    if (!enabled) {
      $$('[data-feature-content] button, [data-feature-content] input, [data-feature-content] select, [data-feature-content] textarea').forEach(el => { el.disabled = true; });
    }
  }

  function renderV2I() {
    if ($('#v2iFlow')) $('#v2iFlow').innerHTML = [
      ['Vehicle request', 'Connected vehicle asks for nearby parking using a signed vehicle credential.'],
      ['Reservation token', 'ParkSwift returns assigned lot, bay type, payment estimate, and validity window.'],
      ['Garage entry', 'Barrier validates the token and opens without manual phone interaction.'],
      ['Bay guidance', 'Vehicle receives indoor route hints and accessible/EV charging metadata.']
    ].map(([time, text]) => `<div class="timeline-item"><div class="timeline-time">${time}</div><div class="muted">${text}</div></div>`).join('');
    if ($('#v2iPayload')) $('#v2iPayload').textContent = JSON.stringify({ vehicleId: 'did:vehicle:lagos-demo-001', requestedZone: 'Victoria Island', token: 'signed-parking-token-disabled-demo', bayType: 'EV-covered', expiresIn: '15m' }, null, 2);
  }

  function renderCurb() {
    const zones = window.PARKSWIFT_CURB_ZONES || [];
    if ($('#curbKpis')) $('#curbKpis').innerHTML = `<div class="kpi"><strong>${zones.length}</strong><span>managed curb zones</span></div><div class="kpi"><strong>${Math.round(zones.reduce((s,z)=>s+z.compliance,0)/zones.length)}%</strong><span>avg compliance</span></div><div class="kpi"><strong>4</strong><span>curb use modes</span></div><div class="kpi"><strong>Live</strong><span>rule switching</span></div>`;
    if ($('#curbTable')) $('#curbTable').innerHTML = `<table class="data-table"><thead><tr><th>Zone</th><th>Street</th><th>Mode</th><th>Window</th><th>Price</th><th>Compliance</th></tr></thead><tbody>${zones.map(z => `<tr><td>${z.zone}</td><td>${z.street}</td><td>${z.mode}</td><td>${z.window}</td><td>${formatNaira(z.price)}</td><td><div class="mini-bar"><span style="width:${z.compliance}%"></span></div> ${z.compliance}%</td></tr>`).join('')}</tbody></table>`;
  }

  function renderEvents() {
    const events = window.PARKSWIFT_EVENTS || [];
    if ($('#eventKpis')) $('#eventKpis').innerHTML = `<div class="kpi"><strong>${events.length}</strong><span>events monitored</span></div><div class="kpi"><strong>${events.reduce((s,e)=>s+e.expected,0).toLocaleString()}</strong><span>expected visitors</span></div><div class="kpi"><strong>${events.filter(e=>e.surge==='High').length}</strong><span>high-surge events</span></div><div class="kpi"><strong>Pre-plan</strong><span>traffic mode</span></div>`;
    if ($('#eventTable')) $('#eventTable').innerHTML = `<table class="data-table"><thead><tr><th>Event</th><th>Venue</th><th>Start</th><th>Visitors</th><th>Surge</th><th>Recommended lots</th></tr></thead><tbody>${events.map(e => `<tr><td>${e.name}</td><td>${e.venue}</td><td>${e.start}</td><td>${e.expected.toLocaleString()}</td><td>${statusBadge(e.surge)}</td><td>${e.lots.join(', ')}</td></tr>`).join('')}</tbody></table>`;
    if ($('#eventPlan')) $('#eventPlan').innerHTML = ['Reserve 35% capacity for pre-booked arrivals.', 'Push transit and park-and-walk suggestions 3 hours before start.', 'Activate temporary curb loading zones around venue.', 'Notify traffic officers when occupancy crosses 85%.'].map((step, i) => `<div class="route-step"><div class="route-icon">${i+1}</div><div>${step}</div></div>`).join('');
  }

  function renderCarbon() {
    const lots = getLots();
    const openLots = lots.filter(l => l.spaces > 0).length || 1;
    const minutesSaved = Math.max(7, Math.round(18 - openLots * .9));
    const sessions = lots.reduce((s,l)=>s + (l.capacity - l.spaces), 0);
    const fuel = +(minutesSaved * sessions * 0.035).toFixed(1);
    const co2 = +(fuel * 2.31).toFixed(1);
    if ($('#carbonKpis')) $('#carbonKpis').innerHTML = `<div class="kpi"><strong>${minutesSaved}m</strong><span>avg cruising avoided</span></div><div class="kpi"><strong>${fuel}L</strong><span>fuel saved estimate</span></div><div class="kpi"><strong>${co2}kg</strong><span>CO₂ avoided estimate</span></div><div class="kpi"><strong>${sessions}</strong><span>tracked sessions</span></div>`;
    if ($('#carbonReport')) $('#carbonReport').innerHTML = lots.map(lot => { const used = lot.capacity - lot.spaces; const saved = +(used * minutesSaved * 0.035 * 2.31).toFixed(1); return `<div class="switch-row"><div><strong>${lot.name}</strong><div class="muted small">${used} sessions modeled</div></div><span class="badge">${saved}kg CO₂</span></div>`; }).join('');
  }

  function renderMarketplace() {
    const apis = window.PARKSWIFT_API_PRODUCTS || [];
    if ($('#apiTable')) $('#apiTable').innerHTML = `<table class="data-table"><thead><tr><th>API</th><th>Audience</th><th>Scope</th><th>Status</th></tr></thead><tbody>${apis.map(api => `<tr><td>${api.name}</td><td>${api.audience}</td><td>${api.scope}</td><td>${statusBadge(api.status)}</td></tr>`).join('')}</tbody></table>`;
    if ($('#apiSample')) $('#apiSample').textContent = `GET /v1/availability?zone=victoria-island\nAuthorization: Bearer <sovereign-token>\n\n{\n  "zone": "victoria-island",\n  "spaces": 73,\n  "updated_at": "2026-07-07T12:00:00+01:00",\n  "data_residency": "NG"\n}`;
  }

  function renderSecurity() {
    if ($('#securityKpis')) $('#securityKpis').innerHTML = `<div class="kpi"><strong>Signed</strong><span>sensor packets</span></div><div class="kpi"><strong>ML</strong><span>anomaly scoring</span></div><div class="kpi"><strong>4</strong><span>risk queues</span></div><div class="kpi"><strong>Audit</strong><span>operator actions</span></div>`;
    if ($('#securityQueue')) $('#securityQueue').innerHTML = `<table class="data-table"><thead><tr><th>Signal</th><th>Risk</th><th>Evidence</th><th>Action</th></tr></thead><tbody><tr><td>Replay packet</td><td>${statusBadge('High')}</td><td>Duplicate sensor nonce at Lekki</td><td>Quarantine feed</td></tr><tr><td>Refund spike</td><td>${statusBadge('Medium')}</td><td>Operator refund rate above baseline</td><td>Require approval</td></tr><tr><td>Crowd spoofing</td><td>${statusBadge('Medium')}</td><td>Multiple reports from same device cluster</td><td>Reduce trust score</td></tr><tr><td>Plate mismatch</td><td>${statusBadge('Low')}</td><td>Entry token used by different plate</td><td>Manual review</td></tr></tbody></table>`;
  }

  function renderSovereignty() {
    if ($('#sovereignRecommendationList')) $('#sovereignRecommendationList').innerHTML = (window.PARKSWIFT_SOVEREIGN_RECOMMENDATIONS || []).map(([title, copy], index) => `<article class="sovereign-item"><span class="badge ${index < 4 ? 'premium' : ''}">Pillar ${index + 1}</span><strong style="margin-top:10px">${title}</strong><span class="muted">${copy}</span></article>`).join('');
    if ($('#envFlags')) $('#envFlags').textContent = Object.entries(envConfig()).map(([k,v]) => `${k}=${v}`).join('\n');
  }


  function renderPage() {
    renderStats();
    const page = document.body.dataset.page;
    if (page === 'home') renderHome();
    if (page === 'map') renderMap();
    if (page === 'lots') renderLotsPage();
    if (page === 'checkout') renderCheckout();
    if (page === 'pricing') renderPricing();
    if (page === 'recommendations') renderRecommendations();
    if (page === 'sensors') renderSensors();
    if (page === 'predictions') renderPredictions();
    if (page === 'operator') renderOperator();
    if (page === 'permits') renderPermits();
    if (page === 'accessibility') renderAccessibility();
    if (page === 'enforcement') renderEnforcement();
    if (page === 'corporate') renderCorporate();
    if (page === 'privacy') renderPrivacy();
    if (page === 'v2i') renderV2I();
    if (page === 'curb') renderCurb();
    if (page === 'events') renderEvents();
    if (page === 'carbon') renderCarbon();
    if (page === 'marketplace') renderMarketplace();
    if (page === 'security') renderSecurity();
    if (page === 'sovereignty') renderSovereignty();
    if (page === 'manage-lots') renderManageLots();
    if (page === 'sovereign-suite') renderSovereignSuiteCategory();
    applyFeatureFlagState();
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupChrome();
    setupSearchForms();
    setupCheckoutForm();
    setupModuleActions();
    const simulate = $('#simulateBtn');
    if (simulate) simulate.addEventListener('click', () => simulateLiveUpdate(true));
    const heatmapToggle = $('#heatmapToggle');
    if (heatmapToggle) heatmapToggle.addEventListener('click', () => {
      if (!gatePremium('Satellite congestion heatmap')) return;
      $('#heatmap')?.classList.toggle('show');
      showToast($('#heatmap')?.classList.contains('show') ? 'Premium heatmap enabled.' : 'Premium heatmap hidden.');
    });
    const aiPick = $('#aiPick');
    if (aiPick) aiPick.addEventListener('click', () => {
      if (!gatePremium('AI best-space recommendation')) return;
      const lot = getFilteredLots()[0];
      if (lot) showToast(`AI recommends ${lot.name}: best balance of availability, safety, and drive time.`);
    });
    renderPage();
    setInterval(() => {
      if (document.body.dataset.page === 'map' || document.body.dataset.page === 'home') simulateLiveUpdate(false);
    }, 10000);
  });
})();
