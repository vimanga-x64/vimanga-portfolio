// ====== SCROLL REVEAL ======
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal-el').forEach(el => revealObserver.observe(el));

    // ====== SCROLL TEXT HIGHLIGHT ======
    document.querySelectorAll('.editorial-statement .big-text').forEach(el => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
      const textNodes = [];
      let node;
      while (node = walker.nextNode()) {
        if (node.nodeValue.trim() !== '') {
          textNodes.push(node);
        }
      }

      textNodes.forEach(textNode => {
        const words = textNode.nodeValue.split(/(\s+)/);
        const fragment = document.createDocumentFragment();
        words.forEach(word => {
          if (word.trim() === '') {
            fragment.appendChild(document.createTextNode(word));
          } else {
            const span = document.createElement('span');
            span.className = 'reveal-word';
            span.textContent = word;
            fragment.appendChild(span);
          }
        });
        textNode.parentNode.replaceChild(fragment, textNode);
      });
    });

    const statementSections = document.querySelectorAll('.editorial-statement');
    let statementTicking = false;
    window.addEventListener('scroll', () => {
      if (!statementTicking) {
        window.requestAnimationFrame(() => {
          const windowH = window.innerHeight;
          statementSections.forEach(section => {
            const sectionRect = section.getBoundingClientRect();
            // Trigger area based on the actual paragraph, not the padded wrapper
            const bigText = section.querySelector('.big-text');
            if (!bigText) return;

            const rect = bigText.getBoundingClientRect();

            // Start highlighting when the top of the text enters the bottom 85% of viewport
            const startY = windowH * 0.95;
            // Finish highlighting when the bottom of the text reaches the top 35% of viewport
            const endY = windowH * 0.40;

            // Total scroll distance is the height of the text block plus the scrolling range between trigger points
            const totalDistance = rect.height + (startY - endY);
            const distanceScrolled = startY - rect.top;

            let progress = 0;
            if (distanceScrolled > 0) {
              progress = distanceScrolled / totalDistance;
            }

            // Add a 1.25x multiplier to ensure it reaches 100% just before the element leaves the optimal reading zone
            progress = Math.max(0, Math.min(1, progress * 2.0)); // Aggressive multiplier so it finishes before pinning

            const words = bigText.querySelectorAll('.reveal-word');
            const activeCount = Math.floor(progress * words.length);

            words.forEach((word, index) => {
              if (index < activeCount) {
                word.classList.add('active');
              } else {
                word.classList.remove('active');
              }
            });
          });
          statementTicking = false;
        });
        statementTicking = true;
      }
    }, { passive: true });

    // ====== SCROLL-DRIVEN IMPACT BARS ======
    (function () {
      const section = document.getElementById('impactSection');
      if (!section) return;
      const bars = section.querySelectorAll('.impact-bar');

      function updateBars() {
        const rect = section.getBoundingClientRect();
        const windowH = window.innerHeight;
        const sectionMid = rect.top + rect.height * 0.5;
        const progress = Math.max(0, Math.min(1, 1 - (sectionMid - windowH * 0.5) / (windowH * 0.8)));

        bars.forEach(bar => {
          const maxH = parseFloat(bar.dataset.maxHeight) || 300;
          const mult = parseFloat(bar.dataset.progressMult) || 1;
          const barProgress = Math.min(progress * mult * 1.3, 1);
          const h = Math.round(maxH * barProgress);
          bar.style.height = h + 'px';

          const target = parseFloat(bar.dataset.target) || 0;
          const suffix = bar.dataset.suffix || '';
          const prefix = bar.dataset.prefix || '';
          const valueEl = bar.querySelector('.impact-bar-value');
          if (valueEl) {
            const current = Math.round(target * barProgress);
            valueEl.textContent = prefix + current + suffix;
          }
        });
        // Removed infinite requestAnimationFrame(updateBars) here
      }

      let impactBarsTicking = false;
      window.addEventListener('scroll', () => {
        if (!impactBarsTicking) {
          window.requestAnimationFrame(() => {
            updateBars();
            impactBarsTicking = false;
          });
          impactBarsTicking = true;
        }
      }, { passive: true });

      // Run exactly once on load
      updateBars();
    })();

    // ====== NAV TITLE ON SCROLL ======
    const navTitle = document.getElementById('navTitle');
    const hero = document.querySelector('.hero');

    let navTitleTicking = false;
    window.addEventListener('scroll', () => {
      if (!navTitleTicking) {
        window.requestAnimationFrame(() => {
          if (window.scrollY > hero.offsetHeight * 0.6) {
            navTitle.classList.add('visible');
          } else {
            navTitle.classList.remove('visible');
          }
          navTitleTicking = false;
        });
        navTitleTicking = true;
      }
    }, { passive: true });

    // ====== STAGGER CHILDREN ANIMATION ======
    document.querySelectorAll('.overview-grid, .tech-grid, .pipeline, .feature-showcase, .learnings-grid').forEach(grid => {
      const gridObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const children = entry.target.querySelectorAll('.reveal-el');
            children.forEach((child, i) => {
              child.style.transitionDelay = `${i * 100}ms`;
              child.classList.add('visible');
            });
            gridObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      gridObserver.observe(grid);
    });

    // ====== MAGNETIC BUTTONS ======
    document.querySelectorAll('.cta-btn').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        const inner = btn.querySelector('.cta-btn-inner');
        if (inner) inner.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0px, 0px)';
        const inner = btn.querySelector('.cta-btn-inner');
        if (inner) inner.style.transform = 'translate(0px, 0px)';
      });
    });

    // ====== HOVER SPOTLIGHT OVERLAY ======
    document.querySelectorAll('.spotlight-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--x', `${x}px`);
        card.style.setProperty('--y', `${y}px`);
      });
    });
    // ====== SMART STICKY SCROLL ======
    // Only pin sections that fit within the viewport.
    // Tall sections (gallery, etc.) get negative top so all content is visible.
    (function () {
      const allSections = document.querySelectorAll(
        'section.hero, .section-dark, .section-cream, .section-cream-alt, .section-dark-alt'
      );

      function updateStickyTops() {
        const viewportH = window.innerHeight;
        let zCounter = 1;

        allSections.forEach(el => {
          // Get the actual height including all loaded content
          const sectionH = el.getBoundingClientRect().height;
          el.classList.add('sticky-section');

          // Short sections pin at top immediately (top: 0)
          // Tall sections get negative top so content scrolls through before pinning
          // We add a little buffer (e.g. 50px) to ensure the very bottom isn't covered by shadows
          const stickyTop = Math.min(0, viewportH - sectionH - 50);
          el.style.top = stickyTop + 'px';
          el.style.zIndex = zCounter++;
        });
      }

      // Run initially
      updateStickyTops();

      // Run again after all resources (especially images) have fully loaded
      window.addEventListener('load', updateStickyTops);

      // Run on resize to handle viewport changes
      window.addEventListener('resize', () => {
        requestAnimationFrame(updateStickyTops);
      });

      // Failsafe: Run periodically for the first few seconds just in case custom fonts/images reflow
      let attempts = 0;
      const interval = setInterval(() => {
        updateStickyTops();
        attempts++;
        if (attempts > 10) clearInterval(interval); // Stop after ~5 seconds
      }, 500);

    })();