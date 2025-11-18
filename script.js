'use strict';

const defaults = {
  monthlyVolume: 1000,
  manualMinutes: 10,
  hourlyCost: 40,
  errorRate: 2,
  averageInvoiceValue: 5000,
  auditCost: 20000,
  aiPlatformCost: 5000,
  aiImplementationCost: 15000
};

const formattedFieldIds = new Set([
  'monthlyVolume',
  'averageInvoiceValue',
  'auditCost',
  'aiPlatformCost',
  'aiImplementationCost'
]);

const AI_PROCESSING_SECONDS = 15; // assumed automation speed
const AI_ERROR_RATE = 0.1; // assumed residual error %
const AI_AUDIT_FACTOR = 0.1;

const euroFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0
});

function initCalculator() {
  Object.entries(defaults).forEach(([key, value]) => {
    const input = document.getElementById(key);
    if (input) {
      input.value = value;
    }
  });

  const paramInputs = document.querySelectorAll('.param-input');
  paramInputs.forEach((input) => {
    const usesFormatting = formattedFieldIds.has(input.id);
    if (usesFormatting) {
      updateFormattedInput(input);
      enhanceFormattedInput(input);
    }
    input.addEventListener('input', () => {
      if (usesFormatting) {
        updateFormattedInput(input);
      }
      recalculate();
    });
  });

  recalculate();
}

function readParams() {
  const params = {};
  Object.keys(defaults).forEach((key) => {
    const element = document.getElementById(key);
    const value = element ? parseFloat(element.value) : 0;
    params[key] = Number.isFinite(value) ? value : 0;
  });
  return params;
}

function computeResults(params) {
  const annualInvoices = params.monthlyVolume * 12;
  const manualHours = annualInvoices * (params.manualMinutes / 60);
  const laborCost = manualHours * params.hourlyCost;
  const auditCost = params.auditCost;

  const currentTotal = laborCost + auditCost;

  const aiLabor = annualInvoices * (AI_PROCESSING_SECONDS / 3600) * params.hourlyCost;
  const safeManualErrorRate = Math.max(params.errorRate, 0.1);
  const aiErrorRatio = AI_ERROR_RATE / safeManualErrorRate;
  const aiAuditCost = auditCost * AI_AUDIT_FACTOR;

  const aiTotal = aiLabor + aiAuditCost + params.aiPlatformCost + params.aiImplementationCost;

  const annualSavings = currentTotal - aiTotal;
  const roiPercent = aiTotal > 0 ? (annualSavings / aiTotal) * 100 : 0;
  const monthlySavings = annualSavings / 12;
  const paybackMonths = monthlySavings > 0 ? (params.aiPlatformCost + params.aiImplementationCost) / monthlySavings : null;

  return {
    current: {
      laborCost,
      auditCost,
      total: currentTotal
    },
    ai: {
      laborCost: aiLabor,
      auditCost: aiAuditCost,
      platformCost: params.aiPlatformCost,
      implementationCost: params.aiImplementationCost,
      total: aiTotal
    },
    roi: {
      annualSavings,
      roiPercent,
      paybackMonths
    }
  };
}

function updateCurrency(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = euroFormatter.format(Math.round(value));
  }
}

function formatWithSeparators(value) {
  if (value === '' || value === undefined || value === null) {
    return '';
  }
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return '';
  }
  if (value.includes('.')) {
    const decimals = value.split('.')[1].length;
    return numericValue.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }
  return numericValue.toLocaleString('en-US');
}

function updateFormattedInput(input) {
  const wrapper = input.closest('.input-with-format');
  if (!wrapper) {
    return;
  }
  const display = wrapper.querySelector('.input-formatted');
  if (!display) {
    return;
  }
  display.textContent = formatWithSeparators(input.value);
}

function enhanceFormattedInput(input) {
  const hideCaret = () => {
    input.classList.remove('show-caret');
  };
  input.addEventListener('blur', hideCaret);
  input.addEventListener('pointerdown', hideCaret);
  input.addEventListener('mousedown', hideCaret);
  input.addEventListener('keydown', () => {
    input.classList.add('show-caret');
  });
  hideCaret();
}

function recalculate() {
  const params = readParams();
  const results = computeResults(params);

  updateCurrency('currentLabor', results.current.laborCost);
  updateCurrency('currentAudit', results.current.auditCost);
  updateCurrency('currentTotal', results.current.total);

  updateCurrency('aiLabor', results.ai.laborCost);
  updateCurrency('aiAudit', results.ai.auditCost);
  updateCurrency('aiPlatform', results.ai.platformCost);
  updateCurrency('aiImplementation', results.ai.implementationCost);
  updateCurrency('aiTotal', results.ai.total);

  const annualHeadline = document.getElementById('annualSavings');
  if (annualHeadline) {
    annualHeadline.textContent = `${euroFormatter.format(Math.round(results.roi.annualSavings))}`;
  }

  const roiEl = document.getElementById('roiPercent');
  if (roiEl) {
    const rounded = results.roi.roiPercent;
    roiEl.textContent = `${rounded.toFixed(1)}%`;
  }

  const paybackEl = document.getElementById('payback');
  if (paybackEl) {
    paybackEl.textContent = results.roi.paybackMonths
      ? `${results.roi.paybackMonths.toFixed(1)} months`
      : 'Not reached';
  }
}

document.addEventListener('DOMContentLoaded', initCalculator);
