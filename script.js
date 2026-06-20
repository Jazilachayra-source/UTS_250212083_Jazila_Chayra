// script.js
document.addEventListener('DOMContentLoaded', function () {
    
    let cart = JSON.parse(localStorage.getItem('chayra_cart')) || [];

    // --- BAGIAN A: ADD TO CART (TETAP PISAH BARIS JIKA PRODUK SAMA) ---
    const addToCartButtons = document.querySelectorAll('.btn-add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('id'); // Mengambil id tombol sesuai spesifikasi modul
            const name = this.getAttribute('data-name');
            const price = parseInt(this.getAttribute('data-price'));
            const flavorsAttr = this.getAttribute('data-flavors'); 

            // Membuat penanda per klik agar pembeli bisa memilih rasa berbeda pada baris terpisah
            const uniqueLineId = id + '_' + new Date().getTime(); 

            cart.push({ 
                cartId: uniqueLineId,
                name: name, 
                price: price, 
                qty: 1, 
                flavors: flavorsAttr,
                selectedFlavor: "" // Mendorong pembeli memilih di dropdown keranjang belanja
            });

            localStorage.setItem('chayra_cart', JSON.stringify(cart));
            updateNavbarBadge();
            alert(`${name} Added to cart.`);
        });
    });

    // --- BAGIAN B: RENDER DI TABEL TRANSAKSI KOTAK 1 ---
    const cartItemsContainer = document.getElementById('cart-items');

    function renderCartHtml() {
        if (!cartItemsContainer) return; 
        
        cartItemsContainer.innerHTML = '';

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">Your cart is empty Fill it with something yummy!.</td></tr>`;
            calculateFinalReceipt();
            return;
        }

        cart.forEach((product, index) => {
            const subtotalItem = product.price * product.qty;
            const flavorArray = product.flavors ? product.flavors.split(',') : [];
            
            // Membuat dropdown rasa dengan opsi default awal '-- select flavor --' 
            let selectOptionsHtml = `<option value="" ${product.selectedFlavor === "" ? 'selected' : ''}>-- select flavor --</option>`;
            flavorArray.forEach(flavor => {
                const isSelected = flavor.trim() === product.selectedFlavor ? 'selected' : '';
                selectOptionsHtml += `<option value="${flavor.trim()}" ${isSelected}>${flavor.trim()}</option>`;
            });

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="fw-bold">${product.name}</div>
                    <div class="mt-1">
                        <select class="form-select form-select-sm flavor-selector-dinamis" data-index="${index}" style="max-width: 190px; font-size: 12px;">
                            ${selectOptionsHtml}
                        </select>
                    </div>
                </td>
                <td>Rp${product.price.toLocaleString('id-ID')}</td>
                <td>
                    <div class="quantity-control bg-secondary text-white rounded p-1 d-inline-flex">
                        <button class="btn-minus-dinamis btn btn-sm text-white py-0" data-index="${index}">-</button>
                        <span class="qty-val px-2">${product.qty}</span>
                        <button class="btn-plus-dinamis btn btn-sm text-white py-0" data-index="${index}">+</button>
                    </div>
                </td>
                <td class="fw-bold">Rp${subtotalItem.toLocaleString('id-ID')}</td>
                <td class="text-center">
                    <button class="btn btn-sm text-danger btn-hapus-item" data-index="${index}">🗑️</button>
                </td>
            `;
            cartItemsContainer.appendChild(tr);
        });

        initCartEvents(); 
        calculateFinalReceipt();
    }

    function initCartEvents() {
        document.querySelectorAll('.btn-plus-dinamis').forEach(button => {
            button.addEventListener('click', function() {
                const index = this.getAttribute('data-index');
                cart[index].qty += 1;
                saveAndRefresh();
            });
        });

        document.querySelectorAll('.btn-minus-dinamis').forEach(button => {
            button.addEventListener('click', function() {
                const index = this.getAttribute('data-index');
                if (cart[index].qty > 1) {
                    cart[index].qty -= 1;
                    saveAndRefresh();
                }
            });
        });

        document.querySelectorAll('.btn-hapus-item').forEach(button => {
            button.addEventListener('click', function() {
                const index = this.getAttribute('data-index');
                cart.splice(index, 1);
                saveAndRefresh();
            });
        });

        document.querySelectorAll('.flavor-selector-dinamis').forEach(select => {
            select.addEventListener('change', function() {
                const index = this.getAttribute('data-index');
                cart[index].selectedFlavor = this.value;
                localStorage.setItem('chayra_cart', JSON.stringify(cart));
            });
        });
    }

    function saveAndRefresh() {
        localStorage.setItem('chayra_cart', JSON.stringify(cart));
        renderCartHtml();
        updateNavbarBadge();
    }

    // --- BAGIAN C: ATURAN LOGIKA MATEMATIKA BERSYARAT 
    function calculateFinalReceipt() {
        let overallSubtotal = 0;

        cart.forEach(item => {
            overallSubtotal += (item.price * item.qty);
        });

        const subtotalEl = document.getElementById('summary-subtotal');
        const deliveryEl = document.getElementById('summary-delivery');
        const totalEl = document.getElementById('summary-total');

        if (!subtotalEl) return;

        // EKSEKUSI IF-ELSE PERSIS SESUAI MODUL HALAMAN 6:
        // Jika Subtotal < Rp200.000 -> Ongkir Rp15.000
        // Jika Subtotal >= Rp200.000 -> Ongkir "Free"
        let deliveryFee = 0;
        if (overallSubtotal === 0) {
            deliveryFee = 0;
            deliveryEl.innerText = 'Rp0';
        } else if (overallSubtotal < 200000) {
            deliveryFee = 15000;
            deliveryEl.innerText = 'Rp15.000';
        } else {
            deliveryFee = 0;
            deliveryEl.innerText = 'Free';
        }

        let finalTotal = overallSubtotal + deliveryFee;

        subtotalEl.innerText = 'Rp' + overallSubtotal.toLocaleString('id-ID');
        totalEl.innerText = 'Rp' + finalTotal.toLocaleString('id-ID');
    }

    function updateNavbarBadge() {
        const badge = document.getElementById('cart-badge');
        if (badge) {
            let totalQty = 0;
            cart.forEach(item => totalQty += item.qty);
            badge.innerText = totalQty;
        }
    }

    // --- BAGIAN D: FORM VALIDASI & KONFIRMASI ALERT ---
    const deliveryForm = document.getElementById('delivery-form');
    if (deliveryForm) {
        deliveryForm.addEventListener('submit', function (event) {
            event.preventDefault(); 

            if (cart.length === 0) {
                alert("Your cart is empty Fill it with something yummy!");
                return;
            }

            // Validasi apakah pengguna sudah memilih variasi rasa atau belum
            let flavorValid = true;
            cart.forEach(item => {
                if(item.selectedFlavor === "") flavorValid = false;
            });

            if (!flavorValid) {
                alert("Please select a cake variant first from the '-- select flavor --'!");
                return;
            }

            const clientName = document.getElementById('input-name').value;
            const clientAddress = document.getElementById('input-address').value;
            const paymentMethod = document.getElementById('input-payment').value;
            const orderNotes = document.getElementById('input-notes').value || "-";
            const grandTotal = document.getElementById('summary-total').innerText;

            let itemSummaryText = "";
            cart.forEach(item => {
                itemSummaryText += `- ${item.name} (${item.selectedFlavor}) x${item.qty}\n`;
            });

            alert(
                "✨ ORDER SUCCESSFULLY CONFIRMMED! ✨\n\n" +
                "Hello " + clientName + ",\n" +
                "Thank you for shopping at Chayra Bakery.\n\n" +
                "--- Cake Details ---\n" +
                itemSummaryText + "\n" +
                "--- Delivery Details ---\n" +
                "📍 Shipping Address: " + clientAddress + "\n" +
                "💳 Payment Method: " + paymentMethod + "\n" +
                "📝 Notes: " + orderNotes + "\n" +
                "💰 Total Payment: " + grandTotal + "\n\n" +
                "Your order will be processed shortly by our team! 🍰"
            );

            cart = [];
            saveAndRefresh();
            deliveryForm.reset();
        });
    }

    updateNavbarBadge();
    renderCartHtml();
});