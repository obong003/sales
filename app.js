/**
 * SalesPulse Analytics — Vanilla JavaScript Single Page Dashboard
 * Features:
 * - LocalStorage persistence with sample dataset initialization
 * - Dynamic KPI metric calculations and trend indicators
 * - Multi-criteria filtering: Timeframes, Custom Dates, Category, Channel, Status, Search
 * - Interactive Chart.js charts (Timeline, Category Doughnut, Channel Bar)
 * - Leaderboard of top products
 * - Full CRUD data grid (Add, Edit, Delete, Paginate, Sort)
 * - Multi-currency conversion
 * - CSV Export
 * - Strictly NO CSS variables used
 */

(function () {
  'use strict';

  // --- Storage & Config Constants ---
  const STORAGE_KEY = 'salespulse_transactions_v2';
  const CURRENCY_KEY = 'salespulse_currency_v2';
  const QUOTA_TARGET_USD = 250000;

  const CURRENCY_RATES = {
    USD: { rate: 1.0, symbol: '$', code: 'USD' },
    EUR: { rate: 0.92, symbol: '€', code: 'EUR' },
    GBP: { rate: 0.79, symbol: '£', code: 'GBP' },
    JPY: { rate: 154.5, symbol: '¥', code: 'JPY' },
    CAD: { rate: 1.38, symbol: 'C$', code: 'CAD' }
  };

  // --- Application State ---
  let transactions = [];
  let currentCurrency = 'USD';
  let activeTimeframe = 'all'; // 'all', 'today', 'last7', 'last30', 'thisMonth', 'thisYear', 'custom'
  let customStartDate = null;
  let customEndDate = null;
  let selectedCategory = 'all';
  let selectedChannel = 'all';
  let selectedStatus = 'all';
  let searchQuery = '';
  let timelineGrouping = 'monthly'; // 'daily' or 'monthly'

  // Table pagination & sorting state
  let sortField = 'date';
  let sortAscending = false;
  let currentPage = 1;
  let pageSize = 10;
  let pendingDeleteId = null;

  // Chart.js instances
  let timelineChart = null;
  let categoryChart = null;
  let channelChart = null;

  // --- Seed Data Generator ---
  // Generates 45 realistic business sales records spread across 2026
  function getSampleSeedData() {
    return [
      {
        id: "INV-1001",
        date: "2026-11-06",
        customer: "Quantum Data Systems",
        email: "procurement@quantumdata.com",
        product: "Enterprise Cloud Suite",
        category: "Enterprise Software",
        channel: "Direct Sales",
        amount: 28500.00,
        status: "Completed",
        paymentMethod: "ACH / Bank Wire",
        notes: "3-year multi-tenant license"
      },
      {
        id: "INV-1002",
        date: "2026-11-05",
        customer: "Apex Financial Corp",
        email: "billing@apexfinancial.io",
        product: "Zero-Trust Perimeter",
        category: "Cybersecurity",
        channel: "Enterprise RFP",
        amount: 19400.00,
        status: "Completed",
        paymentMethod: "Corporate Invoice",
        notes: "SOC-2 audited security rollout"
      },
      {
        id: "INV-1003",
        date: "2026-11-04",
        customer: "HyperScale Media",
        email: "ops@hyperscale.tv",
        product: "Managed Kubernetes Fleet",
        category: "Cloud Infrastructure",
        channel: "Online / Web",
        amount: 8750.00,
        status: "Completed",
        paymentMethod: "Credit Card",
        notes: "Monthly tier autoscaling add-on"
      },
      {
        id: "INV-1004",
        date: "2026-11-03",
        customer: "Starlight Biotech",
        email: "orders@starlightbio.org",
        product: "High-Performance Workstations",
        category: "Hardware & Devices",
        channel: "Partner Network",
        amount: 34200.00,
        status: "Pending",
        paymentMethod: "ACH / Bank Wire",
        notes: "Awaiting customs release"
      },
      {
        id: "INV-1005",
        date: "2026-11-02",
        customer: "Vanguard Retail Group",
        email: "pos@vanguardretail.com",
        product: "Enterprise Cloud Suite",
        category: "Enterprise Software",
        channel: "Direct Sales",
        amount: 14200.00,
        status: "Completed",
        paymentMethod: "Stripe / Digital",
        notes: "Q4 POS migration license"
      },
      {
        id: "INV-1006",
        date: "2026-10-29",
        customer: "AeroDynamics Aerospace",
        email: "vendor-ops@aerodynamics.com",
        product: "Architecture Consulting",
        category: "Professional Services",
        channel: "Direct Sales",
        amount: 22000.00,
        status: "Completed",
        paymentMethod: "Corporate Invoice",
        notes: "Flight telemetry pipeline design"
      },
      {
        id: "INV-1007",
        date: "2026-10-26",
        customer: "Zenith Global Logistics",
        email: "it@zenithlogistics.com",
        product: "Zero-Trust Perimeter",
        category: "Cybersecurity",
        channel: "Inbound SDR",
        amount: 12500.00,
        status: "Completed",
        paymentMethod: "ACH / Bank Wire",
        notes: "Fleet-wide VPN deprecation"
      },
      {
        id: "INV-1008",
        date: "2026-10-24",
        customer: "Nexus Digital Agency",
        email: "accounts@nexusagency.co",
        product: "Developer Workstation Pro",
        category: "Hardware & Devices",
        channel: "Online / Web",
        amount: 6800.00,
        status: "Refunded",
        paymentMethod: "Credit Card",
        notes: "Client cancelled hardware purchase"
      },
      {
        id: "INV-1009",
        date: "2026-10-20",
        customer: "Crestview Health",
        email: "records@crestviewhealth.org",
        product: "Managed Kubernetes Fleet",
        category: "Cloud Infrastructure",
        channel: "Partner Network",
        amount: 16900.00,
        status: "Completed",
        paymentMethod: "ACH / Bank Wire",
        notes: "HIPAA-compliant cluster deployment"
      },
      {
        id: "INV-1010",
        date: "2026-10-16",
        customer: "Solaria Clean Energy",
        email: "finance@solariaenergy.net",
        product: "Enterprise Cloud Suite",
        category: "Enterprise Software",
        channel: "Inbound SDR",
        amount: 18200.00,
        status: "Completed",
        paymentMethod: "Stripe / Digital",
        notes: "Grid monitoring portal software"
      },
      {
        id: "INV-1011",
        date: "2026-10-12",
        customer: "BluePeak Solutions",
        email: "billing@bluepeaksol.com",
        product: "Architecture Consulting",
        category: "Professional Services",
        channel: "Direct Sales",
        amount: 15000.00,
        status: "Pending",
        paymentMethod: "Corporate Invoice",
        notes: "Sprint 2 milestone payment"
      },
      {
        id: "INV-1012",
        date: "2026-10-08",
        customer: "Orbit Interactive",
        email: "support@orbitgames.io",
        product: "Cloud Storage Backbone",
        category: "Cloud Infrastructure",
        channel: "Online / Web",
        amount: 9400.00,
        status: "Completed",
        paymentMethod: "Credit Card",
        notes: "Global CDN and petabyte bucket"
      },
      {
        id: "INV-1013",
        date: "2026-10-02",
        customer: "IronClad Security",
        email: "accounts@ironcladsec.com",
        product: "Zero-Trust Perimeter",
        category: "Cybersecurity",
        channel: "Enterprise RFP",
        amount: 38000.00,
        status: "Completed",
        paymentMethod: "ACH / Bank Wire",
        notes: "Enterprise agreement 5000 seats"
      },
      {
        id: "INV-1014",
        date: "2026-09-28",
        customer: "Lumina Studio",
        email: "production@luminastudio.art",
        product: "High-Performance Workstations",
        category: "Hardware & Devices",
        channel: "Online / Web",
        amount: 11400.00,
        status: "Completed",
        paymentMethod: "Credit Card",
        notes: "3D rendering studio upgrade"
      },
      {
        id: "INV-1015",
        date: "2026-09-22",
        customer: "Beacon Financial",
        email: "trading@beaconfin.com",
        product: "Enterprise Cloud Suite",
        category: "Enterprise Software",
        channel: "Direct Sales",
        amount: 27500.00,
        status: "Completed",
        paymentMethod: "Letter of Credit",
        notes: "High frequency analytics module"
      },
      {
        id: "INV-1016",
        date: "2026-09-17",
        customer: "Terra Nova Agriculture",
        email: "iot@terranova.farm",
        product: "Managed Kubernetes Fleet",
        category: "Cloud Infrastructure",
        channel: "Partner Network",
        amount: 7800.00,
        status: "Completed",
        paymentMethod: "Corporate Invoice",
        notes: "Drone sensor backend ingestion"
      },
      {
        id: "INV-1017",
        date: "2026-09-11",
        customer: "Metropolis Mobility",
        email: "it@metropolismobility.com",
        product: "Architecture Consulting",
        category: "Professional Services",
        channel: "Direct Sales",
        amount: 18500.00,
        status: "Completed",
        paymentMethod: "ACH / Bank Wire",
        notes: "EV fleet dispatch architecture"
      },
      {
        id: "INV-1018",
        date: "2026-09-04",
        customer: "Silverline Logistics",
        email: "support@silverline.io",
        product: "Smart Edge Sensors",
        category: "Hardware & Devices",
        channel: "Inbound SDR",
        amount: 8900.00,
        status: "Pending",
        paymentMethod: "Corporate Invoice",
        notes: "Warehouse pilot bundle"
      },
      {
        id: "INV-1019",
        date: "2026-08-30",
        customer: "Atlas Pharma",
        email: "trials@atlaspharma.com",
        product: "Zero-Trust Perimeter",
        category: "Cybersecurity",
        channel: "Enterprise RFP",
        amount: 42000.00,
        status: "Completed",
        paymentMethod: "ACH / Bank Wire",
        notes: "Clinical trial investigator security"
      },
      {
        id: "INV-1020",
        date: "2026-08-23",
        customer: "Veritas AI Labs",
        email: "cluster@veritas-ai.co",
        product: "Managed Kubernetes Fleet",
        category: "Cloud Infrastructure",
        channel: "Online / Web",
        amount: 21600.00,
        status: "Completed",
        paymentMethod: "Credit Card",
        notes: "GPU inference cluster reservation"
      },
      {
        id: "INV-1021",
        date: "2026-08-15",
        customer: "Cascade Media Group",
        email: "broadcast@cascademedia.com",
        product: "Enterprise Cloud Suite",
        category: "Enterprise Software",
        channel: "Partner Network",
        amount: 16400.00,
        status: "Refunded",
        paymentMethod: "Credit Card",
        notes: "Contract scope renegotiated"
      },
      {
        id: "INV-1022",
        date: "2026-08-08",
        customer: "Summit Financial Advisory",
        email: "wealth@summitfin.net",
        product: "Zero-Trust Perimeter",
        category: "Cybersecurity",
        channel: "Inbound SDR",
        amount: 11200.00,
        status: "Completed",
        paymentMethod: "ACH / Bank Wire",
        notes: "Advisor device encryption rollout"
      },
      {
        id: "INV-1023",
        date: "2026-07-29",
        customer: "AeroDynamics Aerospace",
        email: "vendor-ops@aerodynamics.com",
        product: "Enterprise Cloud Suite",
        category: "Enterprise Software",
        channel: "Direct Sales",
        amount: 31000.00,
        status: "Completed",
        paymentMethod: "ACH / Bank Wire",
        notes: "Simulations compute license"
      },
      {
        id: "INV-1024",
        date: "2026-07-21",
        customer: "GreenWave Eco",
        email: "hello@greenwaveeco.org",
        product: "Cloud Storage Backbone",
        category: "Cloud Infrastructure",
        channel: "Online / Web",
        amount: 4300.00,
        status: "Completed",
        paymentMethod: "Credit Card",
        notes: "Satellite imagery archive"
      },
      {
        id: "INV-1025",
        date: "2026-07-14",
        customer: "Titan Robotics",
        email: "engineering@titanrobotics.com",
        product: "Architecture Consulting",
        category: "Professional Services",
        channel: "Direct Sales",
        amount: 24000.00,
        status: "Completed",
        paymentMethod: "Corporate Invoice",
        notes: "Factory automation middleware review"
      },
      {
        id: "INV-1026",
        date: "2026-07-05",
        customer: "Pioneer Payments",
        email: "settlement@pioneerpay.com",
        product: "Zero-Trust Perimeter",
        category: "Cybersecurity",
        channel: "Enterprise RFP",
        amount: 29500.00,
        status: "Completed",
        paymentMethod: "Letter of Credit",
        notes: "PCI-DSS 4.0 validation compliance"
      },
      {
        id: "INV-1027",
        date: "2026-06-27",
        customer: "Krypton Technologies",
        email: "hardware@kryptontech.com",
        product: "High-Performance Workstations",
        category: "Hardware & Devices",
        channel: "Partner Network",
        amount: 19800.00,
        status: "Completed",
        paymentMethod: "ACH / Bank Wire",
        notes: "Engineering department hardware"
      },
      {
        id: "INV-1028",
        date: "2026-06-18",
        customer: "OmniRetail Direct",
        email: "sales@omniretail.com",
        product: "Enterprise Cloud Suite",
        category: "Enterprise Software",
        channel: "Direct Sales",
        amount: 22800.00,
        status: "Completed",
        paymentMethod: "Corporate Invoice",
        notes: "Omnichannel inventory sync engine"
      },
      {
        id: "INV-1029",
        date: "2026-06-10",
        customer: "Crestview Health",
        email: "records@crestviewhealth.org",
        product: "Zero-Trust Perimeter",
        category: "Cybersecurity",
        channel: "Direct Sales",
        amount: 14500.00,
        status: "Completed",
        paymentMethod: "ACH / Bank Wire",
        notes: "Medical center clinic security"
      },
      {
        id: "INV-1030",
        date: "2026-05-28",
        customer: "Vanguard Retail Group",
        email: "pos@vanguardretail.com",
        product: "Managed Kubernetes Fleet",
        category: "Cloud Infrastructure",
        channel: "Inbound SDR",
        amount: 15300.00,
        status: "Completed",
        paymentMethod: "Stripe / Digital",
        notes: "E-commerce promotion scaling"
      },
      {
        id: "INV-1031",
        date: "2026-05-19",
        customer: "Apex Financial Corp",
        email: "billing@apexfinancial.io",
        product: "Architecture Consulting",
        category: "Professional Services",
        channel: "Enterprise RFP",
        amount: 32000.00,
        status: "Completed",
        paymentMethod: "ACH / Bank Wire",
        notes: "Core banking modernization audit"
      },
      {
        id: "INV-1032",
        date: "2026-05-09",
        customer: "Quantum Data Systems",
        email: "procurement@quantumdata.com",
        product: "Smart Edge Sensors",
        category: "Hardware & Devices",
        channel: "Partner Network",
        amount: 13500.00,
        status: "Completed",
        paymentMethod: "Corporate Invoice",
        notes: "Server room thermal sensor telemetry"
      },
      {
        id: "INV-1033",
        date: "2026-04-25",
        customer: "Starlight Biotech",
        email: "orders@starlightbio.org",
        product: "Enterprise Cloud Suite",
        category: "Enterprise Software",
        channel: "Direct Sales",
        amount: 26000.00,
        status: "Completed",
        paymentMethod: "ACH / Bank Wire",
        notes: "Gene sequencing pipeline tool"
      },
      {
        id: "INV-1034",
        date: "2026-04-14",
        customer: "Nexus Digital Agency",
        email: "accounts@nexusagency.co",
        product: "Cloud Storage Backbone",
        category: "Cloud Infrastructure",
        channel: "Online / Web",
        amount: 5200.00,
        status: "Completed",
        paymentMethod: "Credit Card",
        notes: "Video production asset store"
      },
      {
        id: "INV-1035",
        date: "2026-04-02",
        customer: "Metropolis Mobility",
        email: "it@metropolismobility.com",
        product: "Zero-Trust Perimeter",
        category: "Cybersecurity",
        channel: "Inbound SDR",
        amount: 17600.00,
        status: "Completed",
        paymentMethod: "Corporate Invoice",
        notes: "Field technician mobile MDM"
      },
      {
        id: "INV-1036",
        date: "2026-03-24",
        customer: "HyperScale Media",
        email: "ops@hyperscale.tv",
        product: "Architecture Consulting",
        category: "Professional Services",
        channel: "Direct Sales",
        amount: 21000.00,
        status: "Completed",
        paymentMethod: "ACH / Bank Wire",
        notes: "Live streaming low-latency pipeline"
      },
      {
        id: "INV-1037",
        date: "2026-03-15",
        customer: "Zenith Global Logistics",
        email: "it@zenithlogistics.com",
        product: "Smart Edge Sensors",
        category: "Hardware & Devices",
        channel: "Partner Network",
        amount: 16500.00,
        status: "Completed",
        paymentMethod: "Letter of Credit",
        notes: "Cargo container GPS tracking"
      },
      {
        id: "INV-1038",
        date: "2026-02-28",
        customer: "Beacon Financial",
        email: "trading@beaconfin.com",
        product: "Managed Kubernetes Fleet",
        category: "Cloud Infrastructure",
        channel: "Enterprise RFP",
        amount: 36000.00,
        status: "Completed",
        paymentMethod: "ACH / Bank Wire",
        notes: "Private cloud trading engine nodes"
      },
      {
        id: "INV-1039",
        date: "2026-02-12",
        customer: "Solaria Clean Energy",
        email: "finance@solariaenergy.net",
        product: "Architecture Consulting",
        category: "Professional Services",
        channel: "Direct Sales",
        amount: 14000.00,
        status: "Completed",
        paymentMethod: "Corporate Invoice",
        notes: "Solar array SCADA integration"
      },
      {
        id: "INV-1040",
        date: "2026-01-22",
        customer: "Orbit Interactive",
        email: "support@orbitgames.io",
        product: "Developer Workstation Pro",
        category: "Hardware & Devices",
        channel: "Online / Web",
        amount: 9800.00,
        status: "Completed",
        paymentMethod: "Credit Card",
        notes: "Game studio QA testing rigs"
      },
      {
        id: "INV-1041",
        date: "2026-01-10",
        customer: "IronClad Security",
        email: "accounts@ironcladsec.com",
        product: "Enterprise Cloud Suite",
        category: "Enterprise Software",
        channel: "Direct Sales",
        amount: 24500.00,
        status: "Completed",
        paymentMethod: "ACH / Bank Wire",
        notes: "Threat intelligence feed connector"
      }
    ];
  }

  // --- Initialization ---
  function init() {
    loadTransactions();
    loadCurrencyPreference();
    setupEventListeners();
    applyFiltersAndRender();
  }

  // --- Storage Management ---
  function loadTransactions() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        transactions = JSON.parse(stored);
      } else {
        transactions = getSampleSeedData();
        saveTransactions();
      }
    } catch (e) {
      console.warn('Failed to parse localStorage, resetting to seed data.', e);
      transactions = getSampleSeedData();
      saveTransactions();
    }
  }

  function saveTransactions() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (e) {
      showToast('Error saving data to local storage: ' + e.message, 'error');
    }
  }

  function resetSampleData() {
    transactions = getSampleSeedData();
    saveTransactions();
    currentPage = 1;
    applyFiltersAndRender();
    showToast('Sample dataset restored successfully!', 'success');
  }

  function loadCurrencyPreference() {
    const saved = localStorage.getItem(CURRENCY_KEY);
    if (saved && CURRENCY_RATES[saved]) {
      currentCurrency = saved;
      const select = document.getElementById('currencySelect');
      if (select) select.value = saved;
    }
    updateFormCurrencyPrefix();
  }

  function updateFormCurrencyPrefix() {
    const prefixEl = document.getElementById('formCurrencyPrefix');
    if (prefixEl) {
      prefixEl.textContent = CURRENCY_RATES[currentCurrency].symbol;
    }
  }

  // --- Currency Formatting Utility ---
  function formatCurrency(amountUSD) {
    const rateInfo = CURRENCY_RATES[currentCurrency] || CURRENCY_RATES.USD;
    const converted = amountUSD * rateInfo.rate;

    let fractionDigits = (currentCurrency === 'JPY') ? 0 : 2;
    const formattedNum = converted.toLocaleString(undefined, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits
    });

    return rateInfo.symbol + formattedNum;
  }

  // --- Filtering Engine ---
  function getFilteredTransactions() {
    const now = new Date('2026-11-06T12:00:00Z'); // anchor to current dashboard timeline

    return transactions.filter(item => {
      // 1. Timeframe Filter
      const itemDate = new Date(item.date + 'T00:00:00Z');

      if (activeTimeframe === 'today') {
        const todayStr = '2026-11-06';
        if (item.date !== todayStr) return false;
      } else if (activeTimeframe === 'last7') {
        const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (itemDate < cutoff) return false;
      } else if (activeTimeframe === 'last30') {
        const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (itemDate < cutoff) return false;
      } else if (activeTimeframe === 'thisMonth') {
        if (itemDate.getUTCFullYear() !== 2026 || itemDate.getUTCMonth() !== 10) return false; // Month 10 = Nov
      } else if (activeTimeframe === 'thisYear') {
        if (itemDate.getUTCFullYear() !== 2026) return false;
      } else if (activeTimeframe === 'custom') {
        if (customStartDate) {
          const start = new Date(customStartDate + 'T00:00:00Z');
          if (itemDate < start) return false;
        }
        if (customEndDate) {
          const end = new Date(customEndDate + 'T23:59:59Z');
          if (itemDate > end) return false;
        }
      }

      // 2. Category Filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // 3. Channel Filter
      if (selectedChannel !== 'all' && item.channel !== selectedChannel) {
        return false;
      }

      // 4. Status Filter
      if (selectedStatus !== 'all' && item.status !== selectedStatus) {
        return false;
      }

      // 5. Search Query Filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchesCustomer = item.customer && item.customer.toLowerCase().includes(q);
        const matchesProduct = item.product && item.product.toLowerCase().includes(q);
        const matchesInvoice = item.id && item.id.toLowerCase().includes(q);
        const matchesEmail = item.email && item.email.toLowerCase().includes(q);
        const matchesNotes = item.notes && item.notes.toLowerCase().includes(q);
        if (!matchesCustomer && !matchesProduct && !matchesInvoice && !matchesEmail && !matchesNotes) {
          return false;
        }
      }

      return true;
    });
  }

  // --- Metrics Calculation & KPI Rendering ---
  function renderMetrics(filtered) {
    let totalRevenue = 0;
    let completedCount = 0;
    let pendingCount = 0;
    let refundedTotal = 0;

    filtered.forEach(item => {
      const amt = Number(item.amount) || 0;
      if (item.status === 'Completed') {
        totalRevenue += amt;
        completedCount++;
      } else if (item.status === 'Pending') {
        pendingCount++;
      } else if (item.status === 'Refunded') {
        refundedTotal += amt;
      }
    });

    const netProfit = Math.max(0, (totalRevenue * 0.72) - (refundedTotal * 0.15));
    const profitMarginPercent = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;
    const aov = completedCount > 0 ? (totalRevenue / completedCount) : 0;

    // Quota Attainment
    const quotaTarget = QUOTA_TARGET_USD;
    const quotaAttainment = Math.min(100, (totalRevenue / quotaTarget) * 100);
    const quotaRemaining = Math.max(0, quotaTarget - totalRevenue);

    // Update KPI UI
    document.getElementById('kpiRevenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('kpiProfit').textContent = formatCurrency(netProfit);
    document.getElementById('kpiProfitMargin').textContent = `${profitMarginPercent}% margin`;
    document.getElementById('kpiOrders').textContent = completedCount.toLocaleString();
    document.getElementById('kpiPendingCount').textContent = `${pendingCount} pending`;
    document.getElementById('kpiAov').textContent = formatCurrency(aov);
    document.getElementById('kpiQuotaPercent').textContent = `${quotaAttainment.toFixed(1)}%`;
    document.getElementById('kpiQuotaTarget').textContent = `Target: ${formatCurrency(quotaTarget)}`;
    document.getElementById('kpiQuotaProgressBar').style.width = `${quotaAttainment.toFixed(1)}%`;
    document.getElementById('kpiQuotaSub').textContent = `Remaining to target: ${formatCurrency(quotaRemaining)}`;
  }

  // --- Chart 1: Revenue & Profit Trajectory ---
  function renderTimelineChart(filtered) {
    const ctx = document.getElementById('revenueTimelineChart');
    if (!ctx) return;

    // Aggregate by group (monthly or daily)
    const dataMap = {};

    // Sort ascending by date for timeline
    const sorted = [...filtered].sort((a, b) => new Date(a.date) - new Date(b.date));

    sorted.forEach(item => {
      if (item.status !== 'Completed') return;
      const amt = Number(item.amount) || 0;
      let key = item.date;

      if (timelineGrouping === 'monthly') {
        key = item.date.substring(0, 7); // 'YYYY-MM'
      }

      if (!dataMap[key]) {
        dataMap[key] = { revenue: 0, profit: 0, count: 0 };
      }
      dataMap[key].revenue += amt;
      dataMap[key].profit += (amt * 0.70);
      dataMap[key].count += 1;
    });

    const labels = Object.keys(dataMap);
    // Format labels nicely
    const formattedLabels = labels.map(l => {
      if (timelineGrouping === 'monthly') {
        const parts = l.split('-');
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const mIdx = parseInt(parts[1], 10) - 1;
        return `${monthNames[mIdx]} '${parts[0].slice(-2)}`;
      } else {
        const d = new Date(l + 'T00:00:00Z');
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      }
    });

    const rateInfo = CURRENCY_RATES[currentCurrency] || CURRENCY_RATES.USD;
    const revenueData = labels.map(k => (dataMap[k].revenue * rateInfo.rate));
    const profitData = labels.map(k => (dataMap[k].profit * rateInfo.rate));

    if (timelineChart) {
      timelineChart.destroy();
    }

    if (typeof Chart === 'undefined') {
      ctx.parentElement.innerHTML = '<div style="color: #9ca3af; text-align: center; padding: 20px;">Chart library loading...</div>';
      return;
    }

    timelineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: formattedLabels.length ? formattedLabels : ['No Data'],
        datasets: [
          {
            label: 'Revenue',
            data: revenueData.length ? revenueData : [0],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
            borderWidth: 2.5,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: '#3b82f6',
            pointBorderColor: '#121826',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Est. Net Profit',
            data: profitData.length ? profitData : [0],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.05)',
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0.35,
            fill: false,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#121826',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#cbd5e1',
              font: { size: 12, family: 'inherit', weight: 500 },
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 16
            }
          },
          tooltip: {
            backgroundColor: '#182236',
            titleColor: '#f9fafb',
            bodyColor: '#e5e7eb',
            borderColor: '#2b3a58',
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            callbacks: {
              label: function (context) {
                return ` ${context.dataset.label}: ${rateInfo.symbol}${context.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.04)',
              tickColor: 'transparent'
            },
            ticks: {
              color: '#9ca3af',
              font: { size: 11 }
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
              tickColor: 'transparent'
            },
            ticks: {
              color: '#9ca3af',
              font: { size: 11 },
              callback: function (val) {
                if (val >= 1000) {
                  return rateInfo.symbol + (val / 1000).toFixed(0) + 'k';
                }
                return rateInfo.symbol + val;
              }
            }
          }
        }
      }
    });
  }

  // --- Chart 2: Category Breakdown Doughnut ---
  function renderCategoryChart(filtered) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    const catTotals = {};
    filtered.forEach(item => {
      if (item.status === 'Completed') {
        const cat = item.category || 'Other';
        catTotals[cat] = (catTotals[cat] || 0) + Number(item.amount || 0);
      }
    });

    const categories = Object.keys(catTotals);
    const rateInfo = CURRENCY_RATES[currentCurrency] || CURRENCY_RATES.USD;
    const amounts = categories.map(c => catTotals[c] * rateInfo.rate);

    const categoryColors = [
      '#3b82f6', // Blue
      '#10b981', // Emerald
      '#8b5cf6', // Purple
      '#f59e0b', // Amber
      '#06b6d4', // Cyan
      '#ec4899', // Pink
      '#64748b'  // Slate
    ];

    if (categoryChart) {
      categoryChart.destroy();
    }

    if (typeof Chart === 'undefined') return;

    categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categories.length ? categories : ['No Data'],
        datasets: [{
          data: amounts.length ? amounts : [1],
          backgroundColor: categories.length ? categoryColors.slice(0, categories.length) : ['#24324a'],
          borderColor: '#121826',
          borderWidth: 3,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#cbd5e1',
              font: { size: 11 },
              boxWidth: 10,
              padding: 12
            }
          },
          tooltip: {
            backgroundColor: '#182236',
            titleColor: '#f9fafb',
            bodyColor: '#e5e7eb',
            borderColor: '#2b3a58',
            borderWidth: 1,
            callbacks: {
              label: function (ctxItem) {
                const total = amounts.reduce((a, b) => a + b, 0);
                const val = ctxItem.parsed || 0;
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                return ` ${ctxItem.label}: ${rateInfo.symbol}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  // --- Chart 3: Sales by Channel Bar Chart ---
  function renderChannelChart(filtered) {
    const ctx = document.getElementById('channelChart');
    if (!ctx) return;

    const channelTotals = {};
    filtered.forEach(item => {
      if (item.status === 'Completed') {
        const ch = item.channel || 'Unspecified';
        channelTotals[ch] = (channelTotals[ch] || 0) + Number(item.amount || 0);
      }
    });

    const channels = Object.keys(channelTotals);
    const rateInfo = CURRENCY_RATES[currentCurrency] || CURRENCY_RATES.USD;
    const channelAmounts = channels.map(c => channelTotals[c] * rateInfo.rate);

    if (channelChart) {
      channelChart.destroy();
    }

    if (typeof Chart === 'undefined') return;

    channelChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: channels.length ? channels : ['No Data'],
        datasets: [{
          label: 'Revenue by Channel',
          data: channelAmounts.length ? channelAmounts : [0],
          backgroundColor: [
            'rgba(59, 130, 246, 0.85)',
            'rgba(16, 185, 129, 0.85)',
            'rgba(139, 92, 246, 0.85)',
            'rgba(245, 158, 11, 0.85)',
            'rgba(6, 182, 212, 0.85)'
          ],
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#182236',
            titleColor: '#f9fafb',
            bodyColor: '#e5e7eb',
            borderColor: '#2b3a58',
            borderWidth: 1,
            callbacks: {
              label: function (ctxItem) {
                return ` Revenue: ${rateInfo.symbol}${ctxItem.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#9ca3af',
              font: { size: 11 }
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
              tickColor: 'transparent'
            },
            ticks: {
              color: '#9ca3af',
              font: { size: 11 },
              callback: function (val) {
                if (val >= 1000) {
                  return rateInfo.symbol + (val / 1000).toFixed(0) + 'k';
                }
                return rateInfo.symbol + val;
              }
            }
          }
        }
      }
    });
  }

  // --- Top Products Leaderboard ---
  function renderTopProducts(filtered) {
    const container = document.getElementById('topProductsList');
    if (!container) return;

    const productMap = {};
    let totalCompletedRevenue = 0;

    filtered.forEach(item => {
      if (item.status === 'Completed') {
        const prod = item.product || 'Unknown';
        const amt = Number(item.amount) || 0;
        totalCompletedRevenue += amt;

        if (!productMap[prod]) {
          productMap[prod] = { name: prod, revenue: 0, count: 0, category: item.category };
        }
        productMap[prod].revenue += amt;
        productMap[prod].count += 1;
      }
    });

    const sortedProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue);

    if (sortedProducts.length === 0) {
      container.innerHTML = '<div style="color: #9ca3af; text-align: center; padding: 40px;">No completed transactions to rank.</div>';
      return;
    }

    const maxRevenue = sortedProducts[0].revenue || 1;

    let html = '';
    sortedProducts.slice(0, 6).forEach((p, idx) => {
      const rank = idx + 1;
      const rankClass = rank === 1 ? 'rank-1' : (rank === 2 ? 'rank-2' : (rank === 3 ? 'rank-3' : ''));
      const percentOfMax = ((p.revenue / maxRevenue) * 100).toFixed(0);
      const contributionPercent = totalCompletedRevenue > 0 ? ((p.revenue / totalCompletedRevenue) * 100).toFixed(1) : 0;

      html += `
        <div class="leaderboard-item">
          <div class="leaderboard-rank ${rankClass}">#${rank}</div>
          <div class="leaderboard-details">
            <div class="leaderboard-name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</div>
            <div class="leaderboard-meta">
              <span>${escapeHtml(p.category || 'General')}</span>
              <span>&bull;</span>
              <span>${p.count} deals closed</span>
              <span>&bull;</span>
              <span>${contributionPercent}% of revenue</span>
            </div>
            <div class="leaderboard-bar-bg">
              <div class="leaderboard-bar-fill" style="width: ${percentOfMax}%;"></div>
            </div>
          </div>
          <div class="leaderboard-amount">${formatCurrency(p.revenue)}</div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // --- Transactions Ledger Table ---
  function renderTable(filtered) {
    const tbody = document.getElementById('salesTableBody');
    const emptyState = document.getElementById('tableEmptyState');
    const recordsCountBadge = document.getElementById('recordsCountBadge');
    const paginationInfo = document.getElementById('paginationInfo');
    const paginationControls = document.getElementById('paginationControls');

    recordsCountBadge.textContent = `${filtered.length} record${filtered.length === 1 ? '' : 's'}`;

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      emptyState.style.display = 'flex';
      paginationInfo.textContent = 'Showing 0 of 0 entries';
      paginationControls.innerHTML = '';
      return;
    }

    emptyState.style.display = 'none';

    // Sort filtered data
    const sorted = [...filtered].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'amount') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else if (sortField === 'date') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else {
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
      }

      if (valA < valB) return sortAscending ? -1 : 1;
      if (valA > valB) return sortAscending ? 1 : -1;
      return 0;
    });

    // Pagination calculations
    const totalPages = Math.ceil(sorted.length / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * pageSize;
    const paginatedItems = sorted.slice(startIndex, startIndex + pageSize);

    // Build Table Rows
    let rowsHtml = '';
    paginatedItems.forEach(item => {
      const statusClass = item.status === 'Completed'
        ? 'status-completed'
        : (item.status === 'Pending' ? 'status-pending' : 'status-refunded');

      rowsHtml += `
        <tr>
          <td><span class="table-id-badge">${escapeHtml(item.id)}</span></td>
          <td style="white-space: nowrap;">${formatDateDisplay(item.date)}</td>
          <td>
            <div class="customer-cell">
              <span class="customer-name">${escapeHtml(item.customer)}</span>
              ${item.email ? `<span class="customer-email">${escapeHtml(item.email)}</span>` : ''}
            </div>
          </td>
          <td>${escapeHtml(item.product)}</td>
          <td><span style="font-size: 12px; color: #cbd5e1;">${escapeHtml(item.category)}</span></td>
          <td><span style="font-size: 12px; color: #9ca3af;">${escapeHtml(item.channel)}</span></td>
          <td class="text-right table-amount">${formatCurrency(item.amount)}</td>
          <td><span class="status-pill ${statusClass}">${escapeHtml(item.status)}</span></td>
          <td class="text-center">
            <div class="table-actions">
              <button class="table-icon-btn edit-sale-btn" data-id="${escapeHtml(item.id)}" title="Edit transaction">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="table-icon-btn delete-btn delete-sale-btn" data-id="${escapeHtml(item.id)}" title="Delete transaction">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = rowsHtml;

    // Update Pagination Info
    const startNum = startIndex + 1;
    const endNum = Math.min(startIndex + pageSize, sorted.length);
    paginationInfo.textContent = `Showing ${startNum} to ${endNum} of ${sorted.length} entries`;

    // Render Pagination Controls
    renderPaginationControls(totalPages);
  }

  function renderPaginationControls(totalPages) {
    const container = document.getElementById('paginationControls');
    if (!container) return;

    let html = `
      <button class="page-btn" id="prevPageBtn" ${currentPage === 1 ? 'disabled' : ''}>&lsaquo;</button>
    `;

    for (let p = 1; p <= totalPages; p++) {
      if (
        p === 1 ||
        p === totalPages ||
        (p >= currentPage - 1 && p <= currentPage + 1)
      ) {
        html += `<button class="page-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
      } else if (
        (p === currentPage - 2 && p > 1) ||
        (p === currentPage + 2 && p < totalPages)
      ) {
        html += `<span style="padding: 0 4px; color: #6b7280;">...</span>`;
      }
    }

    html += `
      <button class="page-btn" id="nextPageBtn" ${currentPage === totalPages ? 'disabled' : ''}>&rsaquo;</button>
    `;

    container.innerHTML = html;
  }

  // --- Master Apply Filters & Render View ---
  function applyFiltersAndRender() {
    const filtered = getFilteredTransactions();
    renderMetrics(filtered);
    renderTimelineChart(filtered);
    renderCategoryChart(filtered);
    renderChannelChart(filtered);
    renderTopProducts(filtered);
    renderTable(filtered);
  }

  // --- CRUD Modal Actions ---
  function openAddSaleModal() {
    document.getElementById('modalTitle').textContent = 'Record New Transaction';
    document.getElementById('saleIdInput').value = '';
    document.getElementById('customerNameInput').value = '';
    document.getElementById('customerEmailInput').value = '';
    document.getElementById('productNameInput').value = '';
    document.getElementById('categoryInput').value = 'Enterprise Software';
    document.getElementById('saleAmountInput').value = '';
    document.getElementById('saleDateInput').value = new Date().toISOString().split('T')[0];
    document.getElementById('channelInput').value = 'Direct Sales';
    document.getElementById('statusInput').value = 'Completed';
    document.getElementById('paymentMethodInput').value = 'ACH / Bank Wire';
    document.getElementById('notesInput').value = '';

    updateFormCurrencyPrefix();
    document.getElementById('saleModal').style.display = 'flex';
  }

  function openEditSaleModal(id) {
    const sale = transactions.find(t => t.id === id);
    if (!sale) return;

    document.getElementById('modalTitle').textContent = `Edit Transaction ${sale.id}`;
    document.getElementById('saleIdInput').value = sale.id;
    document.getElementById('customerNameInput').value = sale.customer || '';
    document.getElementById('customerEmailInput').value = sale.email || '';
    document.getElementById('productNameInput').value = sale.product || '';
    document.getElementById('categoryInput').value = sale.category || 'Enterprise Software';
    document.getElementById('saleAmountInput').value = sale.amount || '';
    document.getElementById('saleDateInput').value = sale.date || '';
    document.getElementById('channelInput').value = sale.channel || 'Direct Sales';
    document.getElementById('statusInput').value = sale.status || 'Completed';
    document.getElementById('paymentMethodInput').value = sale.paymentMethod || 'ACH / Bank Wire';
    document.getElementById('notesInput').value = sale.notes || '';

    updateFormCurrencyPrefix();
    document.getElementById('saleModal').style.display = 'flex';
  }

  function closeSaleModal() {
    document.getElementById('saleModal').style.display = 'none';
  }

  function handleSaveSale(e) {
    e.preventDefault();

    const existingId = document.getElementById('saleIdInput').value;
    const customer = document.getElementById('customerNameInput').value.trim();
    const email = document.getElementById('customerEmailInput').value.trim();
    const product = document.getElementById('productNameInput').value.trim();
    const category = document.getElementById('categoryInput').value;
    const amountVal = parseFloat(document.getElementById('saleAmountInput').value);
    const date = document.getElementById('saleDateInput').value;
    const channel = document.getElementById('channelInput').value;
    const status = document.getElementById('statusInput').value;
    const paymentMethod = document.getElementById('paymentMethodInput').value;
    const notes = document.getElementById('notesInput').value.trim();

    if (!customer || !product || isNaN(amountVal) || !date) {
      showToast('Please fill in all required fields accurately.', 'error');
      return;
    }

    if (existingId) {
      // Edit mode
      const idx = transactions.findIndex(t => t.id === existingId);
      if (idx !== -1) {
        transactions[idx] = {
          ...transactions[idx],
          customer,
          email,
          product,
          category,
          amount: amountVal,
          date,
          channel,
          status,
          paymentMethod,
          notes
        };
        saveTransactions();
        closeSaleModal();
        applyFiltersAndRender();
        showToast(`Transaction ${existingId} updated successfully!`, 'success');
      }
    } else {
      // Add mode - generate new Invoice ID
      const newInvoiceId = generateNextInvoiceId();
      const newRecord = {
        id: newInvoiceId,
        customer,
        email,
        product,
        category,
        amount: amountVal,
        date,
        channel,
        status,
        paymentMethod,
        notes
      };

      transactions.unshift(newRecord);
      saveTransactions();
      closeSaleModal();
      currentPage = 1;
      applyFiltersAndRender();
      showToast(`New sale ${newInvoiceId} recorded successfully!`, 'success');
    }
  }

  function generateNextInvoiceId() {
    let maxNum = 1000;
    transactions.forEach(t => {
      const match = t.id && t.id.match(/^INV-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `INV-${maxNum + 1}`;
  }

  function promptDeleteSale(id) {
    pendingDeleteId = id;
    document.getElementById('deleteTargetInvoice').textContent = id;
    document.getElementById('deleteConfirmModal').style.display = 'flex';
  }

  function closeDeleteModal() {
    pendingDeleteId = null;
    document.getElementById('deleteConfirmModal').style.display = 'none';
  }

  function confirmDeleteSale() {
    if (!pendingDeleteId) return;

    transactions = transactions.filter(t => t.id !== pendingDeleteId);
    saveTransactions();
    closeDeleteModal();
    applyFiltersAndRender();
    showToast('Transaction permanently deleted.', 'info');
  }

  // --- Export to CSV ---
  function exportToCsv() {
    const filtered = getFilteredTransactions();
    if (filtered.length === 0) {
      showToast('No transaction data to export.', 'error');
      return;
    }

    const headers = [
      'Invoice #',
      'Date',
      'Customer',
      'Email',
      'Product',
      'Category',
      'Sales Channel',
      'Amount (USD)',
      'Payment Status',
      'Payment Method',
      'Notes'
    ];

    const rows = filtered.map(t => [
      `"${(t.id || '').replace(/"/g, '""')}"`,
      `"${(t.date || '').replace(/"/g, '""')}"`,
      `"${(t.customer || '').replace(/"/g, '""')}"`,
      `"${(t.email || '').replace(/"/g, '""')}"`,
      `"${(t.product || '').replace(/"/g, '""')}"`,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      `"${(t.channel || '').replace(/"/g, '""')}"`,
      `"${(t.amount || 0)}"`,
      `"${(t.status || '').replace(/"/g, '""')}"`,
      `"${(t.paymentMethod || '').replace(/"/g, '""')}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `salespulse_export_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${filtered.length} sales to CSV!`, 'success');
  }

  // --- Toast Notifications ---
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    } else {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }

    toast.innerHTML = `${iconSvg} <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-fade-out');
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 300);
    }, 3500);
  }

  // --- Helper: Escape HTML string ---
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00Z');
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Currency Selector
    const currencySelect = document.getElementById('currencySelect');
    if (currencySelect) {
      currencySelect.addEventListener('change', (e) => {
        currentCurrency = e.target.value;
        localStorage.setItem(CURRENCY_KEY, currentCurrency);
        updateFormCurrencyPrefix();
        applyFiltersAndRender();
        showToast(`Currency changed to ${currentCurrency} (${CURRENCY_RATES[currentCurrency].symbol})`, 'info');
      });
    }

    // Reset Sample Data Button
    document.getElementById('resetDemoBtn').addEventListener('click', () => {
      if (confirm('Restore the default sample dataset? Any unsaved changes will be replaced.')) {
        resetSampleData();
      }
    });

    // Export CSV Button
    document.getElementById('exportCsvBtn').addEventListener('click', exportToCsv);

    // Add New Sale Button
    document.getElementById('openAddModalBtn').addEventListener('click', openAddSaleModal);

    // Modal Form & Close
    document.getElementById('saleForm').addEventListener('submit', handleSaveSale);
    document.getElementById('closeModalBtn').addEventListener('click', closeSaleModal);
    document.getElementById('cancelModalBtn').addEventListener('click', closeSaleModal);

    // Delete Confirmation Modal
    document.getElementById('closeDeleteModalBtn').addEventListener('click', closeDeleteModal);
    document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDeleteSale);

    // Close modals on Escape key or outside click
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeSaleModal();
        closeDeleteModal();
      }
    });

    document.getElementById('saleModal').addEventListener('click', (e) => {
      if (e.target.id === 'saleModal') closeSaleModal();
    });

    document.getElementById('deleteConfirmModal').addEventListener('click', (e) => {
      if (e.target.id === 'deleteConfirmModal') closeDeleteModal();
    });

    // Timeframe Presets
    const presetContainer = document.getElementById('timeframePresets');
    presetContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.preset-btn');
      if (!btn) return;

      presetContainer.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      activeTimeframe = btn.dataset.timeframe;
      const customContainer = document.getElementById('customDateContainer');

      if (activeTimeframe === 'custom') {
        customContainer.style.display = 'flex';
      } else {
        customContainer.style.display = 'none';
      }

      currentPage = 1;
      applyFiltersAndRender();
    });

    // Custom Date Range Inputs
    const startInput = document.getElementById('startDateInput');
    const endInput = document.getElementById('endDateInput');

    startInput.addEventListener('change', (e) => {
      customStartDate = e.target.value;
      currentPage = 1;
      applyFiltersAndRender();
    });

    endInput.addEventListener('change', (e) => {
      customEndDate = e.target.value;
      currentPage = 1;
      applyFiltersAndRender();
    });

    // Category Filter Dropdown
    document.getElementById('categoryFilter').addEventListener('change', (e) => {
      selectedCategory = e.target.value;
      currentPage = 1;
      applyFiltersAndRender();
    });

    // Channel Filter Dropdown
    document.getElementById('channelFilter').addEventListener('change', (e) => {
      selectedChannel = e.target.value;
      currentPage = 1;
      applyFiltersAndRender();
    });

    // Status Filter Dropdown
    document.getElementById('statusFilter').addEventListener('change', (e) => {
      selectedStatus = e.target.value;
      currentPage = 1;
      applyFiltersAndRender();
    });

    // Search Input
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');

    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
      currentPage = 1;
      applyFiltersAndRender();
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.style.display = 'none';
      currentPage = 1;
      applyFiltersAndRender();
    });

    // Timeline Grouping Toggle (Day / Month)
    const groupingPills = document.getElementById('timelineGrouping');
    groupingPills.addEventListener('click', (e) => {
      const btn = e.target.closest('.pill-btn');
      if (!btn) return;
      groupingPills.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      timelineGrouping = btn.dataset.group;
      renderTimelineChart(getFilteredTransactions());
    });

    // Page Size Select
    document.getElementById('pageSizeSelect').addEventListener('change', (e) => {
      pageSize = parseInt(e.target.value, 10);
      currentPage = 1;
      renderTable(getFilteredTransactions());
    });

    // Reset Filters from Empty State
    document.getElementById('resetFiltersEmptyBtn').addEventListener('click', () => {
      selectedCategory = 'all';
      selectedChannel = 'all';
      selectedStatus = 'all';
      searchQuery = '';
      activeTimeframe = 'all';
      customStartDate = null;
      customEndDate = null;

      document.getElementById('categoryFilter').value = 'all';
      document.getElementById('channelFilter').value = 'all';
      document.getElementById('statusFilter').value = 'all';
      document.getElementById('searchInput').value = '';
      document.getElementById('clearSearchBtn').style.display = 'none';
      document.getElementById('customDateContainer').style.display = 'none';

      presetContainer.querySelectorAll('.preset-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.timeframe === 'all');
      });

      currentPage = 1;
      applyFiltersAndRender();
      showToast('Filters reset to default.', 'info');
    });

    // Table Header Sorting
    const salesTable = document.getElementById('salesTable');
    salesTable.querySelector('thead').addEventListener('click', (e) => {
      const th = e.target.closest('th.sortable');
      if (!th) return;

      const field = th.dataset.sort;
      if (sortField === field) {
        sortAscending = !sortAscending;
      } else {
        sortField = field;
        sortAscending = (field === 'amount' || field === 'date') ? false : true;
      }

      // Update sort icons visual
      salesTable.querySelectorAll('th.sortable .sort-icon').forEach(icon => {
        icon.innerHTML = '&updownarrow;';
      });

      const currentIcon = th.querySelector('.sort-icon');
      if (currentIcon) {
        currentIcon.innerHTML = sortAscending ? '&uparrow;' : '&downarrow;';
      }

      renderTable(getFilteredTransactions());
    });

    // Table Action Delegations (Edit and Delete)
    document.getElementById('salesTableBody').addEventListener('click', (e) => {
      const editBtn = e.target.closest('.edit-sale-btn');
      if (editBtn) {
        const id = editBtn.dataset.id;
        openEditSaleModal(id);
        return;
      }

      const delBtn = e.target.closest('.delete-sale-btn');
      if (delBtn) {
        const id = delBtn.dataset.id;
        promptDeleteSale(id);
        return;
      }
    });

    // Pagination Click Delegations
    document.getElementById('paginationControls').addEventListener('click', (e) => {
      const pageBtn = e.target.closest('.page-btn');
      if (!pageBtn || pageBtn.disabled) return;

      if (pageBtn.id === 'prevPageBtn') {
        if (currentPage > 1) {
          currentPage--;
          renderTable(getFilteredTransactions());
        }
      } else if (pageBtn.id === 'nextPageBtn') {
        currentPage++;
        renderTable(getFilteredTransactions());
      } else if (pageBtn.dataset.page) {
        currentPage = parseInt(pageBtn.dataset.page, 10);
        renderTable(getFilteredTransactions());
      }
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

