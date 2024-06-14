document.addEventListener("DOMContentLoaded", function () {
  const logoutButton = document.getElementById('logout');
  logoutButton.addEventListener('click', handleLogout);
  setInterval(updateCurrentDateTime);
  setInterval(updateTimesSinceOrder, 1000);
  fetchLatestOrders();
  setInterval(fetchLatestOrders, 10000);
});

function handleLogout() {
  fetch("/logout", { method: "POST" })
    .then(response => response.json())
    .then(data => {
      const message = data.message || 'Logout failed. Please try again.';
      showMessage(message, data.message ? "success" : "error");
      if (data.message) {
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      }
    })
    .catch(error => {
      console.error("Error:", error);
      showMessage('Logout failed. Please try again.', "error");
    });
}

function showMessage(message, type, duration = 3000) {
  const messageContainer = document.createElement("div");
  messageContainer.textContent = message;
  messageContainer.className = `message-container ${type}`;
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

function updateCurrentDateTime() {
  const currentDateTimeElem = document.getElementById("currentDateTime");
  const now = new Date();
  currentDateTimeElem.textContent = now.toLocaleString();
}

function updateTimesSinceOrder() {
  const timeOrderedElements = document.querySelectorAll('[id^="timeOrdered"]');
  timeOrderedElements.forEach(elem => {
    const orderId = elem.getAttribute("data-order-id");
    const timeSinceOrderElem = document.getElementById("timeSinceOrder" + orderId);
    if (timeSinceOrderElem) {
      const [timeString, period] = elem.textContent.trim().split(' ');
      let [hours, minutes] = timeString.split(':').map(Number);
      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      const timeOrdered = new Date();
      timeOrdered.setHours(hours, minutes, 0, 0);
      const timeDifference = Math.floor((Date.now() - timeOrdered) / 60000);
      timeSinceOrderElem.textContent = `${timeDifference} minutes ago`;
    }
  });
}

function updateStatus(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);

  fetch('/api/updatestatus', { method: 'POST', body: formData })
    .then(response => response.json())
    .then(data => {
      const message = data.message || 'Status update failed. Please try again.';
      showMessage(message, data.message ? "success" : "error");
      if (data.message) {
        window.location.reload();
      }
    })
    .catch(error => {
      console.error('There was a problem updating status:', error);
      showMessage('Status update failed. Please try again.', "error");
    });
}

function fetchLatestOrders() {
  fetch("/api/orders")
    .then(response => response.json())
    .then(data => {
      const newOrdersContainer = document.getElementById("new-order-table");
      const completedTableBody = document.getElementById('completed-orders-table');
      newOrdersContainer.innerHTML = '';
      completedTableBody.innerHTML = '';
      function parseOrderTime(timeStr) {
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');
        hours = parseInt(hours, 10);
        minutes = parseInt(minutes, 10);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
      }
      data.sort((a, b) => parseOrderTime(b.order_date) - parseOrderTime(a.order_date));
      data.forEach(order => {
        const orderClass = order.order_items.every(item => item.status === 'Complete') ? 'Complete' : 'Pending';
        const tableBody = order.order_items.every(item => item.status === 'Complete') ? completedTableBody : newOrdersContainer;
        order.order_items.forEach((item, index) => {
          const row = document.createElement("tr");
          row.setAttribute("data-id", order.order_id);
          if (index === 0) {
            row.innerHTML = `
              <td class="${orderClass}" rowspan="${order.order_items.length}">${order.order_id}</td>
              <td class="${orderClass}" rowspan="${order.order_items.length}" id="timeOrdered" data-order-id="${order.order_id}">${order.order_date}</td>`;
            if (orderClass !== 'Complete') {
              row.innerHTML += `<td class="${orderClass}" rowspan="${order.order_items.length}" id="timeSinceOrder${order.order_id}" data-id="timeSinceOrder"></td>`;
            }
            row.innerHTML += `<td class="${orderClass}" rowspan="${order.order_items.length}">${order.special_instructions}</td>`;
          }
          row.innerHTML += `
            <td class="${item.status}">${item.item_name}</td>
            <td class="${item.status}">${item.item_quantity}</td>
            <td class="${item.status}">${item.status}</td>`;
          if (orderClass !== 'Complete') {
            row.innerHTML += `
              <td class="${item.status}" id="updateStatus">
                <form class="option" onsubmit="updateStatus(event)">
                  <input type="hidden" name="item-status" value="${item.new_id}">
                  <select name="status" id="status${item.new_id}">
                    <option value="Pending" ${item.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="In-Progress" ${item.status === 'In-Progress' ? 'selected' : ''}>In-Progress</option>
                    <option value="Complete" ${item.status === 'Complete' ? 'selected' : ''}>Complete</option>
                  </select>
                  <button type="submit">Update Status</button>
                </form>
              </td>`;
          }
          tableBody.appendChild(row);
        });
        if (orderClass === 'Complete' && order !== data[data.length - 1]) {
          const hr = document.createElement("hr");
          completedTableBody.appendChild(hr);
        } else if (order !== data[data.length - 1]) {
          const hr = document.createElement("hr");
          newOrdersContainer.appendChild(hr);
        }
      });
    })
    .catch(error => {
      console.error("Error fetching orders:", error);
    });
}