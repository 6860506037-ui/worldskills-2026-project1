let allProducts = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentCategory = 'All';

// 1. ตรวจจับการ Scroll ของ Navbar เปลียนสีพื้นหลัง
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// 2. ดึงข้อมูลสินค้าจากหลังบ้านมาประมวลผลเริ่มต้น
async function fetchProducts() {
    try {
        const response = await fetch('/api/products');
        allProducts = await response.json();
        renderProducts(allProducts);
        updateCartUI();
    } catch (err) {
        console.error('Error fetching data:', err);
    }
}

// 3. แสดงผล Product Grid การ์ดสินค้า
function renderProducts(products) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';
    
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${product.image_url}" alt="${product.name}">
            <div class="card-info">
                <h3>${product.name}</h3>
                <p class="price">${product.price} บาท</p>
                <p class="stock">คงเหลือ: ${product.stock} ชิ้น</p>
                <button class="add-btn" onclick="addToCart(${product.id})" ${product.stock === 0 ? 'disabled' : ''}>
                    ${product.stock === 0 ? 'สินค้าหมด' : 'เพิ่มในตะกร้า'}
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// 4. Live Search ระบบค้นหาสินค้าแบบ Real-time เรียลไทม์
document.getElementById('search-input').addEventListener('input', (e) => {
    const searchStr = e.target.value.toLowerCase();
    const filtered = allProducts.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchStr);
        const matchesCategory = currentCategory === 'All' || p.category === currentCategory;
        return matchesSearch && matchesCategory;
    });
    renderProducts(filtered);
});

// 5. Category Filter ระบบปุ่มกรองแยกหมวดหมู่สินค้า
function filterCategory(category, buttonEl) {
    currentCategory = category;
    
    // สลับคลาส active ของปุ่มควบคุม
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    buttonEl.classList.add('active');
    
    const filtered = allProducts.filter(p => currentCategory === 'All' || p.category === currentCategory);
    renderProducts(filtered);
}

// 6. Cart Management ระบบสิทธิ์และการสะสมสินค้าลง LocalStorage
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        if (cartItem.qty + 1 > product.stock) {
            alert('ไม่สามารถเพิ่มสินค้าได้มากกว่าจำนวนสต็อกที่มีอยู่');
            return;
        }
        cartItem.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    
    saveAndRefreshCart();
}

function saveAndRefreshCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

// เปิด/ปิดหน้าต่างลิ้นชักตะกร้า
function toggleCart(open) {
    const drawer = document.getElementById('cart-drawer');
    if (open) drawer.classList.add('open');
    else drawer.classList.remove('open');
}

// อัปเดตข้อมูลบนหน้าจอ UI และ Badge นับชิ้นในตะกร้า
function updateCartUI() {
    const badge = document.getElementById('cart-badge');
    const itemsList = document.getElementById('cart-items-list');
    const totalSpan = document.getElementById('cart-total');
    
    let totalItems = 0;
    let totalPrice = 0;
    itemsList.innerHTML = '';
    
    cart.forEach(item => {
        totalItems += item.qty;
        totalPrice += item.price * item.qty;
        
        const itemRow = document.createElement('div');
        itemRow.className = 'cart-item';
        itemRow.innerHTML = `
            <div>
                <h4>${item.name}</h4>
                <small>${item.price} x ${item.qty}</small>
            </div>
            <strong>${item.price * item.qty} บาท</strong>
        `;
        itemsList.appendChild(itemRow);
    });
    
    badge.innerText = totalItems;
    totalSpan.innerText = totalPrice;
}

// 7. Checkout Process & Inventory Interaction ส่งตัดสต็อกทางฝั่งเซิร์ฟเวอร์
async function checkout() {
    if (cart.length === 0) {
        alert('กรุณาเลือกซื้อสินค้าลงตะกร้าก่อนทำรายการสำเร็จ');
        return;
    }
    
    try {
        // วนลูปส่งข้อมูลตัดสต็อกทีละชิ้นตามโจทย์ Module B3
        for (const item of cart) {
            const res = await fetch(`/api/products/${item.id}/reduce-stock`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: item.qty })
            });
            
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'การตัดสต็อกล้มเหลว');
            }
        }
        
        alert('การสั่งซื้อสำเร็จเสร็จเรียบร้อย สต็อกสินค้าอัปเดตแล้ว!');
        cart = [];
        saveAndRefreshCart();
        toggleCart(false);
        fetchProducts(); // โหลดข้อมูลหน้าร้านใหม่เพื่อแสดงสต็อกปัจจุบัน
        
    } catch (err) {
        alert(`เกิดข้อผิดพลาดในการซื้อสินค้า: ${err.message}`);
    }
}

// เริ่มต้นดึงข้อมูลระบบทันทีเมื่อโหลดสคริปต์สำเร็จ
fetchProducts();
