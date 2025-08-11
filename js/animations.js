// =======================================================
// HYPER XP - Free Fire Tournament Website
// Clean and Optimized JavaScript Animations
// =======================================================

// Prevent scroll restoration and force scroll to top
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

window.addEventListener('beforeunload', function() {
  window.scrollTo(0, 0);
});

window.addEventListener('pageshow', function(event) {
  if (event.persisted) {
    window.scrollTo(0, 0);
  }
});

document.addEventListener('DOMContentLoaded', function() {
  
  // =======================================================
  // FORCE SCROLL TO TOP ON PAGE LOAD
  // =======================================================
  function forceScrollToTop() {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    updateActiveNavLink('#home');
  }

  // =======================================================
  // SMOOTH SCROLL NAVIGATION
  // =======================================================
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          const offsetTop = target.offsetTop - 80;
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
          
          updateActiveNavLink(this.getAttribute('href'));
        }
      });
    });
  }

  // =======================================================
  // NAVBAR SCROLL EFFECT
  // =======================================================
  function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', function() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      if (scrollTop > 50) {
        navbar.style.background = 'rgba(5,5,5,0.98)';
        navbar.style.borderBottom = '1px solid rgba(255,107,53,0.3)';
      } else {
        navbar.style.background = 'rgba(5,5,5,0.95)';
        navbar.style.borderBottom = '1px solid rgba(255,255,255,0.08)';
      }
    });
  }

  // =======================================================
  // UPDATE ACTIVE NAVIGATION LINK
  // =======================================================
  function updateActiveNavLink(targetHref) {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === targetHref) {
        link.classList.add('active');
      }
    });
  }

  // =======================================================
  // SCROLL SPY FOR NAVIGATION
  // =======================================================
  function initScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    window.addEventListener('scroll', function() {
      let current = '';
      const scrollPosition = window.pageYOffset + 100;
      
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          current = section.getAttribute('id');
        }
      });
      
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
          link.classList.add('active');
        }
      });
    });
  }

  // =======================================================
  // LAZY LOAD VIDEO
  // =======================================================
  function initLazyVideo() {
    window.loadVideo = function() {
      const videoPlaceholder = document.getElementById('videoPlaceholder');
      const videoIframe = document.getElementById('videoIframe');
      
      if (!videoPlaceholder || !videoIframe) return;
      
      const videoId = 'hmtuvNfytjM';
      const iframe = document.createElement('iframe');
      
      iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&color=white&theme=dark`;
      iframe.width = '100%';
      iframe.height = '400';
      iframe.frameBorder = '0';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.style.borderRadius = '15px';
      
      videoIframe.innerHTML = '';
      videoIframe.appendChild(iframe);
      
      videoPlaceholder.style.opacity = '0';
      setTimeout(() => {
        videoPlaceholder.style.display = 'none';
        videoIframe.style.display = 'block';
        videoIframe.style.opacity = '0';
        setTimeout(() => {
          videoIframe.style.opacity = '1';
          videoIframe.style.transition = 'opacity 0.5s ease';
        }, 50);
      }, 300);
    };
  }

  // =======================================================
  // SCROLL TO SECTION UTILITY
  // =======================================================
  window.scrollToSection = function(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
      const offsetTop = section.offsetTop - 80;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  };

  // =======================================================
  // FLOATING BUTTON VISIBILITY
  // =======================================================
  function initFloatingButton() {
    const floatingBtn = document.getElementById('floatingBookBtn');
    if (!floatingBtn) return;
    
    window.addEventListener('scroll', function() {
      const scrollPosition = window.pageYOffset;
      const windowHeight = window.innerHeight;
      
      if (scrollPosition > windowHeight * 0.5) {
        floatingBtn.style.display = 'block';
        floatingBtn.style.opacity = '1';
      } else {
        floatingBtn.style.opacity = '0';
        setTimeout(() => {
          if (window.pageYOffset <= windowHeight * 0.5) {
            floatingBtn.style.display = 'none';
          }
        }, 300);
      }
    });
  }

  // =======================================================
  // SCROLL ANIMATIONS
  // =======================================================
  function initScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('aos-animate');
        }
      });
    }, observerOptions);
    
    document.querySelectorAll('[data-aos]').forEach(el => {
      observer.observe(el);
    });
  }

  // =======================================================
  // PERFORMANCE OPTIMIZATION
  // =======================================================
  function optimizePerformance() {
    // Lazy load images
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });
    
    images.forEach(img => imageObserver.observe(img));
  }

  // =======================================================
  // ENHANCED NOTIFICATION SYSTEM
  // =======================================================
  window.showNotification = function(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#ff6b35'};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      z-index: 1100;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      max-width: 300px;
      font-weight: 500;
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; font-size: 1.2rem; margin-left: 1rem; cursor: pointer;">&times;</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);
  };

  // =======================================================
  // INITIALIZE ALL FEATURES
  // =======================================================
  function init() {
    try {
      forceScrollToTop();
      initSmoothScroll();
      initNavbarScroll();
      initScrollSpy();
      initLazyVideo();
      initFloatingButton();
      initScrollAnimations();
      optimizePerformance();
      
      console.log('🔥 Hyper XP animations initialized successfully!');
    } catch (error) {
      console.error('Error initializing animations:', error);
    }
  }

  // Start initialization
  init();
});
