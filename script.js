/* ===================================================
   1. NAVIGATION & MOBILE MENU
   =================================================== */
const bar = document.getElementById('bar');
const nav = document.getElementById('navbar');
const close = document.getElementById('close');

if (bar) {
  bar.addEventListener('click', () => {
    nav.classList.add('active');
  });
}
if (close) {
  close.addEventListener('click', () => {
    nav.classList.remove('active');
  });
}

/* ===================================================
   2. CART STATE MANAGEMENT (localStorage)
   =================================================== */
function getCart() {
  return JSON.parse(localStorage.getItem('ecom_cart')) || [];
}

function saveCart(cart) {
  localStorage.setItem('ecom_cart', JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const cart = getCart();
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const bagIcons = document.querySelectorAll(
    '#lg-bag a, #mobile a[href="cart.html"]'
  );
  bagIcons.forEach((icon) => {
    let badge = icon.querySelector('.cart-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'cart-badge';
      icon.appendChild(badge);
    }
    badge.textContent = totalCount;
    badge.style.display = totalCount > 0 ? 'inline-block' : 'none';
  });
}

/* ===================================================
   3. ADD TO CART FUNCTIONALITY
   =================================================== */
function addToCart(product) {
  const cart = getCart();
  const existingIndex = cart.findIndex(
    (item) => item.title === product.title && item.size === product.size
  );

  if (existingIndex > -1) {
    cart[existingIndex].quantity += product.quantity;
  } else {
    cart.push(product);
  }

  saveCart(cart);
  showToast(`Added "${product.title}" to your cart!`);
}

// Notification Toast
function showToast(message) {
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

/* Setup Add to Cart Listeners for Products Grid */
function initProductGridListeners() {
  const products = document.querySelectorAll('#product1 .pro');

  products.forEach((pro, index) => {
    const cartBtn = pro.querySelector('.cart');
    if (cartBtn) {
      cartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const img = pro.querySelector('img')?.src || './img/products/f1.jpg';
        const title =
          pro.querySelector('.des h5')?.innerText || 'Fashion T-Shirt';
        const priceText = pro.querySelector('.des h4')?.innerText || '$78';
        const price = parseFloat(priceText.replace('$', '')) || 78;

        addToCart({
          id: index,
          img: img,
          title: title,
          price: price,
          quantity: 1,
          size: 'M',
        });
      });
    }
  });
}

/* Setup Add to Cart Listener for Single Product Page (sproduct.html) */
function initSingleProductListener() {
  const proDetails = document.getElementById('prodetails');
  if (!proDetails) return;

  const addBtn = proDetails.querySelector('button');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const img = document.getElementById('MainImg')?.src;
      const title = proDetails.querySelector(
        '.single-pro-details h4'
      )?.innerText;
      const priceText = proDetails.querySelector(
        '.single-pro-details h2'
      )?.innerText;
      const price = parseFloat(priceText.replace('$', '')) || 0;
      const sizeSelect = proDetails.querySelector('select');
      const size =
        sizeSelect && sizeSelect.value !== 'Select Size'
          ? sizeSelect.value
          : 'M';
      const quantityInput = proDetails.querySelector('input[type="number"]');
      const quantity = parseInt(quantityInput?.value) || 1;

      addToCart({
        img: img,
        title: title,
        price: price,
        quantity: quantity,
        size: size,
      });
    });
  }
}

/* ===================================================
   4. RENDER & MANAGE CART (cart.html)
   =================================================== */
let appliedDiscount = 0; // Discount percentage

function renderCart() {
  const cartTableBody = document.querySelector('#cart tbody');
  if (!cartTableBody) return;

  const cart = getCart();
  cartTableBody.innerHTML = '';

  if (cart.length === 0) {
    cartTableBody.innerHTML =
      '<tr><td colspan="6" style="text-align:center; padding: 20px;">Your cart is empty.</td></tr>';
    calculateTotals();
    return;
  }

  cart.forEach((item, index) => {
    const subtotal = (item.price * item.quantity).toFixed(2);
    const row = document.createElement('tr');

    row.innerHTML = `
      <td><a href="#" class="remove-btn" data-index="${index}"><i class="far fa-times-circle"></i></a></td>
      <td><img src="${item.img}" alt="${item.title}"></td>
      <td>${item.title} ${item.size ? `(${item.size})` : ''}</td>
      <td>$${item.price.toFixed(2)}</td>
      <td><input type="number" min="1" value="${
        item.quantity
      }" class="edit-qty" data-index="${index}"></td>
      <td class="item-subtotal">$${subtotal}</td>
    `;

    cartTableBody.appendChild(row);
  });

  attachCartRowEvents();
  calculateTotals();
}

function attachCartRowEvents() {
  // Delete item
  document.querySelectorAll('.remove-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const index = btn.getAttribute('data-index');
      let cart = getCart();
      cart.splice(index, 1);
      saveCart(cart);
      renderCart();
    });
  });

  // Edit quantity dynamically
  document.querySelectorAll('.edit-qty').forEach((input) => {
    input.addEventListener('change', (e) => {
      const index = input.getAttribute('data-index');
      let newQty = parseInt(e.target.value);
      if (isNaN(newQty) || newQty < 1) newQty = 1;

      let cart = getCart();
      cart[index].quantity = newQty;
      saveCart(cart);
      renderCart();
    });
  });
}

function calculateTotals() {
  const cart = getCart();
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discountAmount = subtotal * appliedDiscount;
  const grandTotal = subtotal - discountAmount;

  const subtotalTable = document.querySelector('#subtotal table');
  if (subtotalTable) {
    subtotalTable.innerHTML = `
      <tr>
        <td>Cart Subtotal</td>
        <td>$ ${subtotal.toFixed(2)}</td>
      </tr>
      ${
        appliedDiscount > 0
          ? `<tr><td>Discount (${appliedDiscount * 100}\%)</td><td>-$ ${discountAmount.toFixed(
              2
            )}</td></tr>`
          : ''
      }
      <tr>
        <td>Shipping</td>
        <td>Free</td>
      </tr>
      <tr>
        <td><strong>Total</strong></td>
        <td><strong>$ ${grandTotal.toFixed(2)}</strong></td>
      </tr>
    `;
  }
}

/* Coupon Logic */
function initCouponSystem() {
  const couponContainer = document.getElementById('coupon');
  if (!couponContainer) return;

  const button = couponContainer.querySelector('button');
  const input = couponContainer.querySelector('input');

  const VALID_COUPONS = {
    SAVE10: 0.1,
    SAVE20: 0.2,
    HALFPRICE: 0.5,
  };

  if (button && input) {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const code = input.value.trim().toUpperCase();

      if (VALID_COUPONS[code]) {
        appliedDiscount = VALID_COUPONS[code];
        showToast(`Coupon "${code}" applied!`);
      } else {
        appliedDiscount = 0;
        showToast('Invalid coupon code!');
      }
      calculateTotals();
    });
  }
}

/* Checkout Logic */
function initCheckout() {
  const checkoutBtn = document.querySelector('#subtotal button');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      const cart = getCart();
      if (cart.length === 0) {
        showToast('Your cart is empty!');
        return;
      }
      showToast('Order placed successfully!');
      saveCart([]);
      renderCart();
    });
  }
}

/* ===================================================
   5. INITIALIZATION
   =================================================== */
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  initProductGridListeners();
  initSingleProductListener();
  renderCart();
  initCouponSystem();
  initCheckout();
});