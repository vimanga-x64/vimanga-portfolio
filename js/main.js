
// Editorial percentage loader. It advances gently while assets load, completes
// as soon as the page is ready, and retains a short failsafe for slow models.
(() => {
  const loadingScreen = document.getElementById('loading-screen');
  const percentage = document.getElementById('loadingPercent');
  const ruleFill = document.getElementById('loadingRuleFill');
  const clock = document.getElementById('loadingClock');
  if (!loadingScreen || !percentage || !ruleFill) return;

  // A resume project link is a destination, not a fresh visit to the home
  // page. Skip the editorial intro so the linked card is visible immediately.
  const isProjectDeepLink = /^#project-(nasa|movie-search|free-games)$/.test(window.location.hash);
  if (isProjectDeepLink) {
    loadingScreen.classList.add('is-complete', 'hidden');
    loadingScreen.setAttribute('aria-hidden', 'true');
    loadingScreen.style.display = 'none';
    return;
  }

  const startedAt = performance.now();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const introDelay = reducedMotion ? 0 : 100;
  const minimumDisplayTime = reducedMotion ? 120 : 650;
  let displayedProgress = 0;
  let pageLoaded = document.readyState !== 'loading';
  let isDismissed = false;

  const updateClock = () => {
    if (!clock) return;
    clock.textContent = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Toronto',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date());
  };

  const dismissLoader = () => {
    if (isDismissed) return;
    isDismissed = true;
    percentage.value = '100';
    percentage.textContent = '100';
    ruleFill.style.transform = 'scaleX(1)';
    loadingScreen.classList.add('is-loaded');
    loadingScreen.setAttribute('aria-hidden', 'true');

    // Carry the completed progress rule into the hero divider so the loader
    // feels connected to the page it reveals instead of simply vanishing.
    const loaderRule = loadingScreen.querySelector('.editorial-loader-rule');
    const heroDivider = document.querySelector('#home .hero-footer');
    let handoffRule = null;
    if (loaderRule && heroDivider && !reducedMotion) {
      const start = loaderRule.getBoundingClientRect();
      const target = heroDivider.getBoundingClientRect();

      // The handoff rule lives outside the moving loader panel. That lets the
      // page reveal around a line which never reverses direction or vanishes.
      handoffRule = document.createElement('span');
      handoffRule.className = 'loader-handoff-line';
      handoffRule.setAttribute('aria-hidden', 'true');
      handoffRule.style.left = `${start.left}px`;
      handoffRule.style.top = `${start.top}px`;
      handoffRule.style.width = `${start.width}px`;
      handoffRule.style.setProperty('--handoff-x', `${target.left - start.left}px`);
      handoffRule.style.setProperty('--handoff-y', `${target.top - start.top}px`);
      handoffRule.style.setProperty('--handoff-scale-x', String(target.width / Math.max(1, start.width)));
      document.body.appendChild(handoffRule);
      loaderRule.style.visibility = 'hidden';

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => handoffRule?.classList.add('is-settled'));
      });
    }

    window.setTimeout(() => loadingScreen.classList.add('is-complete'), reducedMotion ? 0 : 40);
    window.setTimeout(() => loadingScreen.classList.add('hidden'), reducedMotion ? 0 : 220);
    window.setTimeout(() => { loadingScreen.style.display = 'none'; }, reducedMotion ? 140 : 680);
    // Keep the settled rule in place until the matching hero divider has
    // finished appearing beneath it; removing it earlier creates a blink.
    window.setTimeout(() => handoffRule?.remove(), reducedMotion ? 160 : 900);
  };

  const renderProgress = (now) => {
    if (isDismissed) return;
    const elapsed = now - startedAt;
    const activeElapsed = Math.max(0, elapsed - introDelay);
    const simulatedProgress = Math.min(92, (1 - Math.exp(-activeElapsed / 520)) * 100);
    const canComplete = pageLoaded && elapsed >= minimumDisplayTime;
    const target = canComplete ? 100 : simulatedProgress;
    displayedProgress += (target - displayedProgress) * (canComplete ? .58 : .09);

    const roundedProgress = Math.min(100, Math.floor(displayedProgress));
    percentage.value = String(roundedProgress);
    percentage.textContent = String(roundedProgress);
    ruleFill.style.transform = `scaleX(${displayedProgress / 100})`;

    if (canComplete && displayedProgress >= 99.45) {
      dismissLoader();
      return;
    }
    window.requestAnimationFrame(renderProgress);
  };

  updateClock();
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => loadingScreen.classList.add('is-intro'));
  });
  const clockTimer = window.setInterval(updateClock, 1000);
  document.addEventListener('DOMContentLoaded', () => { pageLoaded = true; }, { once: true });
  window.setTimeout(() => { pageLoaded = true; }, 1800);
  window.requestAnimationFrame(renderProgress);
  loadingScreen.addEventListener('transitionend', () => window.clearInterval(clockTimer), { once: true });
})();

// Preserve direct links to individual cards after the loader and project rail
// have finished laying themselves out.
(() => {
  const alignProjectHash = () => {
    const id = window.location.hash.slice(1);
    if (!id) return;

    const target = document.getElementById(id);
    const wrapper = document.getElementById('projectsBorderWrapper');
    const section = document.getElementById('projects');
    if (!target?.classList.contains('project-card') || !wrapper || !section) return;

    const sectionTop = section.getBoundingClientRect().top + window.scrollY;
    const centeredLeft = target.offsetLeft - ((wrapper.clientWidth - target.offsetWidth) / 2);
    window.scrollTo({ top: sectionTop, behavior: 'auto' });
    wrapper.scrollTo({ left: Math.max(0, centeredLeft), behavior: 'auto' });
  };

  window.addEventListener('hashchange', alignProjectHash);
  window.requestAnimationFrame(() => window.requestAnimationFrame(alignProjectHash));
  window.addEventListener('load', () => {
    window.setTimeout(alignProjectHash, 80);
    window.setTimeout(alignProjectHash, 700);
  }, { once: true });
})();

// Theme Toggle
    const menuThemeToggle = document.getElementById('menuThemeToggle');
    const html = document.documentElement;

    const currentTheme = localStorage.getItem('theme') || 'dark';
    html.setAttribute('data-theme', currentTheme);

    const syncThemeToggle = (theme) => {
      if (!menuThemeToggle) return;
      const isDark = theme === 'dark';
      menuThemeToggle.setAttribute('aria-checked', String(isDark));
      menuThemeToggle.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} theme`);
      menuThemeToggle.title = `Switch to ${isDark ? 'light' : 'dark'} theme`;
    };

    syncThemeToggle(currentTheme);

    menuThemeToggle?.addEventListener('click', () => {
      const theme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      syncThemeToggle(theme);
      // Update particle color based on theme
      if (window.particleSystem) {
        window.particleSystem.updateColor(theme === 'dark' ? '#ffffff' : '#1e1e23');
      }
    });

    // Particle System
    class ParticleSystem {
      constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Options
        this.quantity = options.quantity || 100;
        this.staticity = options.staticity || 50;
        this.ease = options.ease || 50;
        this.size = options.size || 0.4;
        this.color = options.color || '#ffffff';
        this.vx = options.vx || 0;
        this.vy = options.vy || 0;

        // State
        this.particles = [];
        this.mouse = { x: 0, y: 0 };
        this.canvasSize = { w: 0, h: 0 };
        this.dpr = window.devicePixelRatio || 1;
        this.animationFrame = null;
        this.rgb = this.hexToRgb(this.color);

        // Bind methods
        this.handleResize = this.handleResize.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.animate = this.animate.bind(this);
        this.handleIntersection = this.handleIntersection.bind(this);

        this.isVisible = true;
        this.observer = new IntersectionObserver(this.handleIntersection, { threshold: 0 });

        // Initialize
        this.init();
      }

      hexToRgb(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) {
          hex = hex.split('').map(char => char + char).join('');
        }
        const hexInt = parseInt(hex, 16);
        const red = (hexInt >> 16) & 255;
        const green = (hexInt >> 8) & 255;
        const blue = hexInt & 255;
        return [red, green, blue];
      }

      init() {
        this.resizeCanvas();
        window.addEventListener('resize', this.handleResize);
        window.addEventListener('mousemove', this.handleMouseMove);
        this.observer.observe(this.canvas);
        this.animate();
      }

      handleIntersection(entries) {
        entries.forEach(entry => {
          this.isVisible = entry.isIntersecting;
          if (this.isVisible && !this.animationFrame) {
            this.lastTime = performance.now();
            this.animate(this.lastTime);
          }
        });
      }

      handleResize() {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
          this.resizeCanvas();
        }, 200);
      }

      handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const { w, h } = this.canvasSize;
        const x = e.clientX - rect.left - w / 2;
        const y = e.clientY - rect.top - h / 2;
        const inside = x < w / 2 && x > -w / 2 && y < h / 2 && y > -h / 2;

        if (inside) {
          this.mouse.x = x;
          this.mouse.y = y;
        }
      }

      resizeCanvas() {
        this.canvasSize.w = window.innerWidth;
        this.canvasSize.h = window.innerHeight;

        this.canvas.width = this.canvasSize.w * this.dpr;
        this.canvas.height = this.canvasSize.h * this.dpr;
        this.canvas.style.width = `${this.canvasSize.w}px`;
        this.canvas.style.height = `${this.canvasSize.h}px`;
        this.ctx.scale(this.dpr, this.dpr);

        // Create particles
        this.particles = [];
        for (let i = 0; i < this.quantity; i++) {
          this.particles.push(this.createParticle());
        }
      }

      createParticle() {
        return {
          x: Math.floor(Math.random() * this.canvasSize.w),
          y: Math.floor(Math.random() * this.canvasSize.h),
          translateX: 0,
          translateY: 0,
          size: Math.floor(Math.random() * 2) + this.size,
          alpha: 0,
          targetAlpha: parseFloat((Math.random() * 0.6 + 0.1).toFixed(1)),
          dx: (Math.random() - 0.5) * 0.1,
          dy: (Math.random() - 0.5) * 0.1,
          magnetism: 0.1 + Math.random() * 4
        };
      }

      drawParticle(particle) {
        const { x, y, translateX, translateY, size, alpha } = particle;

        this.ctx.save();
        this.ctx.translate(translateX, translateY);
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, 2 * Math.PI);
        this.ctx.fillStyle = `rgba(${this.rgb.join(', ')}, ${alpha})`;
        this.ctx.fill();
        this.ctx.restore();
      }

      remapValue(value, start1, end1, start2, end2) {
        const remapped = ((value - start1) * (end2 - start2)) / (end1 - start1) + start2;
        return remapped > 0 ? remapped : 0;
      }

      animate(timestamp) {
        // Delta time for frame-rate independence (normalize to 60fps)
        if (!this.lastTime) this.lastTime = timestamp;
        const deltaTime = (timestamp - this.lastTime) / 16.67 || 1;
        this.lastTime = timestamp;

        this.ctx.clearRect(0, 0, this.canvasSize.w, this.canvasSize.h);

        this.particles.forEach((particle, i) => {
          // Calculate distance from edges
          const edge = [
            particle.x + particle.translateX - particle.size,
            this.canvasSize.w - particle.x - particle.translateX - particle.size,
            particle.y + particle.translateY - particle.size,
            this.canvasSize.h - particle.y - particle.translateY - particle.size
          ];

          const closestEdge = Math.min(...edge);
          const remapClosestEdge = parseFloat(this.remapValue(closestEdge, 0, 20, 0, 1).toFixed(2));

          // Handle alpha
          if (remapClosestEdge > 1) {
            particle.alpha += 0.02 * deltaTime;
            if (particle.alpha > particle.targetAlpha) {
              particle.alpha = particle.targetAlpha;
            }
          } else {
            particle.alpha = particle.targetAlpha * remapClosestEdge;
          }

          // Update position with delta time
          particle.x += (particle.dx + this.vx) * deltaTime;
          particle.y += (particle.dy + this.vy) * deltaTime;

          // Mouse interaction with delta time
          const moveX = (this.mouse.x / (this.staticity / particle.magnetism) - particle.translateX) / this.ease;
          const moveY = (this.mouse.y / (this.staticity / particle.magnetism) - particle.translateY) / this.ease;
          particle.translateX += moveX * deltaTime;
          particle.translateY += moveY * deltaTime;

          // Draw particle
          this.drawParticle(particle);

          // Reset particle if out of bounds
          if (
            particle.x < -particle.size ||
            particle.x > this.canvasSize.w + particle.size ||
            particle.y < -particle.size ||
            particle.y > this.canvasSize.h + particle.size
          ) {
            this.particles[i] = this.createParticle();
          }
        });

        if (this.isVisible) {
          this.animationFrame = requestAnimationFrame(this.animate);
        } else {
          this.animationFrame = null;
        }
      }

      updateColor(newColor) {
        this.color = newColor;
        this.rgb = this.hexToRgb(newColor);
      }

      destroy() {
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('mousemove', this.handleMouseMove);
        this.observer.disconnect();
        if (this.animationFrame) {
          cancelAnimationFrame(this.animationFrame);
        }
      }
    }

    // Initialize particle system
    window.addEventListener('load', () => {
      if (document.documentElement.dataset.heroRedesign === 'true') return;
      const theme = html.getAttribute('data-theme');
      const particleColor = theme === 'dark' ? '#ffffff' : '#1e1e23';

      window.particleSystem = new ParticleSystem('particles-canvas', {
        quantity: 100,
        staticity: 50,
        ease: 50,
        size: 0.4,
        color: particleColor,
        vx: 0,
        vy: 0
      });
    });

    // Hamburger Menu Toggle
    const menuToggle = document.getElementById('menuToggle');
    const menuOverlay = document.getElementById('menuOverlay');
    const menuBackdrop = document.getElementById('menuBackdrop');
    let isMenuOpen = false;

    function toggleMenu() {
      isMenuOpen = !isMenuOpen;
      menuToggle.classList.toggle('active', isMenuOpen);
      menuOverlay.classList.toggle('active', isMenuOpen);
      menuBackdrop.classList.toggle('active', isMenuOpen);
      document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    }

    menuToggle?.addEventListener('click', toggleMenu);
    menuBackdrop?.addEventListener('click', toggleMenu);

    // Close menu when clicking nav links
    const menuNavLinks = document.querySelectorAll('.menu-nav-item');
    menuNavLinks.forEach(link => {
      link?.addEventListener('click', () => {
        if (isMenuOpen) {
          toggleMenu();
        }
      });
    });

    // Show particles only in contact section
    let contactScrollTicking = false;
    window.addEventListener('scroll', () => {
      if (!contactScrollTicking) {
        window.requestAnimationFrame(() => {
          const contactSection = document.getElementById('contact');
          if (contactSection) {
            const rect = contactSection.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            // Show particles when contact section is in view
            if (rect.top < windowHeight && rect.bottom > 0) {
              document.body.classList.add('in-contact');
            } else {
              document.body.classList.remove('in-contact');
            }
          }
          contactScrollTicking = false;
        });
        contactScrollTicking = true;
      }
    }, { passive: true });

    // Bouncing Code Blocks with 3D Parallax


    // Scroll indicator click
    const scrollIndicator = document.getElementById('scrollIndicator');
    scrollIndicator?.addEventListener('click', () => {
      document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
    });

    // Navigation active state
    const sections = document.querySelectorAll('section, #stackSection');
    const menuNavItems = document.querySelectorAll('.menu-nav-item');

    // Setup capsule text characters for wavy animation
    const capsuleItems = document.querySelectorAll('.capsule-item');
    capsuleItems.forEach(item => {
      const textNode = item.querySelector('.capsule-text');
      if (textNode) {
        const text = textNode.getAttribute('data-text') || textNode.textContent;
        textNode.innerHTML = '';
        text.split('').forEach((char, i) => {
          const span = document.createElement('span');
          span.textContent = char === ' ' ? '\u00A0' : char;
          span.className = 'capsule-char';
          span.style.animationDelay = `${i * 0.04}s`;
          textNode.appendChild(span);
        });
      }
    });

    let navScrollTicking = false;
    window.addEventListener('scroll', () => {
      if (!navScrollTicking) {
        window.requestAnimationFrame(() => {
          let current = '';

          sections.forEach(section => {
            // Use getBoundingClientRect().top for accurate viewport-relative offsets
            // Prevents nested elements like #stackSection from having falsely small offsetTops
            const top = section.getBoundingClientRect().top;
            if (top <= 200) {
              current = section.getAttribute('id');
            }
          });

          menuNavItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href').slice(1) === current) {
              item.classList.add('active');
            }
          });

          // Update capsule nav with wavy reveal re-trigger
          capsuleItems.forEach(item => {
            if (item.dataset.section === current) {
              if (!item.classList.contains('active')) {
                item.classList.add('active');
                // Retrigger animation by cloning text node
                const textNode = item.querySelector('.capsule-text');
                if (textNode) {
                  const clone = textNode.cloneNode(true);
                  textNode.parentNode.replaceChild(clone, textNode);
                }
              }
            } else {
              item.classList.remove('active');
            }
          });

          // Hide scroll indicator and hero elements after scrolling
          const scrollIndicator = document.getElementById('scrollIndicator');
          const heroNameSection = document.querySelector('.hero-name-section');
          const heroSocialLinks = document.querySelector('.hero-social-links');
          const heroButtons = document.querySelector('.hero-buttons');

          // Only hide the hero text when it's substantially scrolled out of view.
          if (window.scrollY > 50) {
            if (scrollIndicator) {
              scrollIndicator.style.opacity = '0';
              scrollIndicator.style.pointerEvents = 'none';
            }
          } else {
            if (scrollIndicator) {
              scrollIndicator.style.opacity = '1';
              scrollIndicator.style.pointerEvents = 'auto';
            }
          }

          if (document.documentElement.dataset.heroRedesign !== 'true') {
            if (window.scrollY > 400) {
              if (heroNameSection) { heroNameSection.style.opacity = '0'; heroNameSection.style.pointerEvents = 'none'; }
              if (heroSocialLinks) { heroSocialLinks.style.opacity = '0'; heroSocialLinks.style.pointerEvents = 'none'; }
              if (heroButtons) { heroButtons.style.opacity = '0'; heroButtons.style.pointerEvents = 'none'; }
            } else {
              if (heroNameSection) { heroNameSection.style.opacity = '1'; heroNameSection.style.pointerEvents = 'auto'; }
              if (heroSocialLinks) { heroSocialLinks.style.opacity = '1'; heroSocialLinks.style.pointerEvents = 'auto'; }
              if (heroButtons) { heroButtons.style.opacity = '1'; heroButtons.style.pointerEvents = 'auto'; }
            }
          }

          navScrollTicking = false;
        });
        navScrollTicking = true;
      }
    }, { passive: true });

    // Smooth scroll for hero menu
    menuNavItems.forEach(item => {
      item?.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(item.getAttribute('href'));
        target.scrollIntoView({ behavior: 'smooth' });
      });
    });

    // Capsule click navigation
    capsuleItems.forEach(item => {
      item?.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = item.dataset.section;
        const target = document.getElementById(sectionId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // Scramble text effect for section titles
    class TextScramble {
      constructor(el) {
        this.el = el;
        this.chars = '!<>-_\\/[]{}—=+*^?#________';
        this.originalText = el.textContent;
        this.update = this.update.bind(this);
      }

      setText(newText) {
        const oldText = this.el.textContent;
        const length = Math.max(oldText.length, newText.length);
        const promise = new Promise((resolve) => this.resolve = resolve);
        this.queue = [];

        for (let i = 0; i < length; i++) {
          const from = oldText[i] || '';
          const to = newText[i] || '';
          const start = Math.floor(Math.random() * 40);
          const end = start + Math.floor(Math.random() * 40);
          this.queue.push({ from, to, start, end });
        }

        cancelAnimationFrame(this.frameRequest);
        this.frame = 0;
        this.update();
        return promise;
      }

      update() {
        let output = '';
        let complete = 0;

        for (let i = 0, n = this.queue.length; i < n; i++) {
          let { from, to, start, end, char } = this.queue[i];

          if (this.frame >= end) {
            complete++;
            output += to;
          } else if (this.frame >= start) {
            if (!char || Math.random() < 0.28) {
              char = this.randomChar();
              this.queue[i].char = char;
            }
            output += `<span class="letter scrambling">${char}</span>`;
          } else {
            output += from;
          }
        }

        this.el.innerHTML = output;

        if (complete === this.queue.length) {
          this.resolve();
        } else {
          this.frameRequest = requestAnimationFrame(this.update);
          this.frame++;
        }
      }

      randomChar() {
        return this.chars[Math.floor(Math.random() * this.chars.length)];
      }
    }



    // GSAP ScrollTrigger Animations (Apple/NDS Hybrid)
    function initGSAPAnimations() {
      if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.warn('GSAP or ScrollTrigger not loaded yet.');
        return;
      }
      
      gsap.registerPlugin(ScrollTrigger);

      // Hero section subtle fade out on scroll
      if (document.documentElement.dataset.heroRedesign !== 'true') {
        gsap.to('.hero-content', {
          scrollTrigger: {
            trigger: '.hero-section',
            start: 'top top',
            end: 'bottom top',
            scrub: true
          },
          opacity: 0,
          y: -50
        });
      }

      // Project Cards Animation (Horizontal Scroll on Desktop, Fade Up on Mobile)
      const projectCards = gsap.utils.toArray('.project-card');
      const mm = gsap.matchMedia();
      const hasStudioMotion = document.documentElement.dataset.studioSystem === 'true';

      // The refreshed design has one native reveal observer. Do not register
      // the legacy project/about/experience ScrollTriggers underneath it.
      if (!hasStudioMotion) {
      mm.add("(min-width: 1024px)", () => {
        // Premium Vertical Cinematic Parallax
        if (projectCards.length > 0) {
          
          projectCards.forEach((card) => {
            // Setup initial state
            gsap.set(card, { 
              scale: 0.9, 
              opacity: 0.3,
              transformOrigin: "center center"
            });
            
            // 1. Scale & Fade In as it enters the viewport
            gsap.to(card, {
              scale: 1,
              opacity: 1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: card,
                start: "top 85%",      // starts appearing near bottom
                end: "center center",  // fully visible at center
                scrub: 1
              }
            });
            
            // 2. Subtle Parallax on the visual container
            const visual = card.querySelector('.project-visual');
            if (visual) {
              gsap.fromTo(visual, 
                { y: 50 }, 
                { 
                  y: -50,
                  ease: "none",
                  scrollTrigger: {
                    trigger: card,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1.5 // extremely smooth lag
                  }
                }
              );
            }
          });
        }
      });

      mm.add("(max-width: 1023px)", () => {
        // Staggered Fade Up for Mobile
        projectCards.forEach((card, i) => {
          gsap.fromTo(card, 
            { y: 100, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              ease: "power3.out",
              scrollTrigger: {
                trigger: card,
                start: "top 85%",
                toggleActions: "play none none reverse"
              }
            }
          );
        });
      });

      // About Text Reveal
      const aboutParagraphs = document.querySelectorAll('.about-paragraph, .section-title');
      aboutParagraphs.forEach((p, i) => {
        gsap.fromTo(p,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: {
              trigger: p,
              start: "top 90%",
              toggleActions: "play none none reverse"
            }
          }
        );
      });
      
      }

    }

    // Call on DOM ready or slightly after if script is deferred
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => { setTimeout(initGSAPAnimations, 100); });
    } else {
      setTimeout(initGSAPAnimations, 100);
    }

    // Copy email function
    function copyEmail() {
      const email = 'vimangau@gmail.com';
      navigator.clipboard.writeText(email).then(() => {
        const copyIcon = document.getElementById('copyIcon');
        const copyText = document.getElementById('copyText');

        // Change to checkmark
        copyIcon.className = 'ph-fill ph-check';
        copyText.textContent = 'Copied!';

        // Reset after 2 seconds
        setTimeout(() => {
          copyIcon.className = 'ph ph-copy';
          copyText.textContent = 'Copy';
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Email: vimangau@gmail.com');
      });
    }

    // Hero Particle Constellation
    class HeroParticles {
      constructor() {
        this.canvas = document.getElementById('hero-particles-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: -1000, y: -1000 };
        this.width = 0;
        this.height = 0;
        this.isVisible = true;
        this.time = 0;

        this.PARTICLE_COUNT = 80;
        this.CONNECTION_DIST = 140;
        this.MOUSE_DIST = 220;

        this.init();
      }

      init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
          this.mouse.x = e.clientX;
          this.mouse.y = e.clientY;
        });

        const heroSection = document.getElementById('home');
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            this.isVisible = entry.isIntersecting;
          });
        }, { threshold: 0.1 });

        if (heroSection) observer.observe(heroSection);
        this.animate();
      }

      resize() {
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
        this.createParticles();
      }

      createParticles() {
        this.particles = [];
        const count = Math.min(this.PARTICLE_COUNT, Math.floor((this.width * this.height) / 15000));
        for (let i = 0; i < count; i++) {
          this.particles.push({
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            size: Math.random() * 1.5 + 0.5,
            baseAlpha: Math.random() * 0.3 + 0.05,
            pulseOffset: Math.random() * Math.PI * 2
          });
        }
      }

      animate() {
        if (!this.isVisible) {
          requestAnimationFrame(() => this.animate());
          return;
        }

        this.time += 0.005;
        this.ctx.clearRect(0, 0, this.width, this.height);

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const dotColor = isDark ? '255, 255, 255' : '30, 30, 30';
        const lineColor = isDark ? '99, 102, 241' : '99, 102, 241';
        const accentColor = isDark ? '139, 92, 246' : '99, 102, 241';

        // Update and draw particles
        this.particles.forEach((p, i) => {
          // Drift movement
          p.x += p.vx;
          p.y += p.vy;

          // Wrap around edges
          if (p.x < 0) p.x = this.width;
          if (p.x > this.width) p.x = 0;
          if (p.y < 0) p.y = this.height;
          if (p.y > this.height) p.y = 0;

          // Mouse influence - gentle push
          const mdx = this.mouse.x - p.x;
          const mdy = this.mouse.y - p.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

          if (mdist < this.MOUSE_DIST && mdist > 0) {
            const force = (this.MOUSE_DIST - mdist) / this.MOUSE_DIST;
            p.vx -= (mdx / mdist) * force * 0.015;
            p.vy -= (mdy / mdist) * force * 0.015;
          }

          // Damping
          p.vx *= 0.998;
          p.vy *= 0.998;

          // Pulse
          const pulse = Math.sin(this.time * 2 + p.pulseOffset) * 0.5 + 0.5;
          const alpha = p.baseAlpha + pulse * 0.15;
          const size = p.size + pulse * 0.4;

          // Glow near cursor
          let glowAlpha = 0;
          if (mdist < this.MOUSE_DIST) {
            glowAlpha = (1 - mdist / this.MOUSE_DIST) * 0.5;
          }

          // Draw particle
          if (glowAlpha > 0) {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, size + 3, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${accentColor}, ${glowAlpha * 0.15})`;
            this.ctx.fill();
          }

          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
          this.ctx.fillStyle = `rgba(${glowAlpha > 0.1 ? accentColor : dotColor}, ${alpha + glowAlpha})`;
          this.ctx.fill();

          // Connections
          for (let j = i + 1; j < this.particles.length; j++) {
            const other = this.particles[j];
            const dx = p.x - other.x;
            const dy = p.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.CONNECTION_DIST) {
              const lineAlpha = (1 - dist / this.CONNECTION_DIST) * 0.12;

              // Brighten connections near mouse
              let boost = 0;
              const midX = (p.x + other.x) / 2;
              const midY = (p.y + other.y) / 2;
              const midDist = Math.sqrt((this.mouse.x - midX) ** 2 + (this.mouse.y - midY) ** 2);
              if (midDist < this.MOUSE_DIST) {
                boost = (1 - midDist / this.MOUSE_DIST) * 0.25;
              }

              this.ctx.beginPath();
              this.ctx.moveTo(p.x, p.y);
              this.ctx.lineTo(other.x, other.y);
              this.ctx.strokeStyle = `rgba(${boost > 0.05 ? lineColor : dotColor}, ${lineAlpha + boost})`;
              this.ctx.lineWidth = 0.6;
              this.ctx.stroke();
            }
          }
        });

        requestAnimationFrame(() => this.animate());
      }
    }

    // Hero UI Parallax Effect (Name, Buttons, Socials follow cursor)
    function initHeroParallax() {
      if (document.documentElement.dataset.heroRedesign === 'true') return;
      const heroSection = document.querySelector('.hero-section');
      const nameSection = document.querySelector('.hero-name-section');
      const buttonsSection = document.querySelector('.hero-buttons');
      const socialSection = document.querySelector('.hero-social-links');

      if (!heroSection || !nameSection) return;

      let mouseX = 0;
      let mouseY = 0;
      let currentX = 0;
      let currentY = 0;
      let isInHero = true;

      const lerp = (start, end, factor) => start + (end - start) * factor;

      window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = (e.clientY / window.innerHeight) * 2 - 1;
      });

      // Check if we're in hero section
      const observer = new IntersectionObserver((entries) => {
        isInHero = entries[0].isIntersecting;
        if (!isInHero) {
          // Reset transforms when leaving hero
          if (nameSection) nameSection.style.transform = '';
          if (buttonsSection) buttonsSection.style.transform = '';
          if (socialSection) socialSection.style.transform = '';
        }
      }, { threshold: 0.5 });
      observer.observe(heroSection);

      let parallaxLastTime = 0;

      function animateParallax(timestamp) {
        if (!isInHero) {
          requestAnimationFrame(animateParallax);
          return;
        }

        // Delta time for frame-rate independence
        if (!parallaxLastTime) parallaxLastTime = timestamp;
        const deltaTime = (timestamp - parallaxLastTime) / 16.67 || 1;
        parallaxLastTime = timestamp;

        // Adjust lerp factor for frame-rate independence
        const baseFactor = 0.08;
        const adjustedFactor = 1 - Math.pow(1 - baseFactor, deltaTime);

        currentX = lerp(currentX, mouseX, adjustedFactor);
        currentY = lerp(currentY, mouseY, adjustedFactor);

        // Movement values - subtle enough to not affect usability
        if (nameSection) {
          nameSection.style.transform = `translate(${currentX * 15}px, ${currentY * 15}px)`;
        }
        if (buttonsSection) {
          buttonsSection.style.transform = `translate(${currentX * 10}px, ${currentY * 10}px)`;
        }
        if (socialSection) {
          socialSection.style.transform = `translate(${currentX * 12}px, ${currentY * 12}px)`;
        }

        requestAnimationFrame(animateParallax);
      }

      animateParallax();
    }

    // Initialize Hero Particles, Cursor Glow, and Parallax
    window.addEventListener('load', () => {
      if (document.documentElement.dataset.heroRedesign !== 'true') new HeroParticles();
      initHeroParallax();
    });

    // Hero video background — smooth crossfade with preloading
    (function initHeroVideo() {
      const heroSection = document.querySelector('.hero-section');
      const videoA = document.getElementById('heroVideoA');
      const videoB = document.getElementById('heroVideoB');
      if (!heroSection || !videoA || !videoB) return;
      if (document.documentElement.dataset.studioSystem === 'true') return;

      const sources = [
        'videos/hero-optimized/vecteezy_abstract-light-blue-and-black-shape-waving-gently-on-a-dark_71755160_hero.mp4',
        'videos/hero-optimized/vecteezy_abstract-liquid-metal-with-smooth-curves-and-golden-accents_71754900_hero.mp4',
        'videos/hero-optimized/vecteezy_abstract-metallic-liquid-flowing-with-blue-and-golden_71754937_hero.mp4',
        'videos/hero-optimized/vecteezy_abstract-metallic-whirlpool-in-warm-bronze-tones_52447248_hero.mp4',
        'videos/hero-optimized/vecteezy_abstract-shiny-liquid-flow-with-reflections-on-a-dark_72005629_hero.mp4'
      ];

      // These files are very large. Rotating/crossfading forces additional downloads/decodes
      // and commonly causes buffering hangs on slow connections or low-end devices.
      const prefersReducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const isSlowConnection = !!(
        connection && (
          connection.saveData ||
          (typeof connection.effectiveType === 'string' && /(^|\b)(2g|3g)(\b|$)/i.test(connection.effectiveType)) ||
          (typeof connection.downlink === 'number' && connection.downlink > 0 && connection.downlink < 5)
        )
      );
      const isLowMemoryDevice = (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory > 0 && navigator.deviceMemory <= 4);
      const enableRotation = !(prefersReducedMotion || isSlowConnection || isLowMemoryDevice);

      let order = [];
      let idx = 0;
      let currentSrc = '';
      let activeEl = videoA;
      let standbyEl = videoB;
      let busy = false;
      let preloadTimer = null;
      let fadeTimer = null;
      let nextReady = null;          // Promise that resolves when standby is buffered
      const DISPLAY_MS = 15000;   // how long each video stays visible
      const PRELOAD_MS = 2500;    // start preloading this long before the fade
      const FADE_MS = 1500;    // CSS transition duration

      // Pause/stop work when hero is off-screen or tab is hidden.
      let isPlaybackAllowed = true;

      function pauseAll() {
        try { videoA.pause(); } catch (_) { }
        try { videoB.pause(); } catch (_) { }
      }

      function resumeActive() {
        if (!isPlaybackAllowed) return;
        try { activeEl.play(); } catch (_) { }
      }

      // IntersectionObserver to avoid decoding/downloading videos when not visible
      try {
        const visObserver = new IntersectionObserver((entries) => {
          const entry = entries[0];
          const inView = !!(entry && entry.isIntersecting);
          if (!inView) {
            isPlaybackAllowed = false;
            clearTimers();
            pauseAll();
            return;
          }
          isPlaybackAllowed = true;
          resumeActive();
          schedulePreloadAndFade();
        }, { threshold: 0.25 });
        visObserver.observe(heroSection);
      } catch (_) {
        // Older browsers: just keep going
      }

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          isPlaybackAllowed = false;
          clearTimers();
          pauseAll();
        } else {
          isPlaybackAllowed = true;
          resumeActive();
          schedulePreloadAndFade();
        }
      });

      /* ---- helpers ---- */
      function shuffle(a) {
        const arr = a.slice();
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      }

      function pickNext() {
        if (!order.length || idx >= order.length) {
          order = shuffle(sources);
          if (order.length > 1 && order[0] === currentSrc) {
            [order[0], order[1]] = [order[1], order[0]];
          }
          idx = 0;
        }
        return order[idx++];
      }

      /**
       * Release a video element.
       * We unload the src during idle time to prevent memory/decoder buildup,
       * but avoid doing it during the fade (which can cause a visible stutter).
       */
      function releaseVideo(el) {
        try { el.pause(); } catch (_) { }
        try { el.currentTime = 0; } catch (_) { }

        const unload = () => {
          try { el.removeAttribute('src'); } catch (_) { }
          try { el.load(); } catch (_) { }
          try { el.preload = 'none'; } catch (_) { }
        };

        if (typeof window.requestIdleCallback === 'function') {
          window.requestIdleCallback(unload, { timeout: 2000 });
        } else {
          setTimeout(unload, 250);
        }
      }

      function waitForFirstFrame(el, timeoutMs = 1200) {
        return new Promise(resolve => {
          let done = false;
          const finish = () => {
            if (done) return;
            done = true;
            clearTimeout(t);
            resolve();
          };
          const t = setTimeout(finish, timeoutMs);

          if (typeof el.requestVideoFrameCallback === 'function') {
            try { el.requestVideoFrameCallback(() => finish()); } catch (_) { finish(); }
          } else {
            requestAnimationFrame(() => finish());
          }
        });
      }

      /**
       * Load + buffer a video element.
       * Resolves { ok: true/false, src } when ready.
       */
      function prepareVideo(el, src) {
        return new Promise(resolve => {
          let settled = false;
          const finish = (ok) => {
            if (settled) return;
            settled = true;
            clearTimeout(safety);
            el.removeEventListener('canplay', onReady);
            el.removeEventListener('error', onError);
            resolve({ ok, src });
          };
          const onReady = () => finish(true);
          const onError = () => finish(false);
          // Safety net: on some hosts `canplaythrough` may never fire.
          // `canplay` is a better practical signal that playback can start.
          const safety = setTimeout(() => finish(el.readyState >= 3), 10000);

          el?.addEventListener('canplay', onReady, { once: true });
          el?.addEventListener('error', onError, { once: true });

          el.preload = 'auto';
          el.loop = true;
          el.muted = true;
          el.playsInline = true;
          el.src = src;
          el.load();

          // Already buffered (e.g. from browser cache)
          if (el.readyState >= 3) finish(true);
        });
      }

      /* ---- scheduling ---- */
      function schedulePreloadAndFade() {
        if (!isPlaybackAllowed) return;
        if (!enableRotation) return;
        clearTimers();
        // After (DISPLAY_MS - PRELOAD_MS), start preloading the next video
        preloadTimer = setTimeout(() => {
          if (!isPlaybackAllowed) return;
          const src = pickNext();
          nextReady = prepareVideo(standbyEl, src);
        }, Math.max(DISPLAY_MS - PRELOAD_MS, 1000));

        // After DISPLAY_MS, execute the crossfade (preload should be done by now)
        fadeTimer = setTimeout(crossfade, DISPLAY_MS);
      }

      function clearTimers() {
        if (preloadTimer) { clearTimeout(preloadTimer); preloadTimer = null; }
        if (fadeTimer) { clearTimeout(fadeTimer); fadeTimer = null; }
      }

      /* ---- crossfade ---- */
      async function crossfade() {
        if (!isPlaybackAllowed) return;
        if (!enableRotation) return;
        if (busy) return;
        busy = true;

        // If preloading hasn't started yet (shouldn't happen, but be safe)
        if (!nextReady) {
          const src = pickNext();
          nextReady = prepareVideo(standbyEl, src);
        }

        // Wait for preload to finish (usually already resolved)
        const result = await nextReady;
        nextReady = null;

        if (!result.ok) {
          busy = false;
          schedulePreloadAndFade();
          return;
        }

        currentSrc = result.src;

        // Start playing while still invisible
        standbyEl.currentTime = 0;
        try { await standbyEl.play(); } catch (_) { }

        // Wait for the first decoded frame so we don't fade to a frozen poster.
        await waitForFirstFrame(standbyEl);

        // Let a few frames decode before we make it visible — prevents a
        // blank/frozen flash during the crossfade.
        await new Promise(r => {
          requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)));
        });

        // Crossfade
        standbyEl.classList.add('is-visible');
        activeEl.classList.remove('is-visible');
        heroSection.classList.add('video-active');

        // Wait for CSS fade to finish, then clean up the old element
        // Use rAF instead of a raw setTimeout so the cleanup doesn't
        // compete with the compositor during the fade animation.
        await new Promise(r => setTimeout(r, FADE_MS + 200));

        // Release old element gently (no empty-src reload)
        releaseVideo(activeEl);

        // Swap roles
        const tmp = activeEl;
        activeEl = standbyEl;
        standbyEl = tmp;

        busy = false;
        schedulePreloadAndFade();
      }

      /* ---- bootstrap ---- */
      async function start() {
        const src = pickNext();
        currentSrc = src;
        const result = await prepareVideo(activeEl, src);
        if (!result.ok) { if (enableRotation) schedulePreloadAndFade(); return; }
        try { await activeEl.play(); } catch (_) { }
        await waitForFirstFrame(activeEl);
        activeEl.classList.add('is-visible');
        heroSection.classList.add('video-active');
        if (enableRotation) schedulePreloadAndFade();
      }

      start();
    })();

    // Timeline Scroll Animation with Circle Filling - Zen & Proportional
    // Timeline Scroll Animation with Circle Filling - Zen & Proportional
    function initTimelineAnimation() {
      const timelineWrapper = document.getElementById('timelineWrapper');
      const timeline = document.querySelector('.timeline');
      const timelineItems = document.querySelectorAll('.timeline-item');

      if (!timelineWrapper || !timeline || timelineItems.length === 0) return;

      function updateTimelineProgress() {
        const timelineRect = timeline.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const timelineTop = timelineRect.top;
        const timelineBottom = timelineRect.bottom;
        const timelineHeight = timelineRect.height;

        // Calculate progress: line should reach 100% when the bottom of timeline reaches top of viewport
        // Start: When top of timeline reaches bottom of viewport (progress = 0%)
        // End: When bottom of timeline reaches top of viewport (progress = 100%)

        let scrollProgress = 0;

        if (timelineTop < windowHeight && timelineBottom > 0) {
          // Timeline is visible in viewport
          const scrollableDistance = timelineHeight + windowHeight;
          const scrolled = windowHeight - timelineTop;
          scrollProgress = Math.max(0, Math.min(1, scrolled / scrollableDistance));
        } else if (timelineBottom <= 0) {
          // Timeline has scrolled past (fully above viewport)
          scrollProgress = 1;
        }

        // Apply smoothstep easing for zen-like feel
        const easedProgress = scrollProgress * scrollProgress * (3 - 2 * scrollProgress);

        // Update CSS variable for the progress line
        document.documentElement.style.setProperty('--timeline-scroll-progress', `${easedProgress * 100}%`);

        // Activate circles individually as they reach 60% of viewport
        timelineItems.forEach((item) => {
          const itemRect = item.getBoundingClientRect();
          const itemTop = itemRect.top;
          const triggerPoint = windowHeight * 0.6;

          if (itemTop < triggerPoint) {
            item.classList.add('active');
          } else {
            item.classList.remove('active');
          }
        });
      }

      // Throttled scroll handler for performance
      let ticking = false;
      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            updateTimelineProgress();
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });

      // Update on resize
      window.addEventListener('resize', updateTimelineProgress, { passive: true });

      // Initial update
      // Initial update
      updateTimelineProgress();
    }

    // Initialize timeline animation when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initTimelineAnimation);
    } else {
      initTimelineAnimation();
    }

    // Draggable Cards for Research Section
    function initDraggableCards() {
      const container = document.getElementById('researchCanvas');
      if (!container) return;

      const cards = container.querySelectorAll('.draggable-card');

      cards.forEach(card => {
        // Set initial position and rotation from data attributes
        const rotation = card.dataset.rotation || 0;
        const top = card.dataset.top;
        const bottom = card.dataset.bottom;
        const left = card.dataset.left;

        if (top) card.style.top = top;
        if (bottom) card.style.bottom = bottom;
        if (left) card.style.left = left;
        card.style.transform = `rotate(${rotation}deg)`;
        card.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

        // Magnetic hover effect
        card?.addEventListener('mousemove', (e) => {
          if (card.classList.contains('dragging')) return;
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          const maxMove = 8;
          const moveX = (x / rect.width) * maxMove;
          const moveY = (y / rect.height) * maxMove;
          card.style.transform = `rotate(${rotation}deg) translate(${moveX}px, ${moveY}px)`;
        });

        card?.addEventListener('mouseleave', () => {
          if (card.classList.contains('dragging')) return;
          card.style.transform = `rotate(${rotation}deg)`;
        });

        let isDragging = false;
        let currentX = 0;
        let currentY = 0;
        let initialX = 0;
        let initialY = 0;

        // Mouse events
        card?.addEventListener('mousedown', (e) => {
          isDragging = true;
          card.style.zIndex = 1000;
          card.classList.add('dragging');
          card.style.transition = 'none';

          // Get current position
          const rect = card.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();

          initialX = e.clientX - rect.left;
          initialY = e.clientY - rect.top;

          currentX = rect.left - containerRect.left;
          currentY = rect.top - containerRect.top;

          card.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
          if (!isDragging) return;

          e.preventDefault();

          const containerRect = container.getBoundingClientRect();
          const cardRect = card.getBoundingClientRect();

          // Calculate new position
          let newX = e.clientX - containerRect.left - initialX;
          let newY = e.clientY - containerRect.top - initialY;

          // Constrain to container bounds
          const maxX = containerRect.width - cardRect.width;
          const maxY = containerRect.height - cardRect.height;

          newX = Math.max(0, Math.min(newX, maxX));
          newY = Math.max(0, Math.min(newY, maxY));

          // Update position
          card.style.left = `${newX}px`;
          card.style.top = `${newY}px`;
          card.style.bottom = 'auto'; // Remove bottom positioning when dragging
        });

        document.addEventListener('mouseup', () => {
          if (isDragging) {
            isDragging = false;
            card.classList.remove('dragging');
            card.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            card.style.cursor = 'grab';
            card.style.zIndex = 1;
          }
        });

        // Touch events for mobile
        card?.addEventListener('touchstart', (e) => {
          isDragging = true;
          card.style.zIndex = 1000;

          const touch = e.touches[0];
          const rect = card.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();

          initialX = touch.clientX - rect.left;
          initialY = touch.clientY - rect.top;

          currentX = rect.left - containerRect.left;
          currentY = rect.top - containerRect.top;
        });

        document.addEventListener('touchmove', (e) => {
          if (!isDragging) return;

          e.preventDefault();

          const touch = e.touches[0];
          const containerRect = container.getBoundingClientRect();
          const cardRect = card.getBoundingClientRect();

          let newX = touch.clientX - containerRect.left - initialX;
          let newY = touch.clientY - containerRect.top - initialY;

          const maxX = containerRect.width - cardRect.width;
          const maxY = containerRect.height - cardRect.height;

          newX = Math.max(0, Math.min(newX, maxX));
          newY = Math.max(0, Math.min(newY, maxY));

          card.style.left = `${newX}px`;
          card.style.top = `${newY}px`;
          card.style.bottom = 'auto';
        }, { passive: false });

        document.addEventListener('touchend', () => {
          if (isDragging) {
            isDragging = false;
            card.style.zIndex = 1;
          }
        });
      });
    }

    // Initialize draggable cards when page loads
    window.addEventListener('load', () => {
      initDraggableCards();
    });

    // ============================================
    // STACKING CARDS — ScrollTrigger Implementation
    // ============================================
    function initStackingCards() {
      const section = document.getElementById('stackSection');
      const container = document.getElementById('stackCards');
      if (!section || !container) return;

      const cards = gsap.utils.toArray(container.querySelectorAll('.stack-card'));
      if (cards.length === 0) return;

      if (window.matchMedia("(max-width: 768px)").matches) {
        gsap.set(cards, { clearProps: "all" });
        return;
      }

      // Park every card a full viewport to the right of the column. A modest
      // xPercent offset is not enough on short/narrow laptops: the last card
      // (highest z-index) peeks in from the viewport edge before the pin.
      gsap.set(cards, {
        x: () => window.innerWidth,
        y: 0,
        xPercent: 100,
        rotation: 8,
        autoAlpha: 1,
        visibility: "visible",
        transformOrigin: "center center"
      });

      // Create a timeline to handle the pinning and sequential animation flawlessly
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 10%",
          end: "+=250%", // How long to stay pinned (2.5x viewport height)
          pin: true,
          scrub: 1,
          anticipatePin: 1
        }
      });

      // Animate the lead card into the blank column, then build the stack.
      cards.forEach((card, index) => {
        const i = index;
        const stackOffsetX = i * 12;
        const stackOffsetY = i * 16;
        const stackRot = (i % 2 === 0 ? -1 : 1) * (i * 0.8);

        const position = index * 0.8;
        tl.to(card, {
          xPercent: 0,
          x: stackOffsetX,
          y: stackOffsetY,
          rotation: stackRot,
          ease: "power2.out",
          duration: 1
        }, position); // stagger them nicely on the timeline
      });
    }

    // ============================================
    // HORIZONTAL PROJECTS — ScrollTrigger Implementation
    // ============================================
    function initHorizontalProjects() {
      const wrapper = document.getElementById('projectsBorderWrapper');
      const track = document.getElementById('projectGridTrack');
      
      if (!wrapper || !track) return;
      
      const cards = Array.from(track.querySelectorAll('.project-card'));
      if (cards.length === 0) return;

      // Implement the Carousel Coverflow "Pop" Effect using pure native math for flawless accuracy
      const updateCardPopEffect = () => {
        const viewportCenter = window.innerWidth / 2;
        const maxDiff = window.innerWidth * 0.6; // Distance at which a card is fully "dull"
        
        cards.forEach((card) => {
          const rect = card.getBoundingClientRect();
          const cardCenter = rect.left + rect.width / 2;
          const diff = Math.abs(viewportCenter - cardCenter);
          
          // Calculate progress from 0 (edge) to 1 (center)
          let progress = Math.max(0, 1 - (diff / maxDiff));
          // Apply a gentle ease curve for a smoother visual transition
          progress = Math.pow(progress, 1.2); 
          
          const scale = 0.93 + (0.07 * progress);
          const opacity = 0.5 + (0.5 * progress);
          
          card.style.transform = `scale(${scale})`;
          card.style.opacity = opacity;
          
          // CRITICAL: Disable pointer events (like CSS hover) if the card is not fully active.
          // This prevents the jarring issue where hovering over the tiny peeking edge 
          // of a background card causes it to light up and rotate.
          card.style.pointerEvents = progress > 0.8 ? "auto" : "none";
        });
      };

      // Run immediately on load to set initial states perfectly
      updateCardPopEffect();

      // Hook up to native scroll and resize with requestAnimationFrame for 60fps buttery smoothness
      wrapper.addEventListener('scroll', () => requestAnimationFrame(updateCardPopEffect), { passive: true });
      window.addEventListener('resize', () => requestAnimationFrame(updateCardPopEffect), { passive: true });

      // Navigation Buttons Logic
      const prevBtn = document.getElementById('projectNavPrev');
      const nextBtn = document.getElementById('projectNavNext');
      
      if (prevBtn && nextBtn) {
        const updateNavButtons = () => {
          // Use a generous 5vw tolerance (approx 50-100px) because browser scroll-snap 
          // sometimes rests slightly off zero depending on screen width.
          const tolerance = window.innerWidth * 0.05; 
          const atStart = wrapper.scrollLeft <= tolerance;
          const atEnd = Math.abs(wrapper.scrollWidth - wrapper.clientWidth - wrapper.scrollLeft) <= tolerance;
          
          prevBtn.style.opacity = atStart ? "0.3" : "1";
          prevBtn.style.pointerEvents = atStart ? "none" : "auto";
          
          nextBtn.style.opacity = atEnd ? "0.3" : "1";
          nextBtn.style.pointerEvents = atEnd ? "none" : "auto";
        };

        // Run initially to set the correct state
        updateNavButtons();

        // Listen for scroll and resize to continually update the state
        wrapper.addEventListener('scroll', updateNavButtons, { passive: true });
        window.addEventListener('resize', updateNavButtons, { passive: true });

        prevBtn.addEventListener('click', () => {
          // Measure the real card step so navigation remains exact after responsive sizing.
          const scrollAmount = cards.length > 1
            ? cards[1].offsetLeft - cards[0].offsetLeft
            : cards[0].offsetWidth;
          wrapper.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });
        
        nextBtn.addEventListener('click', () => {
          const scrollAmount = cards.length > 1
            ? cards[1].offsetLeft - cards[0].offsetLeft
            : cards[0].offsetWidth;
          wrapper.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });
      }
    }

    // Initialize stacking cards & horizontal projects
    window.addEventListener('load', () => {
      initStackingCards();
      
      // Only init horizontal scroll on larger screens where it makes sense
      if (window.matchMedia("(min-width: 900px)").matches) {
        initHorizontalProjects();
      }
      
      // Ensure all ScrollTriggers are refreshed after layout changes
      setTimeout(() => ScrollTrigger.refresh(), 100);
    });

    // Reinitialize on resize (handle mobile breakpoint)
    window.addEventListener('resize', () => {
      const cards = document.querySelectorAll('.stack-card');
      if (window.innerWidth <= 768) {
        cards.forEach(card => card.style.transform = '');
      }
    });

    // Contact Form Submission
    const contactForm = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const contactAlert = document.getElementById('contactAlert');

    if (contactForm) {
      contactForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Add sending animation
        submitBtn.classList.add('sending');
        submitBtn.disabled = true;

        try {
          // Get form data
          const formData = new FormData(contactForm);

          // Submit to Formspree
          const response = await fetch('https://formspree.io/f/xvgwddda', {
            method: 'POST',
            body: formData,
            headers: {
              'Accept': 'application/json'
            }
          });

          // Wait for animation to complete
          await new Promise(resolve => setTimeout(resolve, 1200));

          if (response.ok) {
            // Show success state
            submitBtn.classList.remove('sending');
            submitBtn.classList.add('success');
            // Hide text entirely so it doesn't overlap with the checkmark SVG
            btnText.style.display = 'none';

            // Show success alert
            showAlert('success', 'Your message has been sent successfully! I\'ll get back to you soon.');

            // Reset form
            contactForm.reset();

            // Reset button after delay
            setTimeout(() => {
              submitBtn.classList.remove('success');
              btnText.style.display = '';
              btnText.textContent = 'SEND';
              submitBtn.disabled = false;
            }, 2500);
          } else {
            submitBtn.classList.remove('sending');
            btnText.textContent = 'SEND';
            submitBtn.disabled = false;
            showAlert('error', 'Oops! Something went wrong. Please try again.');
          }
        } catch (error) {
          console.error('Form submission error:', error);
          submitBtn.classList.remove('sending');
          btnText.textContent = 'SEND';
          submitBtn.disabled = false;
          showAlert('error', 'Network error. Please check your connection and try again.');
        }
      });
    }

    function showAlert(type, message) {
      if (!contactAlert) return;

      const alertMessage = contactAlert.querySelector('span');
      const alertIcon = contactAlert.querySelector('i');

      // Set message
      if (alertMessage) alertMessage.textContent = message;

      // Set icon based on type
      if (alertIcon) {
        alertIcon.className = type === 'success' ? 'ph-fill ph-check-circle' : 'ph-fill ph-warning-circle';
      }

      // Set color via active class
      if (type === 'success') {
        contactAlert.style.color = '#10b981';
      } else {
        contactAlert.style.color = '#dc2626';
      }

      // Show alert
      contactAlert.style.display = 'flex';

      // Hide after 5 seconds
      setTimeout(() => {
        contactAlert.style.opacity = '0';
        setTimeout(() => {
          contactAlert.style.display = 'none';
          contactAlert.style.opacity = '1';
        }, 300);
      }, 5000);
    }

    // Copy to Clipboard Function
    // Accepts text and optional event (when invoked via onclick="copyToClipboard(..., event)")
    function copyToClipboard(text, evt) {
      // Try to resolve the button element robustly
      let copyBtn = null;
      if (evt && evt.target) {
        copyBtn = evt.target.closest && evt.target.closest('.copy-btn');
      }

      // Fallback: find the first .copy-btn near a mailto link matching the text
      if (!copyBtn) {
        const anchors = document.querySelectorAll('a[href^="mailto:"]');
        for (const a of anchors) {
          if (a.href && a.href.includes(text)) {
            // look for a sibling .copy-btn
            const parent = a.closest('.info-value-with-copy');
            if (parent) {
              copyBtn = parent.querySelector('.copy-btn');
              break;
            }
          }
        }
      }

      navigator.clipboard.writeText(text).then(() => {
        try {
          if (copyBtn) {
            const icon = copyBtn.querySelector('i');
            if (icon) {
              const originalClass = icon.className;
              icon.className = 'ph-fill ph-check';
              copyBtn.classList.add('copied');

              const originalBg = copyBtn.style.background;
              copyBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
              copyBtn.style.borderColor = '#10b981';

              setTimeout(() => {
                icon.className = originalClass;
                copyBtn.classList.remove('copied');
                copyBtn.style.background = originalBg;
                copyBtn.style.borderColor = '';
              }, 2000);
            }
          }
        } catch (e) {
          // Non-fatal: icon/UI update failed
          console.warn('copyToClipboard: UI feedback update failed', e);
        }
      }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy email. Please copy manually: ' + text);
      });
    }



    // Character Count Indicator with Progress Bar
    const messageTextarea = document.getElementById('message');
    const wordCountText = document.getElementById('wordCountText');
    const wordCountFill = document.getElementById('wordCountFill');
    const CHAR_LIMIT = 500;

    function updateWordCount() {
      if (!messageTextarea || !wordCountText || !wordCountFill) return;

      const text = messageTextarea.value;
      const charCount = text.length;

      // Update the count display (current/limit format)
      wordCountText.textContent = `${charCount}/${CHAR_LIMIT}`;

      // Calculate fill percentage (cap at 100%)
      const fillPercent = Math.min((charCount / CHAR_LIMIT) * 100, 100);
      wordCountFill.style.width = `${fillPercent}%`;

      // Remove all status classes
      wordCountText.classList.remove('status-green', 'status-yellow', 'status-red');
      wordCountFill.classList.remove('status-green', 'status-yellow', 'status-red');

      // Add appropriate status class based on percentage
      let statusClass;
      if (fillPercent <= 50) {
        statusClass = 'status-green';
      } else if (fillPercent <= 80) {
        statusClass = 'status-yellow';
      } else {
        statusClass = 'status-red';
      }

      wordCountText.classList.add(statusClass);
      wordCountFill.classList.add(statusClass);
    }

    // Listen for input changes
    if (messageTextarea) {
      messageTextarea?.addEventListener('input', updateWordCount);
      // Initialize on page load
      updateWordCount();
    }

    // Scroll-Reveal Text Highlighting
    function initScrollRevealText() {
      const scrollRevealElements = document.querySelectorAll('.scroll-reveal-text');

      scrollRevealElements.forEach(element => {
        // Get the HTML content and wrap words in spans while preserving HTML tags
        const html = element.innerHTML;

        // Split by HTML tags to preserve them
        const parts = html.split(/(<[^>]+>)/g);

        let wrappedHTML = '';
        parts.forEach(part => {
          if (part.startsWith('<')) {
            // This is an HTML tag, keep it as is
            wrappedHTML += part;
          } else {
            // This is text, wrap each word
            const words = part.split(/(\s+)/);
            words.forEach(word => {
              if (word.trim() && !/^\s+$/.test(word)) {
                wrappedHTML += `<span class="reveal-word">${word}</span>`;
              } else {
                wrappedHTML += word;
              }
            });
          }
        });

        element.innerHTML = wrappedHTML;
      });
    }

    // Initialize on DOM ready
    initScrollRevealText();

    const scrollRevealElements = document.querySelectorAll('.scroll-reveal-text');
    let visibleRevealElements = new Set();
    
    const textRevealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          visibleRevealElements.add(entry.target);
        } else {
          visibleRevealElements.delete(entry.target);
        }
      });
    }, { threshold: 0 });
    
    scrollRevealElements.forEach(el => textRevealObserver.observe(el));

    function updateScrollReveal() {
      if (visibleRevealElements.size === 0) return;
      const windowHeight = window.innerHeight;
      const focusTop = windowHeight * 0.3;
      const focusBottom = windowHeight * 0.7;

      visibleRevealElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const elementCenter = rect.top + rect.height / 2;
        const words = element.querySelectorAll('.reveal-word');

        if (elementCenter < focusTop) {
          words.forEach(word => word.classList.add('highlighted'));
        } else if (elementCenter > focusBottom) {
          words.forEach(word => word.classList.remove('highlighted'));
        } else {
          const progress = (focusBottom - elementCenter) / (focusBottom - focusTop);
          const totalWords = words.length;
          const wordsToHighlight = Math.ceil(progress * totalWords);

          words.forEach((word, index) => {
            if (index < wordsToHighlight) {
              word.classList.add('highlighted');
            } else {
              word.classList.remove('highlighted');
            }
          });
        }
      });
    }

    let revealTicking = false;
    window.addEventListener('scroll', () => {
      if (!revealTicking && visibleRevealElements.size > 0) {
        window.requestAnimationFrame(() => {
          updateScrollReveal();
          revealTicking = false;
        });
        revealTicking = true;
      }
    }, { passive: true });
    updateScrollReveal();

    // Projects Section Scroll-Animated Border
    const projectsBorderWrapper = document.getElementById('projectsBorderWrapper');
    const projectsSection = document.getElementById('projects');

    function updateProjectsBorder() {
      if (!projectsBorderWrapper || !projectsSection) return;

      // On desktop, we use a pinned horizontal scroll layout, so we don't want the borders to shrink
      if (window.innerWidth > 900) {
        projectsBorderWrapper.style.marginLeft = '0px';
        projectsBorderWrapper.style.marginRight = '0px';
        projectsBorderWrapper.style.borderRadius = '0px';
        return;
      }

      const windowHeight = window.innerHeight;
      const sectionRect = projectsSection.getBoundingClientRect();

      // Calculate how far we've scrolled into the section
      // Start animation when section top is at 100% of viewport (just entering)
      // End animation when section top is at 15% of viewport
      const startPoint = windowHeight * 1.0;
      const endPoint = windowHeight * 0.15;

      // Calculate progress (0 = not yet visible, 1 = fully in view)
      let progress = 0;
      if (sectionRect.top < startPoint && sectionRect.top > endPoint) {
        progress = (startPoint - sectionRect.top) / (startPoint - endPoint);
      } else if (sectionRect.top <= endPoint) {
        progress = 1;
      }

      // Clamp progress between 0 and 1
      progress = Math.max(0, Math.min(1, progress));

      // Easing function for smoother animation
      const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(progress);

      // Animate margin (from 0 to 80px) and border-radius (from 0 to 32px)
      // Starts edge-to-edge and shrinks inward as you scroll
      const maxMargin = 80;
      const maxBorderRadius = 32;

      const currentMargin = easedProgress * maxMargin;
      const currentBorderRadius = easedProgress * maxBorderRadius;

      projectsBorderWrapper.style.marginLeft = `${currentMargin}px`;
      projectsBorderWrapper.style.marginRight = `${currentMargin}px`;
      projectsBorderWrapper.style.borderRadius = `${currentBorderRadius}px`;
    }

    let borderTicking = false;
    let isProjectsVisible = false;
    
    if (projectsSection) {
      const borderObserver = new IntersectionObserver((entries) => {
        isProjectsVisible = entries[0].isIntersecting;
      }, { threshold: 0, rootMargin: '200px 0px' });
      borderObserver.observe(projectsSection);
    }

    window.addEventListener('scroll', () => {
      if (!borderTicking && isProjectsVisible) {
        window.requestAnimationFrame(() => {
          updateProjectsBorder();
          borderTicking = false;
        });
        borderTicking = true;
      }
    }, { passive: true });
    updateProjectsBorder();

    // ============================================
    // EXPERIENCE TIMELINE - Scroll-Based Progress & Card Animation
    // ============================================
    const expTimeline = document.getElementById('experienceTimeline');
    const expTimelineItems = document.querySelectorAll('.exp-timeline-item');

    function updateExperienceTimeline() {
      if (!expTimeline || expTimelineItems.length === 0) return;

      const timelineRect = expTimeline.getBoundingClientRect();
      const timelineHeight = expTimeline.offsetHeight;
      const windowHeight = window.innerHeight;

      // Calculate how much of the timeline has been scrolled through
      // Progress starts when timeline top hits 70% of viewport
      const startTrigger = windowHeight * 0.7;
      const endTrigger = windowHeight * 0.3;

      let progressPixels = 0;
      if (timelineRect.top < startTrigger) {
        progressPixels = startTrigger - timelineRect.top;
      }

      // Clamp progress to timeline height
      const progressPercent = Math.min(Math.max(progressPixels / timelineHeight * 100, 0), 100);

      // Update CSS variable for progress line
      expTimeline.style.setProperty('--timeline-progress', `${progressPercent}%`);

      // Update each timeline item's active state
      expTimelineItems.forEach((item) => {
        const dot = item.querySelector('.exp-timeline-dot');
        if (!dot) return;

        const dotRect = dot.getBoundingClientRect();
        const dotCenterY = dotRect.top + dotRect.height / 2;

        // Card becomes active when progress line passes its dot
        // Dot is considered "passed" when it's above 60% of viewport
        if (dotCenterY < windowHeight * 0.6) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }

    let expTimelineTicking = false;
    let isExpVisible = false;
    
    if (expTimeline) {
      const expObserver = new IntersectionObserver((entries) => {
        isExpVisible = entries[0].isIntersecting;
      }, { threshold: 0, rootMargin: '200px 0px' });
      expObserver.observe(expTimeline);
    }

    function onExpTimelineScroll() {
      if (!expTimelineTicking && isExpVisible) {
        requestAnimationFrame(() => {
          updateExperienceTimeline();
          expTimelineTicking = false;
        });
        expTimelineTicking = true;
      }
    }

    window.addEventListener('scroll', onExpTimelineScroll, { passive: true });
    updateExperienceTimeline();

    // ============================================
    // TITLE ROTATOR (slide up from bottom)
    // ============================================
    (function initTitleRotator() {
      const items = document.querySelectorAll('.title-rotator .title-item');
      if (!items.length) return;
      let current = 0;
      items[0].classList.add('active');

      setInterval(() => {
        const prev = current;
        current = (current + 1) % items.length;
        items[prev].classList.remove('active');
        items[prev].classList.add('exit-up');
        items[current].classList.add('active');
        setTimeout(() => items[prev].classList.remove('exit-up'), 600);
      }, 3000);
    })();

    // ============================================
    // macOS SPOTLIGHT & TERMINAL ANIMATION SEQUENCE
    // ============================================
    (function initSequence() {
      const spotlight = document.getElementById('spotlightSearch');
      const spotlightText = document.getElementById('spotlightText');
      const terminalContainer = document.getElementById('macTerminal');
      const terminalWindow = document.getElementById('terminalWindow');

      if (!spotlight || !terminalContainer || !terminalWindow) return;

      // Human-like typing speed (ms per char)
      function humanDelay() { return Math.random() * 80 + 70; } // 70-150ms
      function humanDelayFast() { return Math.random() * 40 + 50; } // 50-90ms

      const promptHTML = `<span class="cmd-prompt">user@vimanga:</span><span class="cmd-path">~$</span> `;

      // === STEP 1: Spotlight appears blank, pauses, then types ===
      function startSpotlight() {
        setTimeout(() => {
          spotlight.classList.add('active');
          // Blank pause — like a human opened Spotlight and is about to type
          setTimeout(() => {
            typeInSpotlight('Terminal', 0);
          }, 900);
        }, 1200);
      }

      function typeInSpotlight(text, i) {
        if (i < text.length) {
          spotlightText.textContent += text.charAt(i);
          setTimeout(() => typeInSpotlight(text, i + 1), humanDelay());
        } else {
          // Pause as if reading the result, then "press Enter"
          setTimeout(launchTerminal, 800);
        }
      }

      // === STEP 2: Terminal opens with bounce-in animation ===
      function launchTerminal() {
        spotlight.classList.remove('active');
        spotlightText.textContent = '';
        setTimeout(() => {
          terminalContainer.classList.add('launched', 'bounce-in');
          // Small pause before typing starts
          setTimeout(runTerminalScript, 800);
        }, 400);
      }

      // === STEP 3: Terminal script with typo → error → correction ===
      function runTerminalScript() {
        const script = [
          { action: 'type', text: 'whoami' },
          { action: 'enter' },
          { action: 'output', html: '<span class="cmd-info">Vimanga Umange — CS Graduate Student @ University of Windsor</span>' },
          { action: 'pause', ms: 500 },

          { action: 'type', text: 'cat latest_projects.txt' },
          { action: 'enter' },
          { action: 'output', html: '<div class="terminal-project-line"><span style="color:#d19a66">1.</span><span class="terminal-project-title">FitTrack — AI Wellness Assistant</span><span class="cmd-warning">Finalist</span></div><div class="terminal-project-line"><span style="color:#d19a66">2.</span><span class="terminal-project-title">WeatherWise — NASA Activity Recommender</span><span style="color:#ff8a65">🎖 Honorable Mention</span></div><div class="terminal-project-line"><span style="color:#d19a66">3.</span><span class="terminal-project-title">E-Tutor — Adaptive Learning Platform</span></div><div class="terminal-project-line"><span style="color:#d19a66">4.</span><span class="terminal-project-title">AI Movie Search — Semantic NLP Engine</span></div>' },
          { action: 'pause', ms: 600 },

          // THE TYPO LINE
          { action: 'type', text: 'python3 run_potfolio.py' },
          { action: 'enter' },
          { action: 'output', html: '<span class="cmd-error">Traceback (most recent call last):\n  File "run_potfolio.py", line 1\nFileNotFoundError: No such file \'run_potfolio.py\'</span>' },
          { action: 'pause', ms: 1000 },

          // CORRECTION
          { action: 'type', text: 'python3 run_portfolio.py' },
          { action: 'enter' },
          { action: 'output', html: '<span class="cmd-success">✓ Loading skills... [Python, PyTorch, React, Flutter, Docker]</span>\n<span class="cmd-success">✓ Compiling projects... 6 found</span>\n<span class="cmd-success">✓ Portfolio ready — Welcome!</span>' },
        ];

        let i = 0;
        let charIdx = 0;
        let currentCmdSpan = null;
        let currentCursor = null;

        function newPromptLine() {
          const line = document.createElement('div');
          line.style.marginTop = '4px';
          line.innerHTML = promptHTML + '<span class="cmd-command"></span><span class="cmd-cursor"></span>';
          terminalWindow.appendChild(line);
          currentCmdSpan = line.querySelector('.cmd-command');
          currentCursor = line.querySelector('.cmd-cursor');
          scrollTerminal();
        }

        function scrollTerminal() {
          terminalWindow.scrollTop = terminalWindow.scrollHeight;
        }

        function next() {
          if (i >= script.length) {
            // Final blinking cursor
            newPromptLine();
            if (currentCmdSpan) currentCmdSpan.remove();
            return;
          }

          const step = script[i];

          if (step.action === 'type') {
            if (charIdx === 0) newPromptLine();
            if (charIdx < step.text.length) {
              currentCmdSpan.textContent += step.text.charAt(charIdx);
              charIdx++;
              scrollTerminal();
              setTimeout(next, humanDelay());
              return; // don't advance i
            } else {
              charIdx = 0;
              i++;
              setTimeout(next, 80);
              return;
            }
          }

          if (step.action === 'enter') {
            if (currentCursor) currentCursor.remove();
            i++;
            setTimeout(next, 400);
            return;
          }

          if (step.action === 'output') {
            const out = document.createElement('div');
            out.className = 'cmd-output';
            out.innerHTML = step.html.replace(/\\n/g, '<br>');
            terminalWindow.appendChild(out);
            scrollTerminal();
            i++;
            setTimeout(next, 300);
            return;
          }

          if (step.action === 'pause') {
            i++;
            setTimeout(next, step.ms);
            return;
          }
        }

        next();
      }

      // Kick it off
      startSpotlight();
    })();

    // Laptop 3D: one-time turn-around reveal and crisp screen textures
    function initLaptop3D() {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const lightweight = document.documentElement.classList.contains('studio-lightweight-3d')
        || window.matchMedia('(max-width: 820px)').matches
        || Boolean(connection?.saveData)
        || /(^|-)2g$/.test(connection?.effectiveType || '')
        || Boolean(navigator.deviceMemory && navigator.deviceMemory <= 2)
        || Boolean(navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
      document.querySelectorAll('model-viewer.laptop-model').forEach(mv => {
        let currentTheta = 100;
        let currentPhi = 75;
        let revealComplete = false;
        const baseTheta = 0;
        const basePhi = 75;
        const modelDistance = '95%';
        const wrap = mv.closest('.laptop-model-wrap');
        const demoSrc = mv.dataset.demoSrc;
        const preview = wrap?.querySelector('.laptop-hover-preview');
        const previewVideo = wrap?.querySelector('.laptop-hover-preview-video');
        const previewHotspot = wrap?.querySelector('.laptop-preview-hotspot');
        let screenMaterial = null;
        let demoTexture = null;
        let demoVideo = null;

        const pauseDemo = (reset = false) => {
          if (!demoVideo) return;
          demoVideo.pause();
          if (reset) demoVideo.currentTime = 0;
        };

        const playDemo = async () => {
          if (!demoSrc || !screenMaterial || !revealComplete || !isModelVisible || document.hidden) return;
          if (!demoTexture) {
            if (typeof mv.createVideoTexture !== 'function') return;
            demoTexture = mv.createVideoTexture(demoSrc);
            demoVideo = demoTexture?.source?.element || null;
            if (!demoVideo) return;
            const videoThreeTexture = demoTexture.source?.texture;
            if (videoThreeTexture) {
              videoThreeTexture.generateMipmaps = false;
              videoThreeTexture.minFilter = 1006; // THREE.LinearFilter
              videoThreeTexture.magFilter = 1006;
              videoThreeTexture.anisotropy = 16;
              videoThreeTexture.needsUpdate = true;
            }
            demoVideo.muted = true;
            demoVideo.loop = true;
            demoVideo.playsInline = true;
            demoVideo.setAttribute('playsinline', '');
            screenMaterial.emissiveTexture?.setTexture(demoTexture);
          }
          try {
            await demoVideo.play();
          } catch (_) { }
        };

        const showExpandedPreview = () => {
          if (!previewVideo || !revealComplete) return;
          previewVideo.currentTime = demoVideo?.currentTime || previewVideo.currentTime || 0;
          previewVideo.play().catch(() => { });
        };

        const hideExpandedPreview = () => {
          previewVideo?.pause();
          wrap?.classList.remove('is-previewing');
        };

        if (previewHotspot && previewVideo) {
          previewHotspot.addEventListener('pointerenter', showExpandedPreview);
          previewHotspot.addEventListener('pointerleave', hideExpandedPreview);
          previewHotspot.addEventListener('focus', showExpandedPreview);
          previewHotspot.addEventListener('blur', hideExpandedPreview);
          previewHotspot.addEventListener('click', () => {
            const isOpen = wrap?.classList.toggle('is-previewing');
            if (isOpen) showExpandedPreview();
            else hideExpandedPreview();
          });
        }

        if (lightweight) {
          if (preview instanceof HTMLImageElement && mv.dataset.thumbnail) preview.src = mv.dataset.thumbnail;
          wrap?.classList.add('is-static-preview');
          return;
        }

        const updateOrbit = () => {
          animFrameId = null;
          currentTheta += (baseTheta - currentTheta) * 0.05;
          currentPhi += (basePhi - currentPhi) * 0.05;

          mv.cameraOrbit = `${currentTheta}deg ${currentPhi}deg ${modelDistance}`;

          if (Math.abs(currentTheta - baseTheta) < 2.5 && Math.abs(currentPhi - basePhi) < 2.5) {
            currentTheta = baseTheta;
            currentPhi = basePhi;
            mv.cameraOrbit = `${baseTheta}deg ${basePhi}deg ${modelDistance}`;
            revealComplete = true;
            if (wrap) wrap.classList.add('is-ready');
            playDemo();
            return;
          }

          if (isModelVisible && !revealComplete) {
            animFrameId = requestAnimationFrame(updateOrbit);
          }
        };

        let isModelVisible = false;
        let animFrameId = null;
        const observer = new IntersectionObserver((entries) => {
          isModelVisible = entries[0].isIntersecting;
          if (isModelVisible) {
            if (mv.dataset.src && !mv.getAttribute('src')) mv.setAttribute('src', mv.dataset.src);
            if (!revealComplete && !animFrameId) updateOrbit();
            if (revealComplete) playDemo();
          } else {
            if (animFrameId) {
              cancelAnimationFrame(animFrameId);
              animFrameId = null;
            }
            pauseDemo(true);
          }
        }, { threshold: 0.05, rootMargin: '300px 0px' });
        observer.observe(mv);

        if (demoSrc) {
          document.addEventListener('visibilitychange', () => {
            if (document.hidden) pauseDemo();
            else playDemo();
          });
        }

        mv?.addEventListener('load', async () => {
          const thumbnailSrc = mv.getAttribute('data-thumbnail');
          if (!thumbnailSrc) return;
          const wrap = mv.closest('.laptop-model-wrap');
          if (wrap) {
            const previewImg = wrap.querySelector('.laptop-hover-preview');
            if (previewImg instanceof HTMLImageElement && !previewImg.src) {
              previewImg.src = thumbnailSrc;
            }
          }
          const model = mv.model;
          if (!model) return;

          // Suppress the glossy lid-edge highlight above FitTrack's display.
          if (demoSrc) {
            const displayShell = model.materials[26]?.pbrMetallicRoughness;
            displayShell?.setRoughnessFactor(1);
            displayShell?.setMetallicFactor(0);
          }

          const materialNames = model.materials.map(m => m.name);
          let screenMat = null;
          for (const material of model.materials) {
            const name = material.name.toLowerCase();
            if (name.includes('screen') || name.includes('display') ||
              name.includes('monitor') || name.includes('emission') ||
              name.includes('emissive') || name.includes('wallpaper')) {
              screenMat = material;
              break;
            }
          }

          if (!screenMat) {
            for (const material of model.materials) {
              if (material.emissiveTexture && material.emissiveTexture.texture) {
                screenMat = material;
                break;
              }
            }
          }

          if (!screenMat) {
            console.warn('Could not find screen material. Available:', materialNames);
            return;
          }
          screenMaterial = screenMat;

          try {
            const texture = await mv.createTexture(thumbnailSrc);

            try {
              const threeTexture = texture.source?.texture;
              if (threeTexture) {
                const renderer = mv[Object.getOwnPropertySymbols(mv).find(s => s.toString().includes('renderer'))]
                  || mv.renderer;
                const maxAnisotropy = (renderer && renderer.threeRenderer)
                  ? renderer.threeRenderer.capabilities.getMaxAnisotropy()
                  : 16;
                threeTexture.generateMipmaps = true;
                threeTexture.minFilter = 1008;      // THREE.LinearMipmapLinearFilter
                threeTexture.magFilter = 1006;      // THREE.LinearFilter
                threeTexture.anisotropy = maxAnisotropy;
                threeTexture.needsUpdate = true;
              }
            } catch (_) { }

            try {
              const sampler = texture.sampler;
              if (sampler) {
                sampler.setMinFilter(9987);   // GL LINEAR_MIPMAP_LINEAR
                sampler.setMagFilter(9729);   // GL LINEAR
              }
            } catch (_) { }

            const pbr = screenMat.pbrMetallicRoughness;
            if (pbr) {
              pbr.setBaseColorFactor([0, 0, 0, 1]);
              pbr.setMetallicFactor(0);
              pbr.setRoughnessFactor(1);
            }

            if (screenMat.emissiveTexture) {
              screenMat.emissiveTexture.setTexture(texture);
            }
            try {
              if (screenMat.setEmissiveFactor) {
                screenMat.setEmissiveFactor([1, 1, 1]);
              }
            } catch (_) { }

            // Texture applied successfully, make the model visible
            mv.classList.add('texture-applied');
            playDemo();
          } catch (e) {
            console.warn('Failed to set screen texture:', e);
            // Even if it fails, make the model visible so it's not permanently invisible
            mv.classList.add('texture-applied');
          }
        });
      });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initLaptop3D);
    } else {
      initLaptop3D();
    }
