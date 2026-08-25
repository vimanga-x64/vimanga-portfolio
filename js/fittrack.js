// ====== SCROLL REVEAL (IntersectionObserver — zero scroll cost) ======
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal-el').forEach(el => revealObserver.observe(el));

    // ====== SCROLL TEXT HIGHLIGHT — DOM SETUP ======
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

    // ====== STAGGER CHILDREN ANIMATION (IntersectionObserver — zero scroll cost) ======
    document.querySelectorAll('.overview-grid, .tech-grid, .pipeline, .learnings-grid').forEach(grid => {
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

    // ====== MAGNETIC BUTTONS (mousemove only — no scroll cost) ======
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

    // ====== HOVER SPOTLIGHT OVERLAY (mousemove only — no scroll cost) ======
    document.querySelectorAll('.spotlight-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--x', `${x}px`);
        card.style.setProperty('--y', `${y}px`);
      });
    });

    // ====== GOGGINS VIDEO PLAY/PAUSE & UNLOCK ======
    (function () {
      const video = document.getElementById('gogginsVideo');
      const gogginsSection = document.getElementById('gogginsSection');
      if (!video || !gogginsSection) return;

      let isIntersecting = false;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isIntersecting = entry.isIntersecting;
          if (isIntersecting) {
            video.play().catch(e => console.log('Video autoplay blocked:', e));
          } else {
            video.pause();
          }
        });
      }, { threshold: 0.1 });
      observer.observe(gogginsSection);

      // Hack for strict browsers (Edge / Safari): 
      // Unlock the media engine on the first user interaction anywhere on the page
      const unlockMedia = () => {
        if (isIntersecting && video.paused) {
          video.play().catch(e => console.log('Unlock failed:', e));
        }
        document.removeEventListener('click', unlockMedia);
        document.removeEventListener('touchstart', unlockMedia);
      };

      document.addEventListener('click', unlockMedia, { once: true });
      document.addEventListener('touchstart', unlockMedia, { once: true });
    })();

    // ====== SMART STICKY SCROLL (runs on load/resize, not on scroll) ======
    (function () {
      const allSections = document.querySelectorAll(
        'section.hero, .section-dark, .section-cream, .section-cream-alt, .section-dark-alt'
      );

      function updateStickyTops() {
        const viewportH = window.innerHeight;
        let zCounter = 1;

        allSections.forEach(el => {
          const sectionH = el.getBoundingClientRect().height;
          el.classList.add('sticky-section');
          const stickyTop = Math.min(0, viewportH - sectionH - 50);
          el.style.top = stickyTop + 'px';
          el.style.zIndex = zCounter++;
        });
      }

      updateStickyTops();
      window.addEventListener('load', updateStickyTops);
      window.addEventListener('resize', () => {
        requestAnimationFrame(updateStickyTops);
      });

      let attempts = 0;
      const interval = setInterval(() => {
        updateStickyTops();
        attempts++;
        if (attempts > 10) clearInterval(interval);
      }, 500);

      // Recalculate when lazy-loaded images finish loading (they change section height)
      document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        img.addEventListener('load', updateStickyTops, { once: true });
      });
    })();

    // ============================================================
    // UNIFIED SCROLL HANDLER — single listener, single rAF
    // Replaces 5 separate scroll listeners with 1 for much
    // better performance (fewer layout thrashes per frame).
    // ============================================================
    (function () {
      // Cache DOM references once
      const navTitle = document.getElementById('navTitle');
      const heroEl = document.querySelector('.hero');
      const statementSections = document.querySelectorAll('.editorial-statement');
      const impactSection = document.getElementById('impactSection');
      const impactBars = impactSection ? impactSection.querySelectorAll('.impact-bar') : [];
      const gogginsWrapper = document.getElementById('gogginsWrapper');
      const gogginsSection = document.getElementById('gogginsSection');

      // Pre-cache word lists for each editorial statement
      const statementData = [];
      statementSections.forEach(section => {
        const bigText = section.querySelector('.big-text');
        if (bigText) {
          statementData.push({
            section,
            bigText,
            words: bigText.querySelectorAll('.reveal-word')
          });
        }
      });

      // Run impact bars once on load
      if (impactSection) updateImpactBars(0);

      function updateImpactBars(progress) {
        impactBars.forEach(bar => {
          const maxH = parseFloat(bar.dataset.maxHeight) || 300;
          const mult = parseFloat(bar.dataset.progressMult) || 1;
          const barProgress = Math.min(progress * mult * 1.3, 1);
          bar.style.height = Math.round(maxH * barProgress) + 'px';

          const target = parseFloat(bar.dataset.target) || 0;
          const suffix = bar.dataset.suffix || '';
          const valueEl = bar.querySelector('.impact-bar-value');
          if (valueEl) {
            valueEl.textContent = Math.round(target * barProgress) + suffix;
          }
        });
      }

      let ticking = false;

      window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;

        window.requestAnimationFrame(() => {
          const windowH = window.innerHeight;
          const scrollY = window.scrollY;

          // --- Nav title ---
          if (navTitle && heroEl) {
            if (scrollY > heroEl.offsetHeight * 0.6) {
              navTitle.classList.add('visible');
            } else {
              navTitle.classList.remove('visible');
            }
          }

          // --- Editorial text highlight ---
          statementData.forEach(({ bigText, words }) => {
            const rect = bigText.getBoundingClientRect();
            const startY = windowH * 0.95;
            const endY = windowH * 0.40;
            const totalDistance = rect.height + (startY - endY);
            const distanceScrolled = startY - rect.top;

            let progress = 0;
            if (distanceScrolled > 0) {
              progress = distanceScrolled / totalDistance;
            }
            progress = Math.max(0, Math.min(1, progress * 2.0));

            const activeCount = Math.floor(progress * words.length);
            words.forEach((word, index) => {
              if (index < activeCount) {
                word.classList.add('active');
              } else {
                word.classList.remove('active');
              }
            });
          });

          // --- Impact bars ---
          if (impactSection) {
            const rect = impactSection.getBoundingClientRect();
            const sectionMid = rect.top + rect.height * 0.5;
            const progress = Math.max(0, Math.min(1, 1 - (sectionMid - windowH * 0.5) / (windowH * 0.8)));
            updateImpactBars(progress);
          }

          // --- Goggins video scale ---
          if (gogginsWrapper && gogginsSection) {
            const rect = gogginsSection.getBoundingClientRect();
            let progress = 1 - (rect.top / windowH);
            progress = Math.max(0, Math.min(1, progress));
            const scale = 0.5 + (0.5 * progress);
            gogginsWrapper.style.transform = `scale(${scale})`;
          }

          ticking = false;
        });
      }, { passive: true });
    })();