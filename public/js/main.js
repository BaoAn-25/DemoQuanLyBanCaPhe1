// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar background change on scroll
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(0, 0, 0, 0.95)';
    } else {
        navbar.style.background = 'rgba(0, 0, 0, 0.9)';
    }
});

// Add active class to nav links on scroll
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.navbar-nav .nav-link');

window.addEventListener('scroll', function() {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - sectionHeight / 3) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').includes(current)) {
            link.classList.add('active');
        }
    });
});

// Subscribe button
const subscribeButton = document.getElementById('subscribeButton');
if (subscribeButton) {
    subscribeButton.addEventListener('click', () => {
        const emailInput = document.querySelector('input[type="email"]');
        if (!emailInput || !emailInput.value.trim()) {
            alert('Vui lòng nhập email của bạn.');
            return;
        }
        alert('Cảm ơn! Chúng tôi đã nhận email của bạn.');
        emailInput.value = '';
    });
}

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.menu-item, .feature-item, .contact-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Thêm vào giỏ hàng (event delegation cho mọi trang)
function updateCartCountUI(count) {
    if (typeof count !== 'number' || Number.isNaN(count)) {
        return;
    }

    // Cập nhật badge ở nút giỏ hàng nav nếu có sẵn (hỗ trợ tên id cũ/new)
    const cartBadge = document.getElementById('cartBadgeCount') || document.getElementById('cart-count');
    if (cartBadge) {
        cartBadge.textContent = count;
        cartBadge.style.display = count > 0 ? 'inline-block' : 'none';
        return; // không tạo thêm badge trùng ở cùng link
    }

    // Nếu chưa có badge cố định thì tạo động
    const cartLink = document.querySelector('a[href="/products/cart"]');
    if (cartLink) {
        let badge = cartLink.querySelector('.cart-count-js');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'cart-count-js badge rounded-pill bg-danger ms-1';
            badge.style.fontSize = '0.72rem';
            badge.style.minWidth = '24px';
            badge.style.border = '1.5px solid #212529';
            cartLink.appendChild(badge);
        }
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

document.body.addEventListener('submit', async function(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.matches('.add-to-cart-form')) {
        return;
    }

    event.preventDefault();

    const button = form.querySelector('[type="submit"]');
    const originalText = button ? button.innerHTML : '';
    if (button) {
        button.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Đang thêm...';
        button.disabled = true;
    }

    const formData = new FormData(form);
    const body = new URLSearchParams(formData);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(form.action || '/products/add-to-cart', {
            method: 'POST',
            body,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            },
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.status === 401) {
            window.location.href = '/auth/login';
            return;
        }

        if (!response.ok) {
            throw new Error(`Network response was not ok (${response.status})`);
        }

        const data = await response.json();

        if (data.success) {
            updateCartCountUI(Number(data.cartCount));
            const toastEl = document.createElement('div');
            toastEl.className = 'toast align-items-center text-white bg-success border-0';
            toastEl.role = 'alert';
            toastEl.innerHTML = `
                <div class="d-flex">
                    <div class="toast-body">${data.message}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>`;
            document.body.appendChild(toastEl);
            const bsToast = new bootstrap.Toast(toastEl);
            bsToast.show();
            toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
        } else {
            const toastEl = document.createElement('div');
            toastEl.className = 'toast align-items-center text-white bg-danger border-0';
            toastEl.role = 'alert';
            toastEl.innerHTML = `
                <div class="d-flex">
                    <div class="toast-body">${data.message || 'Có lỗi xảy ra khi thêm vào giỏ hàng.'}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>`;
            document.body.appendChild(toastEl);
            const bsToast = new bootstrap.Toast(toastEl);
            bsToast.show();
            toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
        }
    } catch (error) {
        console.error('Lỗi:', error);
        alert('Lỗi thêm vào giỏ hàng. Vui lòng thử lại.');
    } finally {
        if (button) {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }
});

