// Math.sinh polyfill for older browsers
    if (!Math.sinh) {
      Math.sinh = function(x) {
        return (Math.exp(x) - Math.exp(-x)) / 2;
      };
    }

    // Theme Toggle
    function toggleTheme() {
      const body = document.body;
      const themeIcon = document.getElementById('themeIcon');
      const currentTheme = body.getAttribute('data-theme');
      
      if (currentTheme === 'light') {
        body.setAttribute('data-theme', 'dark');
        themeIcon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
      } else {
        body.setAttribute('data-theme', 'light');
        themeIcon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
      }
    }

    // Load saved theme
    document.addEventListener('DOMContentLoaded', function() {
      const savedTheme = localStorage.getItem('theme') || 'light';
      const themeIcon = document.getElementById('themeIcon');
      
      document.body.setAttribute('data-theme', savedTheme);
      themeIcon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    });

    // Get common parameters
    function getCommonParams() {
      let h_mm = parseFloat(document.getElementById("common-h").value);
      let eps_r = parseFloat(document.getElementById("common-eps").value);
      let f_ghz = parseFloat(document.getElementById("common-f").value);
      
      return {
        h: h_mm / 1000, // Convert to meters
        eps_r: eps_r,
        f: f_ghz * 1e9  // Convert to Hz
      };
    }

    // Calculate effective dielectric constant
    function calcEffectiveEps(common) {
      const c = 3e8; // Speed of light
      const h_m = common.h;
      const eps_r = common.eps_r;
      const f = common.f;
      
      const f_p = c / (4 * h_m * Math.sqrt(eps_r));
      const eps_eff = (eps_r + 1) / 2 + (eps_r - (eps_r + 1) / 2) * (1 - Math.exp(-f / f_p));
      
      return eps_eff;
    }

    function updateResultValue(elementId, value, unit = '') {
      const element = document.getElementById(elementId);
      if (element) {
        element.textContent = value + unit;
        element.classList.add('updated');
        setTimeout(() => element.classList.remove('updated'), 500);
      }
    }

    function clearSlotResults() {
      updateResultValue('slot-z0-value', '--', ' Ω');
      updateResultValue('slot-width-value', '--', ' mm');
      updateResultValue('slot-eff-eps-value', '--');
    }

    function clearCPSResults() {
      updateResultValue('cps-z0-value', '--', ' Ω');
      updateResultValue('cps-gap-value', '--', ' mm');
      updateResultValue('cps-eff-eps-value', '--');
    }

    // Slot Line Calculations
    function calculateZ0_slot() {
      const button = event.target;
      button.classList.add('calculating');
      
      setTimeout(() => {
        try {
          let common = getCommonParams();
          let s_mm = parseFloat(document.getElementById("slot-s").value);
          
          // Validate inputs
          if (isNaN(common.h) || isNaN(common.eps_r) || isNaN(common.f) || isNaN(s_mm) ||
              common.h <= 0 || common.eps_r < 1 || common.f <= 0 || s_mm <= 0) {
            throw new Error('Invalid input parameters');
          }
          
          let s = s_mm / 1000; // Convert to meters
          let eps_eff = calcEffectiveEps(common);
          
          // Slot line impedance calculation
          let Z0_slot = (60 / Math.sqrt(eps_eff)) * Math.log((1.9 * common.h) / s);
          
          // Update results
          updateResultValue('slot-z0-value', Z0_slot.toFixed(2), ' Ω');
          updateResultValue('slot-width-value', s_mm.toFixed(4), ' mm');
          updateResultValue('slot-eff-eps-value', eps_eff.toFixed(3));
          
        } catch (error) {
          console.error('Calculation error:', error);
          handleCalculationError(error);
          clearSlotResults();
        }
        
        button.classList.remove('calculating');
      }, 300);
    }

    function calculateS_slot() {
      const button = event.target;
      button.classList.add('calculating');
      
      setTimeout(() => {
        try {
          let common = getCommonParams();
          let targetZ0 = parseFloat(document.getElementById("slot-targetZ0").value);
          
          // Validate inputs
          if (isNaN(common.h) || isNaN(common.eps_r) || isNaN(common.f) || isNaN(targetZ0) ||
              common.h <= 0 || common.eps_r < 1 || common.f <= 0 || targetZ0 <= 0) {
            throw new Error('Invalid input parameters');
          }
          
          let eps_eff = calcEffectiveEps(common);
          
          // Calculate slot width from target impedance
          // Z0 = (60 / sqrt(eps_eff)) * ln((1.9 * h) / s)
          // s = (1.9 * h) / exp(Z0 * sqrt(eps_eff) / 60)
          let s = (1.9 * common.h) / Math.exp((targetZ0 * Math.sqrt(eps_eff)) / 60);
          let s_mm = s * 1000;
          
          // Update results
          updateResultValue('slot-z0-value', targetZ0.toFixed(2), ' Ω');
          updateResultValue('slot-width-value', s_mm.toFixed(4), ' mm');
          updateResultValue('slot-eff-eps-value', eps_eff.toFixed(3));
          
        } catch (error) {
          console.error('Calculation error:', error);
          handleCalculationError(error);
          clearSlotResults();
        }
        
        button.classList.remove('calculating');
      }, 300);
    }

    // CPS Calculations
    function calculateZ0_CPS() {
      const button = event.target;
      button.classList.add('calculating');
      
      setTimeout(() => {
        try {
          let common = getCommonParams();
          let W_mm = parseFloat(document.getElementById("cps-W").value);
          let S_mm = parseFloat(document.getElementById("cps-S").value);
          
          // Validate inputs
          if (isNaN(common.h) || isNaN(common.eps_r) || isNaN(common.f) || isNaN(W_mm) || isNaN(S_mm) ||
              common.h <= 0 || common.eps_r < 1 || common.f <= 0 || W_mm <= 0 || S_mm <= 0) {
            throw new Error('Invalid input parameters');
          }
          
          let eps_eff = calcEffectiveEps(common);
          let ratio = W_mm / S_mm;
          
          // CPS impedance calculation
          let denominator = ratio + 1.393 + 0.667 * Math.log(ratio + 1.444);
          let Z0_CPS = (30 * Math.PI) / (Math.sqrt(eps_eff) * denominator);
          
          // Update results
          updateResultValue('cps-z0-value', Z0_CPS.toFixed(2), ' Ω');
          updateResultValue('cps-gap-value', S_mm.toFixed(4), ' mm');
          updateResultValue('cps-eff-eps-value', eps_eff.toFixed(3));
          
        } catch (error) {
          console.error('Calculation error:', error);
          handleCalculationError(error);
          clearCPSResults();
        }
        
        button.classList.remove('calculating');
      }, 300);
    }

    function calculateS_CPS() {
      const button = event.target;
      button.classList.add('calculating');
      
      setTimeout(() => {
        try {
          let common = getCommonParams();
          let targetZ0 = parseFloat(document.getElementById("cps-targetZ0").value);
          let W_mm = parseFloat(document.getElementById("cps-W").value);
          
          // Validate inputs
          if (isNaN(common.h) || isNaN(common.eps_r) || isNaN(common.f) || isNaN(targetZ0) || isNaN(W_mm) ||
              common.h <= 0 || common.eps_r < 1 || common.f <= 0 || targetZ0 <= 0 || W_mm <= 0) {
            throw new Error('Invalid input parameters');
          }
          
          let eps_eff = calcEffectiveEps(common);
          
          // Solve for S using Newton-Raphson method
          // Z0 = (30*π) / (sqrt(eps_eff) * (W/S + 1.393 + 0.667*ln(W/S + 1.444)))
          let S_guess = W_mm / 2; // Initial guess
          let tolerance = 1e-8;
          let maxIter = 100;
          
          for (let i = 0; i < maxIter; i++) {
            if (S_guess <= 0) S_guess = 0.001;
            
            let ratio = W_mm / S_guess;
            let denominator = ratio + 1.393 + 0.667 * Math.log(ratio + 1.444);
            let Z0_calc = (30 * Math.PI) / (Math.sqrt(eps_eff) * denominator);
            
            let f_val = Z0_calc - targetZ0;
            
            if (Math.abs(f_val) < tolerance) {
              break;
            }
            
            // Calculate derivative
            let dS = S_guess * 1e-6;
            let S_plus = S_guess + dS;
            let ratio_plus = W_mm / S_plus;
            let denominator_plus = ratio_plus + 1.393 + 0.667 * Math.log(ratio_plus + 1.444);
            let Z0_plus = (30 * Math.PI) / (Math.sqrt(eps_eff) * denominator_plus);
            
            let derivative = (Z0_plus - Z0_calc) / dS;
            
            if (Math.abs(derivative) < 1e-15) {
              // Use bisection fallback
              if (f_val > 0) {
                S_guess = S_guess * 0.9;
              } else {
                S_guess = S_guess * 1.1;
              }
              continue;
            }
            
            S_guess = S_guess - f_val / derivative;
            S_guess = Math.max(0.001, S_guess);
          }
          
          // Update results
          updateResultValue('cps-z0-value', targetZ0.toFixed(2), ' Ω');
          updateResultValue('cps-gap-value', S_guess.toFixed(4), ' mm');
          updateResultValue('cps-eff-eps-value', eps_eff.toFixed(3));
          
        } catch (error) {
          console.error('Calculation error:', error);
          handleCalculationError(error);
          clearCPSResults();
        }
        
        button.classList.remove('calculating');
      }, 300);
    }

    // Enhanced error handling
    function handleCalculationError(error) {
      console.error('Calculation error:', error);
      
      // Show user-friendly error message
      const errorMsg = document.createElement('div');
      errorMsg.innerHTML = `
        <div style="color: var(--error); text-align: center; padding: 1rem;">
          <i class="fas fa-exclamation-triangle"></i>
          Calculation Error: Please check your input values.
        </div>
      `;
      errorMsg.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--card);
        border: 2px solid var(--error);
        border-radius: var(--radius);
        z-index: 1000;
        animation: fadeInUp 0.3s ease-out;
        box-shadow: var(--shadow-large);
      `;
      document.body.appendChild(errorMsg);
      setTimeout(() => errorMsg.remove(), 3000);
    }

    // Add copy to clipboard functionality
    function copySlotResults() {
      const results = {
        z0: document.getElementById('slot-z0-value').textContent,
        width: document.getElementById('slot-width-value').textContent,
        eff_eps: document.getElementById('slot-eff-eps-value').textContent
      };
      
      const resultText = `Slot Line Calculation Results:
Characteristic Impedance: ${results.z0}
Slot Width: ${results.width}
Effective Dielectric Constant: ${results.eff_eps}`;
      
      navigator.clipboard.writeText(resultText).then(() => {
        showSuccessMessage('Slot Line Results Copied!');
      });
    }

    function copyCPSResults() {
      const results = {
        z0: document.getElementById('cps-z0-value').textContent,
        gap: document.getElementById('cps-gap-value').textContent,
        eff_eps: document.getElementById('cps-eff-eps-value').textContent
      };
      
      const resultText = `CPS Calculation Results:
Characteristic Impedance: ${results.z0}
Gap (S): ${results.gap}
Effective Dielectric Constant: ${results.eff_eps}`;
      
      navigator.clipboard.writeText(resultText).then(() => {
        showSuccessMessage('CPS Results Copied!');
      });
    }

    function showSuccessMessage(message) {
      const button = document.createElement('div');
      button.innerHTML = `<i class="fas fa-check"></i> ${message}`;
      button.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--radius);
        z-index: 1000;
        animation: fadeInUp 0.3s ease-out;
        box-shadow: var(--shadow-large);
      `;
      document.body.appendChild(button);
      setTimeout(() => button.remove(), 2000);
    }

    // Add click to copy functionality to result displays
    document.addEventListener('DOMContentLoaded', function() {
      const slotResultDisplay = document.querySelector('.card:nth-child(2) .result-display');
      const cpsResultDisplay = document.querySelector('.card:nth-child(3) .result-display');
      
      if (slotResultDisplay) {
        const copyButton = document.createElement('button');
        copyButton.innerHTML = '<i class="fas fa-copy"></i> Copy Results';
        copyButton.className = 'btn btn-secondary';
        copyButton.style.marginTop = '1rem';
        copyButton.onclick = copySlotResults;
        slotResultDisplay.appendChild(copyButton);
      }
      
      if (cpsResultDisplay) {
        const copyButton = document.createElement('button');
        copyButton.innerHTML = '<i class="fas fa-copy"></i> Copy Results';
        copyButton.className = 'btn btn-secondary';
        copyButton.style.marginTop = '1rem';
        copyButton.onclick = copyCPSResults;
        cpsResultDisplay.appendChild(copyButton);
      }
    });

    // Animation on scroll
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animationDelay = Math.random() * 0.3 + 's';
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    // Observe all cards on page load
    document.addEventListener('DOMContentLoaded', function() {
      document.querySelectorAll('.card').forEach(card => {
        observer.observe(card);
      });
    });

    // Input validation and real-time feedback
    function validateInputs() {
      const inputs = document.querySelectorAll('.input-field');
      inputs.forEach(input => {
        input.addEventListener('input', function() {
          const value = parseFloat(this.value);
          
          // Special validation for dielectric constant (allow εᵣ ≥ 1)
          if (this.id === 'common-eps') {
            if (isNaN(value) || value < 1) {
              this.style.borderColor = 'var(--error)';
            } else {
              this.style.borderColor = 'var(--border)';
            }
          } else {
            // Standard validation for other inputs
            if (isNaN(value) || value <= 0) {
              this.style.borderColor = 'var(--error)';
            } else {
              this.style.borderColor = 'var(--border)';
            }
          }
        });
      });
    }

    // Initialize validation on page load
    document.addEventListener('DOMContentLoaded', validateInputs);

    // Add keyboard shortcuts
    document.addEventListener('keydown', function(event) {
      if (event.ctrlKey || event.metaKey) {
        switch(event.key) {
          case '1':
            event.preventDefault();
            calculateZ0_slot();
            break;
          case '2':
            event.preventDefault();
            calculateS_slot();
            break;
          case '3':
            event.preventDefault();
            calculateZ0_CPS();
            break;
          case '4':
            event.preventDefault();
            calculateS_CPS();
            break;
          case 'd':
            event.preventDefault();
            toggleTheme();
            break;
        }
      }
    });

    // Add tooltips for better UX
    function addTooltips() {
      const tooltips = {
        'common-h': 'Substrate thickness (dielectric layer height)',
        'common-eps': 'Relative permittivity of the dielectric material (εᵣ ≥ 1)',
        'common-f': 'Operating frequency for frequency-dependent calculations',
        'slot-s': 'Width of the slot in the ground plane',
        'slot-targetZ0': 'Desired characteristic impedance for slot line',
        'cps-W': 'Width of each conductor strip',
        'cps-S': 'Gap between the two conductor strips',
        'cps-targetZ0': 'Desired characteristic impedance for CPS'
      };

      Object.keys(tooltips).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          element.title = tooltips[id];
        }
      });
    }

    // Initialize tooltips
    document.addEventListener('DOMContentLoaded', addTooltips);
