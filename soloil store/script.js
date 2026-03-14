(function () {
  "use strict";

  const STORAGE_KEY = "soloil-cart";
  const THEME_KEY = "soloil-theme";

  const state = {
    cart: loadCart()
  };

  const elements = {
    body: document.body,
    mobileToggle: document.getElementById("mobileToggle"),
    mobileMenu: document.getElementById("mobileMenu"),
    themeToggle: document.getElementById("themeToggle"),
    cartButton: document.getElementById("cartButton"),
    cartSidebar: document.getElementById("cartSidebar"),
    closeCart: document.getElementById("closeCart"),
    overlay: document.getElementById("overlay"),
    cartItems: document.getElementById("cartItems"),
    cartCount: document.getElementById("cartCount"),
    cartTotal: document.getElementById("cartTotal"),
    checkoutBtn: document.getElementById("checkoutBtn"),
    featuredProducts: document.getElementById("featuredProducts"),
    shopProducts: document.getElementById("shopProducts"),
    searchInput: document.getElementById("searchInput"),
    categoryFilter: document.getElementById("categoryFilter"),
    contactForm: document.getElementById("contactForm")
  };

  init();

  function init() {
    setActiveNav();
    applySavedTheme();
    bindGlobalEvents();
    renderHomePreview();
    renderShopPage();
    renderCart();
  }

  function bindGlobalEvents() {
    if (elements.mobileToggle && elements.mobileMenu) {
      elements.mobileToggle.addEventListener("click", toggleMobileMenu);
    }

    if (elements.themeToggle) {
      elements.themeToggle.addEventListener("click", toggleTheme);
    }

    if (elements.cartButton) {
      elements.cartButton.addEventListener("click", openCart);
    }

    if (elements.closeCart) {
      elements.closeCart.addEventListener("click", closeCart);
    }

    if (elements.overlay) {
      elements.overlay.addEventListener("click", () => {
        closeCart();
        closeMobileMenu();
      });
    }

    if (elements.checkoutBtn) {
      elements.checkoutBtn.addEventListener("click", handleCheckout);
    }

    if (elements.searchInput) {
      elements.searchInput.addEventListener("input", filterShopProducts);
    }

    if (elements.categoryFilter) {
      elements.categoryFilter.addEventListener("change", filterShopProducts);
    }

    if (elements.contactForm) {
      elements.contactForm.addEventListener("submit", handleContactForm);
    }

    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleEscapeKey);
  }

  function toggleMobileMenu() {
    if (!elements.mobileMenu) return;
    elements.mobileMenu.classList.toggle("open");
  }

  function closeMobileMenu() {
    if (!elements.mobileMenu) return;
    elements.mobileMenu.classList.remove("open");
  }

  function handleDocumentClick(event) {
    const addButton = event.target.closest("[data-add-to-cart]");
    const removeButton = event.target.closest("[data-remove-from-cart]");
    const decreaseButton = event.target.closest("[data-decrease-qty]");
    const increaseButton = event.target.closest("[data-increase-qty]");

    if (addButton) {
      const productId = Number(addButton.dataset.addToCart);
      addToCart(productId);
    }

    if (removeButton) {
      const productId = Number(removeButton.dataset.removeFromCart);
      removeFromCart(productId);
    }

    if (decreaseButton) {
      const productId = Number(decreaseButton.dataset.decreaseQty);
      changeQuantity(productId, -1);
    }

    if (increaseButton) {
      const productId = Number(increaseButton.dataset.increaseQty);
      changeQuantity(productId, 1);
    }
  }

  function handleEscapeKey(event) {
    if (event.key === "Escape") {
      closeCart();
      closeMobileMenu();
    }
  }

  function setActiveNav() {
    const page = elements.body?.dataset.page;
    const navLinks = document.querySelectorAll("[data-nav]");

    navLinks.forEach((link) => {
      const target = link.dataset.nav;
      const isHome = page === "home" && target === "home";
      const isShop = page === "shop" && target === "shop";

      if (isHome || isShop) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }

  function applySavedTheme() {
    try {
      const savedTheme = localStorage.getItem(THEME_KEY);

      if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
      } else {
        document.body.classList.remove("dark-mode");
      }

      updateThemeButton();
    } catch (error) {
      updateThemeButton();
    }
  }

  function toggleTheme() {
    document.body.classList.toggle("dark-mode");

    try {
      const currentTheme = document.body.classList.contains("dark-mode") ? "dark" : "light";
      localStorage.setItem(THEME_KEY, currentTheme);
    } catch (error) {
      // ignore storage errors
    }

    updateThemeButton();
  }

  function updateThemeButton() {
    if (!elements.themeToggle) return;

    const isDark = document.body.classList.contains("dark-mode");
    elements.themeToggle.textContent = isDark ? "☀️" : "🌙";
    elements.themeToggle.setAttribute(
      "aria-label",
      isDark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"
    );
    elements.themeToggle.setAttribute(
      "title",
      isDark ? "الوضع الفاتح" : "الوضع الداكن"
    );
  }

  function renderHomePreview() {
    if (!elements.featuredProducts || typeof PRODUCTS === "undefined") return;

    const featured = PRODUCTS.slice(0, 4);
    elements.featuredProducts.innerHTML = featured.map(createProductCard).join("");
  }

  function renderShopPage() {
    if (!elements.shopProducts || typeof PRODUCTS === "undefined") return;

    elements.shopProducts.innerHTML = PRODUCTS.map(createProductCard).join("");
  }

  function filterShopProducts() {
    if (!elements.shopProducts || typeof PRODUCTS === "undefined") return;

    const search = elements.searchInput ? elements.searchInput.value.trim().toLowerCase() : "";
    const category = elements.categoryFilter ? elements.categoryFilter.value : "all";

    const filtered = PRODUCTS.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search);

      const matchesCategory = category === "all" || product.category === category;

      return matchesSearch && matchesCategory;
    });

    if (!filtered.length) {
      elements.shopProducts.innerHTML = `
        <div class="empty-state">
          <h3>لا توجد نتائج مطابقة</h3>
          <p>جرّب البحث بكلمة أخرى أو اختر فئة مختلفة.</p>
        </div>
      `;
      return;
    }

    elements.shopProducts.innerHTML = filtered.map(createProductCard).join("");
  }

  function createProductCard(product) {
    return `
      <article class="product-card">
        <div class="product-media">
          <span class="product-badge">${escapeHtml(product.badge)}</span>
          <div class="product-icon">${escapeHtml(product.icon)}</div>
        </div>

        <div class="product-content">
          <span class="product-category">${escapeHtml(product.category)}</span>
          <h3>${escapeHtml(product.name)}</h3>
          <p>${escapeHtml(product.description)}</p>

          <div class="product-bottom">
            <div>
              <span class="price-label">السعر</span>
              <strong class="product-price">${formatPrice(product.price)}</strong>
            </div>
            <button class="btn btn-accent" data-add-to-cart="${product.id}">
              أضف للسلة
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function addToCart(productId) {
    if (typeof PRODUCTS === "undefined") return;

    const product = PRODUCTS.find((item) => item.id === productId);
    if (!product) return;

    const existing = state.cart.find((item) => item.id === productId);

    if (existing) {
      existing.quantity += 1;
    } else {
      state.cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        icon: product.icon,
        quantity: 1
      });
    }

    saveCart();
    renderCart();
    openCart();
    showToast(`تمت إضافة "${product.name}" إلى السلة`);
  }

  function changeQuantity(productId, delta) {
    const item = state.cart.find((cartItem) => cartItem.id === productId);
    if (!item) return;

    item.quantity += delta;

    if (item.quantity <= 0) {
      state.cart = state.cart.filter((cartItem) => cartItem.id !== productId);
    }

    saveCart();
    renderCart();
  }

  function removeFromCart(productId) {
    state.cart = state.cart.filter((item) => item.id !== productId);
    saveCart();
    renderCart();
    showToast("تم حذف المنتج من السلة");
  }

  function renderCart() {
    if (!elements.cartItems || !elements.cartCount || !elements.cartTotal) return;

    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = state.cart.reduce((sum, item) => sum + item.quantity * item.price, 0);

    elements.cartCount.textContent = String(totalItems);
    elements.cartTotal.textContent = formatPrice(totalPrice);

    if (!state.cart.length) {
      elements.cartItems.innerHTML = `<p class="empty-message">السلة فارغة حاليًا</p>`;
      return;
    }

    elements.cartItems.innerHTML = state.cart
      .map((item) => {
        const itemTotal = item.price * item.quantity;

        return `
          <div class="cart-item">
            <div class="cart-icon">${escapeHtml(item.icon)}</div>

            <div class="cart-info">
              <h4>${escapeHtml(item.name)}</h4>
              <p>${formatPrice(item.price)} للقطعة</p>

              <div class="qty-controls">
                <button class="qty-btn" data-increase-qty="${item.id}" aria-label="زيادة الكمية">+</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" data-decrease-qty="${item.id}" aria-label="تقليل الكمية">-</button>
              </div>
            </div>

            <div class="cart-side">
              <strong>${formatPrice(itemTotal)}</strong>
              <button class="remove-btn" data-remove-from-cart="${item.id}">حذف</button>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function openCart() {
    if (!elements.cartSidebar || !elements.overlay) return;

    elements.cartSidebar.classList.add("open");
    elements.overlay.classList.add("show");
    elements.cartSidebar.setAttribute("aria-hidden", "false");
  }

  function closeCart() {
    if (!elements.cartSidebar || !elements.overlay) return;

    elements.cartSidebar.classList.remove("open");
    elements.overlay.classList.remove("show");
    elements.cartSidebar.setAttribute("aria-hidden", "true");
  }

  function handleCheckout() {
    if (!state.cart.length) {
      showToast("السلة فارغة، أضف بعض المنتجات أولًا");
      return;
    }

    const summary = state.cart
      .map((item) => `${item.name} × ${item.quantity}`)
      .join(" | ");

    alert(`تم استلام طلبك بنجاح:\n${summary}`);

    state.cart = [];
    saveCart();
    renderCart();
    closeCart();
  }

  function handleContactForm(event) {
    event.preventDefault();

    const name = document.getElementById("name")?.value.trim();
    const email = document.getElementById("email")?.value.trim();
    const subject = document.getElementById("subject")?.value.trim();
    const message = document.getElementById("message")?.value.trim();

    if (!name || !email || !subject || !message) {
      showToast("يرجى تعبئة جميع الحقول");
      return;
    }

    showToast("تم إرسال رسالتك بنجاح");
    event.target.reset();
  }

  function formatPrice(price) {
    return `${Number(price).toFixed(2)} $`;
  }

  function loadCart() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      return [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart));
    } catch (error) {
      // ignore storage errors
    }
  }

  function showToast(message) {
    const previousToast = document.querySelector(".toast");
    if (previousToast) previousToast.remove();

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 250);
    }, 2200);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
