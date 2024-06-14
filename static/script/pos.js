var intervalId;

document.addEventListener("DOMContentLoaded", function () {
    setInterval(updateCurrentDateTime);
    document.getElementById('logout').addEventListener('click', handleLogout);
});

function updateCurrentDateTime() {
    const currentDateTimeElem = document.getElementById("currentDateTime");
    const now = new Date();
    const dateTimeString = now.toLocaleString();
    currentDateTimeElem.textContent = dateTimeString;
}

function handleLogout() {
    fetch("/logout", {
        method: "POST"
    })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                showMessage(data.message, "success");
                setTimeout(() => {
                    window.location.href = "/login";
                }, 1500);
            } else {
                showMessage('Logout failed. Please try again.', "error");
            }
        })
        .catch(error => {
            console.error("Error:", error);
            showMessage('An error occurred. Please try again later.', "error");
        });
}

function showMessage(message, type, duration = 3000) {
    const messageContainer = document.createElement("div");
    messageContainer.textContent = message;
    messageContainer.classList.add("message-container", type);
    document.body.appendChild(messageContainer);

    setTimeout(() => {
        messageContainer.style.opacity = "1";
    }, 100);

    setTimeout(() => {
        messageContainer.style.opacity = "0";
        setTimeout(() => {
            document.body.removeChild(messageContainer);
        }, 500);
    }, duration);
}

function showOrderDetails() {
    clearInterval(intervalId);
    const optionsSection = document.getElementById("optionsSection");
    optionsSection.innerHTML = `
      <div class="column">
        <div class="ready-to-serve-orders">
          <h3>Ready to Serve Orders</h3>
          <hr>
          <table class="table2">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer Name</th>
                <th>Table Number</th>
                <th>Amount</th>
                <th>Quantity</th>
                <th>Item Name</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="customerDetailsTable">
            </tbody>
          </table>
        </div>
      </div>
    `;

    fetchOrders();
    intervalId = setInterval(fetchOrders, 10000);
}

function fetchOrders() {
    fetch('/api/servereadyoders')
        .then(response => response.json())
        .then(data => {
            const customerDetailsTable = document.getElementById("customerDetailsTable");
            const processedOrders = new Set();
            const fragment = document.createDocumentFragment();

            data.forEach(order => {
                if (!processedOrders.has(order.orderID)) {
                    order.items.forEach((item, index) => {
                        const row = document.createElement("tr");
                        if (index === 0) {
                            row.innerHTML = `
                            <td rowspan="${order.items.length}">${order.orderID}</td>
                            <td rowspan="${order.items.length}">${order.customerName}</td>
                            <td rowspan="${order.items.length}">${order.tableNumber}</td>
                            <td rowspan="${order.items.length}">${order.amount}</td>
                            <td>${item.quantity}</td>
                            <td>${item.itemName}</td>
                            <td><button class="btn" onclick="serveOrder(${order.orderID},${item.itemID},this)">Mark Served</button></td>
                            `;
                        } else {
                            row.innerHTML = `
                                <td>${item.quantity}</td>
                                <td>${item.itemName}</td>
                                <td><button class="btn" onclick="serveOrder(${order.orderID},${item.itemID},this)">Mark Served</button></td>
                                `;
                        }
                        fragment.appendChild(row);
                    });
                    processedOrders.add(order.orderID);
                }
            });
            customerDetailsTable.innerHTML = "";
            customerDetailsTable.appendChild(fragment);
        })
        .catch(error => {
            console.error('Error fetching ready to serve orders:', error);
            showMessage('An error occurred. Please try again later.', "error");
        });
}

function serveOrder(orderID, itemID, button) {
    fetch("/api/markitemserved", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            orderID: orderID,
            itemID: itemID,
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                button.disabled = true;
                button.textContent = "Served";
                showMessage(data.message, "success");
            }
        })
        .catch((error) => {
            console.error("Error:", error);
            showMessage("Failed to mark item as served. Please try again later.", "error");
        });
}

function showPaymentProcessing() {
    clearInterval(intervalId);
    const optionsSection = document.getElementById("optionsSection");
    optionsSection.innerHTML = `
<div class="payment-processing-container">
  <div class="column1">
    <div class="payment-processing">
      <h3>Payment Processing</h3>
      <hr>
      <table class="table2">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer Name</th>
            <th>Table Number</th>
            <th>Total Amount</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="paymentDetailsTable">
        </tbody>
      </table>
    </div>
  </div>
  <div class="column1" id="payment-column" style="display:none;">
    <h3>Payment</h3>
    <hr>
    <div class="payment-options">
      <label for="payment-method">Select Payment Method:</label>
      <select id="payment-method">
        <option selected disabled>Select Payment Method</option>
        <option value="cash">Cash</option>
        <option value="card">Card</option>
        <option value="upi">UPI</option>
      </select>
    </div>
    <div class="cash-amount" id="cash-amount">
      <label for="cash-input">Enter Cash Amount:</label>
      <input type="number" id="cash-input" placeholder="Enter amount">
      <span class="changeResult" id="changeResult"></span>
      <button class="button btn-success" id="calculateChange">Calculate</button>
    </div>
    <div id="qrCode" style="display: none;">
      <h4>QR Code</h4>
      <img src="" id="qr-code-img" alt="QR Code">
    </div>
    <div id="pos-connection-section" style="display: none;">
      <div class="pos-connection-settings">
        <div class="custom-select">
          <label for="pos-device">Select a POS Machine:</label>
          <div class="select-items select-hide">
            <div class="select-item">
              <input type="checkbox" id="hdfc-pos" value="hdfc-pos">
              <label for="hdfc-pos">HDFC POS</label>
            </div>
            <div class="select-item">
              <input type="checkbox" id="paytme-pos" value="paytme-pos">
              <label for="paytme-pos">Paytme POS</label>
            </div>
            <div class="select-item">
              <input type="checkbox" id="posiflix-pos" value="posiflix-pos">
              <label for="posiflix-pos">Posiflix POS</label>
            </div>
          </div>
        </div>
        <button class="button btn-success" id="test-connection" onclick="testConnection()">Connect</button>
      </div>
    </div>
    <button class="button btn-success" id="confirm-payment">Confirm Payment</button>
    <button class="button btn-danger" id="cancel-payment" onclick="cancelPayment()">Cancel</button>
  </div>
</div>
    `;

    fetchPaymentDetails();
    intervalId = setInterval(fetchPaymentDetails, 10000);
}

function fetchPaymentDetails() {
    fetch('/api/paymentdetails')
        .then(response => response.json())
        .then(data => {
            const paymentDetailsTable = document.getElementById("paymentDetailsTable");
            const fragment = document.createDocumentFragment();
            data.forEach(payment => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${payment.orderID}</td>
                    <td>${payment.customerName}</td>
                    <td>${payment.tableNumber}</td>
                    <td>${payment.amount}</td>
                    <td><button class="btn" onclick="Payment(${payment.amount},${payment.orderID})">Process Payment</button></td>
                `;
                fragment.appendChild(row);
            });
            paymentDetailsTable.innerHTML = "";
            paymentDetailsTable.appendChild(fragment);
        })
        .catch(error => {
            console.error('Error fetching payment details:', error);
            showMessage('An error occurred. Please try again later.', "error");
        });
}

function cancelPayment() {
    const cardSection = document.getElementById("pos-connection-section");
    const qrCodeImg = document.getElementById("qrCode");
    const paymentColumn = document.getElementById("payment-column");
    const paymentMethodSelect = document.getElementById("payment-method");
    const cashAmountInput = document.getElementById("cash-amount");
    const cashInput = document.getElementById("cash-input");
    const changeResult = document.getElementById("changeResult");

    const checkboxes = document.querySelectorAll('.select-items input[type="checkbox"]');
    checkboxes.forEach(checkbox => (checkbox.checked = false));
    cashInput.value = "";
    changeResult.innerText = "";

    [cardSection, qrCodeImg, cashAmountInput, paymentColumn].forEach(section => {
        section.style.display = "none";
    });

    paymentMethodSelect.selectedIndex = 0;
}

function Payment(paymentamount, paymentorderID) {
    const paymentColumn = document.getElementById('payment-column');
    const paymentMethodSelect = document.getElementById("payment-method");
    const cashAmountInput = document.getElementById("cash-amount");
    const qrCodeImg = document.getElementById("qrCode");
    const cardSection = document.getElementById('pos-connection-section');
    const processPaymentButton = document.getElementById('confirm-payment');
    const calculateButton = document.getElementById('calculateChange');

    function handlePaymentMethodChange() {
        const paymentMethod = paymentMethodSelect.value;
        cashAmountInput.style.display = (paymentMethod === "cash") ? "flex" : "none";
        qrCodeImg.style.display = (paymentMethod === "upi") ? "block" : "none";
        cardSection.style.display = (paymentMethod === "card") ? "block" : "none";

        if (processPaymentButton) {
            processPaymentButton.setAttribute('onclick', `processPayment('${paymentMethod}', '${paymentorderID}')`);
        }

        if (paymentMethod === "upi") {
            generateQRCode(paymentamount);
        }
    }

    paymentMethodSelect.addEventListener("change", handlePaymentMethodChange);

    if (processPaymentButton) {
        processPaymentButton.setAttribute('onclick', `processPayment('${paymentMethodSelect.value}', '${paymentorderID}')`);
    }

    if (calculateButton) {
        calculateButton.setAttribute('onclick', `calculateChange(${paymentamount})`);
    }

    paymentColumn.style.display = "block";
}

function generateQRCode(paymentamount) {
    var qrCodeImg = document.getElementById("qr-code-img");
    qrCodeImg.src = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + paymentamount;
}

function calculateChange(totalAmount) {
    var cashInput = document.getElementById("cash-input").value;

    if (isNaN(cashInput) || cashInput <= 0 || cashInput < totalAmount) {
        showMessage("Please enter a valid cash amount.", "error")
        return;
    }
    var change = cashInput - totalAmount;

    var resultElement = document.getElementById("changeResult");
    resultElement.innerText = "Change: RS." + change.toFixed(0);
}

function testConnection() {
    var confirmPaymentButton = document.getElementById('confirm-payment');
    var cancelPaymentButton = document.getElementById('cancel-payment');
    confirmPaymentButton.disabled = true;
    cancelPaymentButton.disabled = true;

    showMessage("Connecting...", "error");

    setTimeout(function () {
        confirmPaymentButton.disabled = false;
        cancelPaymentButton.disabled = false;
        showMessage("Payment completed successfully!", "success");
    }, 5000);
}

function processPayment(paymentMethod, orderID) {
    if (paymentMethod === "Select Payment Method") {
        showMessage("Please select a payment method.", "error");
        return;
    }
    const paymentData = {
        payment_status: "completed",
        payment_method: paymentMethod,
        orderID: orderID
    };

    fetch("/api/update_payment", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(paymentData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                showMessage(data.message, "success");
                cancelPayment();
            }
        })
        .catch(error => {
            showMessage("Error updating payment status: " + error.message, "error");
        });
}

function takeOrder() {
    clearInterval(intervalId);
    const optionsSection = document.getElementById("optionsSection");
    optionsSection.innerHTML = '';
    const newContentDiv = document.createElement('div');
    newContentDiv.className = 'menu-content';

    fetch('/')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.text();
        })
        .then(html => {
            newContentDiv.innerHTML = html;
            optionsSection.appendChild(newContentDiv);
            const footer = newContentDiv.querySelector('footer.footer');
            if (footer) {
                footer.remove();
            }

            const fetchedLoadingOverlay = newContentDiv.querySelector('.loading-overlay');
            if (fetchedLoadingOverlay) {
                fetchedLoadingOverlay.style.display = 'none';
            }
            const script = document.createElement('script');
            script.src = '/static/script/menu.js';
            script.defer = true;
            document.body.appendChild(script);
        })
        .catch(error => console.error('There was a problem with the fetch operation:', error));
}

