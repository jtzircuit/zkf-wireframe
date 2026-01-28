const VAULTS = [
  {
    id: "auto",
    name: "Zircuit Auto Vault",
    type: "auto",
    description: "Automatically allocates across selected strategies.",
    asset: "USDC",
    status: "Ongoing",
    withdrawalTime: "≈ 14 days",
    riskTier: "Moderate",
    targetApy: 7.2,
    allocationBreakdown: [
      { id: "aave", name: "Aave", weightPct: 28, metricLabel: "APY 6.1%" },
      { id: "morpho", name: "Morpho", weightPct: 26, metricLabel: "APY 6.4%" },
      { id: "monarq", name: "Monarq", weightPct: 24, metricLabel: "APY 8.1%" },
      { id: "forteus", name: "Forteus", weightPct: 22, metricLabel: "YTD +9.4%, Ann. +12.8%" },
    ],
  },
  {
    id: "aave",
    name: "Aave",
    type: "individual",
    metricType: "apy",
    apy: 5.8,
    description: "Lend USDC on Aave.",
    asset: "USDC",
    status: "Ongoing",
    withdrawalTime: "Instant",
    riskTier: "Low",
  },
  {
    id: "morpho",
    name: "Morpho",
    type: "individual",
    metricType: "apy",
    apy: 6.4,
    description: "Curated Morpho USDC vault strategy.",
    asset: "USDC",
    status: "Ongoing",
    withdrawalTime: "Instant",
    riskTier: "Low",
  },
  {
    id: "monarq",
    name: "Monarq",
    type: "individual",
    metricType: "apy",
    apy: 8.1,
    description: "Actively managed on-chain credit strategy.",
    asset: "USDC",
    status: "Ongoing",
    withdrawalTime: "≈ 7 days",
    riskTier: "Moderate",
  },
  {
    id: "forteus",
    name: "Forteus",
    type: "individual",
    metricType: "performance",
    ytd: 9.4,
    annualized: 12.8,
    description: "Performance-focused strategy.",
    asset: "USDC",
    status: "Ongoing",
    withdrawalTime: "≈ 30 days",
    riskTier: "Higher",
  },
];

const STORAGE_KEYS = {
  vaultId: "demoVaultId",
  asset: "demoAsset",
  amount: "demoAmount",
  timestamp: "demoTimestamp",
  allocation: "demoAllocation",
};

const page = document.body.dataset.page;

const $ = (selector) => document.querySelector(selector);

const DEMO_BALANCES = [
  { asset: "USDC", amount: 10000 },
  { asset: "USDT", amount: 6000 },
];

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "--";
  }
  return `${Number(value).toFixed(1)}%`;
}

function formatMoney(value) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function loadDeposit() {
  const vaultId = localStorage.getItem(STORAGE_KEYS.vaultId);
  const asset = localStorage.getItem(STORAGE_KEYS.asset);
  const amountRaw = localStorage.getItem(STORAGE_KEYS.amount);
  const timestamp = localStorage.getItem(STORAGE_KEYS.timestamp);
  return {
    vaultId,
    asset,
    amount: amountRaw ? Number(amountRaw) : 0,
    timestamp,
  };
}

function saveDeposit(vaultId, asset, amount) {
  localStorage.setItem(STORAGE_KEYS.vaultId, vaultId);
  localStorage.setItem(STORAGE_KEYS.asset, asset);
  localStorage.setItem(STORAGE_KEYS.amount, String(amount));
  localStorage.setItem(STORAGE_KEYS.timestamp, new Date().toISOString());
}

function clearDeposit() {
  localStorage.removeItem(STORAGE_KEYS.vaultId);
  localStorage.removeItem(STORAGE_KEYS.asset);
  localStorage.removeItem(STORAGE_KEYS.amount);
  localStorage.removeItem(STORAGE_KEYS.timestamp);
}

function randomWeights(count) {
  const raw = Array.from({ length: count }, () => Math.random());
  const total = raw.reduce((sum, value) => sum + value, 0);
  const normalized = raw.map((value) => Math.round((value / total) * 100));
  const diff = 100 - normalized.reduce((sum, value) => sum + value, 0);
  normalized[0] = Math.max(0, normalized[0] + diff);
  return normalized;
}

function generateAllocation() {
  const allocation = {};
  DEMO_BALANCES.forEach((balance) => {
    const weights = randomWeights(VAULTS.length);
    allocation[balance.asset] = VAULTS.map((vault, index) => ({
      vaultId: vault.id,
      weightPct: weights[index],
    }));
  });
  return allocation;
}

function loadAllocation() {
  const raw = localStorage.getItem(STORAGE_KEYS.allocation);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (error) {
      localStorage.removeItem(STORAGE_KEYS.allocation);
    }
  }
  const allocation = generateAllocation();
  localStorage.setItem(STORAGE_KEYS.allocation, JSON.stringify(allocation));
  return allocation;
}

function metricMarkup(vault) {
  if (vault.type === "auto") {
    return `
      <div class="metric-row">
        <span>Target APY</span>
        <span class="metric-value">${formatPercent(vault.targetApy)}</span>
      </div>
    `;
  }

  if (vault.metricType === "apy") {
    return `
      <div class="metric-row">
        <span>Net APY</span>
        <span class="metric-value">${formatPercent(vault.apy)}</span>
      </div>
    `;
  }

  return `
    <div class="metric-row">
      <span>YTD</span>
      <span class="metric-value">${formatPercent(vault.ytd)}</span>
    </div>
    <div class="metric-row">
      <span>Annualized</span>
      <span class="metric-value">${formatPercent(vault.annualized)}</span>
    </div>
  `;
}

function allocationList(vault) {
  return vault.allocationBreakdown
    .map(
      (item) => `
        <div class="list-item">
          <div>
            <strong>${item.name}</strong>
            <div>${item.metricLabel}</div>
          </div>
          <div><strong>${item.weightPct}%</strong></div>
        </div>
      `
    )
    .join("");
}

function renderEarn() {
  const container = $("#app");
  container.innerHTML = `
    <section class="page-header">
      <h1>Earn</h1>
      <p>Pick a vault that matches your goals and risk preference.</p>
    </section>
    <section class="grid" id="vault-grid"></section>
  `;

  const grid = $("#vault-grid");
  VAULTS.forEach((vault, index) => {
    const card = document.createElement("div");
    card.className = "card clickable";
    card.innerHTML = `
      ${index === 0 ? '<span class="badge">Auto allocation</span>' : ""}
      <h3>${vault.name}</h3>
      <div class="meta">
        <span>${vault.description}</span>
      </div>
      <div class="meta">
        <span>Asset: <strong>${vault.asset}</strong></span>
        <span>Status: <strong>${vault.status}</strong></span>
      </div>
      <div class="meta">
        <span>Assets: <strong>USD</strong></span>
      </div>
      <div class="metric">
        ${metricMarkup(vault)}
      </div>
    `;
    card.addEventListener("click", () => {
      window.location.href = `vault.html?id=${vault.id}`;
    });
    grid.appendChild(card);
  });
}

function renderVault() {
  const vaultId = getQueryParam("id");
  const vault = VAULTS.find((item) => item.id === vaultId);
  const container = $("#app");

  if (!vault) {
    container.innerHTML = `
      <section class="page-header">
        <h1>Vault not found</h1>
        <p>We couldn't locate that vault. Head back to the marketplace.</p>
      </section>
      <a class="link-btn" href="earn.html">Back to Earn</a>
    `;
    return;
  }

  container.innerHTML = `
    <section class="page-header">
      <h1>${vault.name}</h1>
      <p>Review strategy details and simulate a demo deposit.</p>
    </section>
    <section class="columns">
      <div>
        <div class="section">
          <h2>Overview</h2>
          <p>${vault.description} This vault is built for steady growth with clear withdrawal expectations. Review the highlights below before depositing.</p>
        </div>
        <div class="section" style="margin-top:16px;">
          <h2>Key information</h2>
          <div class="key-info">
            <div>Asset: <strong>${vault.asset}</strong></div>
            <div>Risk tier: <strong>${vault.riskTier}</strong></div>
            <div>Withdrawal time: <strong>${vault.withdrawalTime}</strong></div>
            <div>Status: <strong>${vault.status}</strong></div>
          </div>
        </div>
        <div class="section" style="margin-top:16px;" id="detail-section"></div>
      </div>
      <div class="section deposit-panel">
        <h2>Deposit</h2>
        <label for="asset-select">Asset</label>
        <select id="asset-select">
          <option>USDC</option>
          <option>USDT</option>
        </select>
        <label for="amount-input" style="margin-top:12px;">Amount</label>
        <input id="amount-input" type="number" placeholder="0.00" min="0" step="0.01" />
        <div class="quick-buttons" style="margin-top:12px;">
          <button type="button" data-quick="0.25">25%</button>
          <button type="button" data-quick="0.5">50%</button>
          <button type="button" data-quick="0.75">75%</button>
          <button type="button" data-quick="max">Max</button>
        </div>
        <button class="primary-btn" id="deposit-btn" style="margin-top:16px;">Deposit</button>
        <a class="link-btn" href="portfolio.html">View Portfolio</a>
      </div>
    </section>
  `;

  const detailSection = $("#detail-section");
  if (vault.type === "auto") {
    detailSection.innerHTML = `
      <h2>Allocation breakdown (read-only)</h2>
      <div class="list">${allocationList(vault)}</div>
    `;
  } else {
    detailSection.innerHTML = `
      <h2>Strategy details</h2>
      <div class="list">
        <div class="list-item">
          <div><strong>Risk tier</strong></div>
          <div>${vault.riskTier}</div>
        </div>
        <div class="list-item">
          <div><strong>Withdrawal time</strong></div>
          <div>${vault.withdrawalTime}</div>
        </div>
        <div class="list-item">
          <div><strong>Note</strong></div>
          <div>Returns are variable and based on market conditions.</div>
        </div>
      </div>
    `;
  }

  const amountInput = $("#amount-input");
  const assetSelect = $("#asset-select");
  document.querySelectorAll("[data-quick]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const value = btn.dataset.quick;
      if (value === "max") {
        amountInput.value = "1000";
        return;
      }
      const pct = Number(value);
      amountInput.value = (1000 * pct).toFixed(2);
    });
  });

  $("#deposit-btn").addEventListener("click", () => {
    const amount = Number(amountInput.value);
    if (!amount || amount <= 0) {
      alert("Enter a deposit amount greater than 0.");
      return;
    }
    saveDeposit(vault.id, assetSelect.value, amount);
    window.location.href = "portfolio.html";
  });
}

function renderPortfolio() {
  const deposit = loadDeposit();
  const vault = VAULTS.find((item) => item.id === deposit.vaultId);
  const allocation = loadAllocation();
  const baseTotals = DEMO_BALANCES.reduce((acc, item) => {
    acc[item.asset] = item.amount;
    return acc;
  }, {});

  if (deposit.asset && deposit.amount) {
    baseTotals[deposit.asset] = (baseTotals[deposit.asset] || 0) + deposit.amount;
  }

  const amount = Object.values(baseTotals).reduce((sum, value) => sum + value, 0);
  const interest = amount > 0 ? 0.71 : 0;

  const container = $("#app");
  container.innerHTML = `
    <section class="page-header">
      <h1>Portfolio</h1>
      <p>Track your demo balance and underlying exposure.</p>
    </section>
    <section class="summary-cards">
      <div class="summary-card">
        <h3>Total Balance</h3>
        <p>${formatMoney(amount)}</p>
      </div>
      <div class="summary-card">
        <h3>Interest earned</h3>
        <p>${formatMoney(interest)}</p>
      </div>
    </section>
    <section class="section" style="margin-top:22px;">
      <h2>Holdings</h2>
      <table class="table">
        <thead>
          <tr>
            <th>Asset</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>USDC</td>
            <td>${formatMoney(baseTotals.USDC || 0)}</td>
          </tr>
          <tr>
            <td>USDT</td>
            <td>${formatMoney(baseTotals.USDT || 0)}</td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top:16px;">
        <button class="toggle" id="toggle-exposure">Underlying exposure</button>
        <div id="exposure-panel" style="margin-top:12px;"></div>
      </div>
    </section>
    <section class="actions">
      <a class="secondary-btn" href="earn.html">Back to Earn</a>
      <button class="secondary-btn" id="reset-demo">Reset demo</button>
    </section>
  `;

  const exposurePanel = $("#exposure-panel");
  function renderExposure(show) {
    if (!show) {
      exposurePanel.innerHTML = "";
      return;
    }
    const sections = DEMO_BALANCES.map((balance) => {
      const rows = (allocation[balance.asset] || []).map((item) => {
        const vaultInfo = VAULTS.find((entry) => entry.id === item.vaultId);
        if (!vaultInfo) {
          return "";
        }
        const amountAllocated = (balance.amount * item.weightPct) / 100;
        return `
          <div class="list-item">
            <div>
              <strong>${vaultInfo.name}</strong>
              <div>${vaultInfo.description}</div>
            </div>
            <div><strong>${item.weightPct}%</strong> · ${formatMoney(amountAllocated)}</div>
          </div>
        `;
      });
      return `
        <div class="section" style="margin-bottom:12px;">
          <h3 style="margin-top:0;">${balance.asset} allocation</h3>
          <div class="list">${rows.join("")}</div>
        </div>
      `;
    });

    const demoSection = vault
      ? `
        <div class="section" style="margin-top:12px;">
          <h3 style="margin-top:0;">Demo deposit exposure</h3>
          <div class="list">
            <div class="list-item">
              <div>
                <strong>${vault.name}</strong>
                <div>${vault.description}</div>
              </div>
              <div><strong>100%</strong> · ${formatMoney(deposit.amount || 0)}</div>
            </div>
            <div class="metric" style="border:none; padding-top:6px;">${metricMarkup(vault)}</div>
          </div>
        </div>
      `
      : `<div class="empty-state">No demo deposit yet.</div>`;

    exposurePanel.innerHTML = `${sections.join("")}${demoSection}`;
  }

  let expanded = true;
  renderExposure(expanded);
  $("#toggle-exposure").addEventListener("click", () => {
    expanded = !expanded;
    renderExposure(expanded);
    $("#toggle-exposure").textContent = expanded
      ? "Underlying exposure"
      : "Show underlying exposure";
  });

  $("#reset-demo").addEventListener("click", () => {
    clearDeposit();
    renderPortfolio();
  });
}

function highlightNav() {
  document.querySelectorAll(".nav-links a").forEach((link) => {
    if (link.dataset.page === page) {
      link.classList.add("active");
    }
  });
}

function init() {
  highlightNav();
  if (page === "earn") {
    renderEarn();
  } else if (page === "vault") {
    renderVault();
  } else if (page === "portfolio") {
    renderPortfolio();
  }
}

document.addEventListener("DOMContentLoaded", init);
