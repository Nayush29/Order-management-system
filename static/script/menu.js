const cartItems = JSON.parse(sessionStorage.getItem("cartItems")) || {};

const getElement = (itemId) => document.getElementById(itemId);

const setDisplayStyle = (elementId, display) =>
  (getElement(elementId).style.display = display);

var loadingOverlay = document.querySelector(".loading-overlay");

window.addEventListener("load", function () {
  loadingOverlay.style.display = "none";

  if (cartItems && Object.keys(cartItems).length > 0) {
    Object.values(cartItems).forEach(function (item) {
      toggleQuantity(item.id, item.name, item.price, item.image);
    });
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const shortMessage = sessionStorage.getItem("popupMessage");
  const shortMessageColor = sessionStorage.getItem("popupColor");
  const orderDetails = sessionStorage.getItem("orderDetails");

  if (shortMessage && shortMessageColor) {
    showMessage(shortMessage, shortMessageColor, 3000);
  }

  if (orderDetails) {
    const orderDetailsArray = orderDetails.split(", ");
    showModal(orderDetailsArray);
  }
  sessionStorage.clear();
});

document.addEventListener("DOMContentLoaded", function () {
  const modal = document.querySelector(".checkout");
  const closeBtn = modal.querySelector(".close-btn");
  const cartIcon = document.getElementById("cart");

  closeBtn.addEventListener("click", function () {
    modal.style.display = "none";
  });

  cartIcon.addEventListener("click", function () {
    modal.style.display = "block";
    renderCartItems();
  });
});

document.querySelectorAll(".category").forEach((category) => {
  category.onclick = function (event) {
    event.preventDefault();
    const categoryId = this.getAttribute("data-category-id");
    showDishes(categoryId);
  };
});

function showDishes(categoryId) {
  const allProducts = document.querySelectorAll(".product");
  allProducts.forEach((product) => {
    product.style.display = "none";
  });
  const selectedProducts = document.querySelectorAll(
    '.product[data-category-id="' + categoryId + '"]'
  );
  selectedProducts.forEach((product) => {
    product.style.display = "block";
  });
}

function hideQuantityContainer(itemId) {
  setDisplayStyle("Button-" + itemId, "flex");
  setDisplayStyle("Quantity-" + itemId, "none");
}

function saveCartItemsToStorage() {
  sessionStorage.setItem("cartItems", JSON.stringify(cartItems));
}

function checkAndDeleteZeroQuantityItems() {
  if (typeof cartItems === "object") {
    for (let key in cartItems) {
      if (cartItems.hasOwnProperty(key) && cartItems[key].quantity === 0) {
        delete cartItems[key];
      }
    }
    saveCartItemsToStorage();
  }
}

function updateQuantity(itemId, operation) {
  const maxValue = parseInt(
    getElement("quantity-input-" + itemId).getAttribute("max")
  );

  let currentQuantity = cartItems[itemId]?.quantity || 1;

  if (operation === "increment" && currentQuantity < maxValue) {
    getElement("quantity-input-" + itemId).value = ++currentQuantity;
    cartItems[itemId] = { ...cartItems[itemId], quantity: currentQuantity };
  } else if (operation === "decrement" && currentQuantity > 0) {
    getElement("quantity-input-" + itemId).value = --currentQuantity;
    cartItems[itemId] = { ...cartItems[itemId], quantity: currentQuantity };
    if (currentQuantity === 0) {
      showMessage('Item has been removed.', "success", 1500);
      checkAndDeleteZeroQuantityItems();
      hideQuantityContainer(itemId);
    }
  } else if (currentQuantity === maxValue) {
    showMessage("Maximum order quantity reached!", "error", 2000);
  }
  renderCartItems();
  saveCartItemsToStorage();
  updateCart();
}

function toggleQuantity(itemId, itemName, itemPrice, itemimage) {
  const itemIdNumber = itemId.split("-")[1];
  const quantityContainerId = "Quantity-" + itemIdNumber;
  const quantityContainer = getElement(quantityContainerId);
  const inputElement = getElement("quantity-input-" + itemIdNumber);

  var currentQuantity = 1;

  if (cartItems) {
    Object.values(cartItems).forEach(function (item) {
      if (item.id === itemId) {
        currentQuantity = item.quantity;
      }
    });
  }

  inputElement.value = currentQuantity;

  if (
    !quantityContainer.style.display ||
    quantityContainer.style.display === "none"
  ) {
    setDisplayStyle(quantityContainerId, "flex");
    setDisplayStyle(itemId, "none");

    cartItems[itemIdNumber] = {
      id: itemId,
      name: itemName,
      price: itemPrice,
      quantity: currentQuantity,
      image: itemimage,
    };
  } else {
    hideQuantityContainer(itemId);
  }
  saveCartItemsToStorage();
  updateCart();
}

function updateCart() {
  const cartQuantityElement = document.getElementById("cart-quantity");
  const checkoutModal = document.querySelector(".checkout");
  const cartTotalElement = document.getElementById("cart-total");
  const cartElement = document.getElementById("cart");

  let totalQuantity = 0;
  let totalPrice = 0;

  for (const itemId in cartItems) {
    if (cartItems.hasOwnProperty(itemId)) {
      totalQuantity += cartItems[itemId].quantity;
      totalPrice +=
        cartItems[itemId].quantity * parseFloat(cartItems[itemId].price);
    }
  }

  if (totalQuantity === 0) {
    checkoutModal.style.display = "none";
    renderCartItems();
  }

  cartQuantityElement.textContent = totalQuantity;
  cartTotalElement.textContent = totalPrice.toFixed(0);

  cartElement.style.display =
    totalQuantity > 0 && totalPrice > 0 ? "flex" : "none";
}

function showMessage(message, type, duration) {
  const messageContainer = document.createElement("div");
  messageContainer.textContent = message;
  messageContainer.classList.add("message-container", type);
  document.body.appendChild(messageContainer);

  // Check if the message is long
  const longMessageThreshold = 60;
  const trimmedMessage = message.trim();
  if (trimmedMessage.length > longMessageThreshold) {
    messageContainer.classList.add('long-message');
  }

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

function handleDelete(item_id) {
  if (!cartItems.hasOwnProperty(item_id)) return;

  delete cartItems[item_id];
  showMessage('Item has been removed.', "success", 1500);
  renderCartItems();
  saveCartItemsToStorage();
  checkAndDeleteZeroQuantityItems();
  hideQuantityContainer(item_id);
  updateCart();
}

function createCartItemElement(
  itemId,
  itemName,
  itemPrice,
  itemQuantity,
  itemimage
) {
  const item_id = itemId.split("-")[1];
  const ItemPrice = itemPrice.split(".")[0];

  const productContainer = document.createElement("div");
  productContainer.classList.add("Plate-product");

  const imageContainer = document.createElement("div");
  imageContainer.classList.add("Plate-product-image");
  const image = document.createElement("img");
  image.src = itemimage;
  imageContainer.appendChild(image);

  const infoContainer = document.createElement("div");
  infoContainer.classList.add("Plate-Product-info");
  const title = document.createElement("div");
  title.classList.add("Plate-product-title");
  title.textContent = itemName;
  const price = document.createElement("div");
  price.classList.add("Plate-product-price");
  price.textContent = "Rs" + ItemPrice;
  infoContainer.appendChild(title);
  infoContainer.appendChild(price);

  const quantityContainer = document.createElement("div");
  quantityContainer.classList.add("Quantity-info");
  const buttonInfo = document.createElement("div");
  buttonInfo.classList.add("Button-info");
  const decrementButton = document.createElement("div");
  decrementButton.classList.add("quantity-button");
  decrementButton.setAttribute(
    "onclick",
    "updateQuantity('" + item_id + "', 'decrement')"
  );
  decrementButton.setAttribute("role", "button");
  decrementButton.textContent = "-";
  const quantityInput = document.createElement("input");
  quantityInput.classList.add("quantity-input");
  quantityInput.id = "quantity-input-" + item_id;
  quantityInput.type = "number";
  quantityInput.disabled = true;
  quantityInput.max = "5";
  quantityInput.value = itemQuantity;
  const incrementButton = document.createElement("div");
  incrementButton.classList.add("quantity-button");
  incrementButton.setAttribute(
    "onclick",
    "updateQuantity('" + item_id + "', 'increment')"
  );
  incrementButton.setAttribute("role", "button");
  incrementButton.textContent = "+";

  buttonInfo.appendChild(decrementButton);
  buttonInfo.appendChild(quantityInput);
  buttonInfo.appendChild(incrementButton);
  quantityContainer.appendChild(buttonInfo);

  const deleteButtonContainer = document.createElement("div");
  deleteButtonContainer.classList.add("Delete-button");
  const imgElement = document.createElement("img");
  imgElement.src = "/static/icon/Additional_icon/remove.svg";
  imgElement.alt = "Remove Icon";
  imgElement.type = "image/svg+xml";
  deleteButtonContainer.appendChild(imgElement);
  deleteButtonContainer.addEventListener("click", function () {
    handleDelete(item_id);
  });
  quantityContainer.appendChild(deleteButtonContainer);

  deleteButtonContainer.addEventListener("mouseenter", function () {
    deleteButtonContainer.style.cursor = "pointer";
  });

  deleteButtonContainer.addEventListener("mouseleave", function () {
    deleteButtonContainer.style.cursor = "default";
  });

  productContainer.appendChild(imageContainer);
  productContainer.appendChild(infoContainer);
  productContainer.appendChild(quantityContainer);

  return productContainer;
}

function renderCartItems() {
  const cartContainers = document.getElementsByClassName("Plate-product-list");

  for (const cartContainer of cartContainers) {
    cartContainer.innerHTML = "";

    for (const itemId in cartItems) {
      if (cartItems.hasOwnProperty(itemId)) {
        const { id, name, price, quantity, image } = cartItems[itemId];
        let imageSrc = image; // Assign image to imageSrc by default

        // Check if image is 'None' and set it to the fallback image path if true
        if (image === "None") {
          imageSrc = "/static/images/Additional_images/coming_soon.jpg";
        } else imageSrc = "data:image/jpeg;base64," + image;

        const cartItemElement = createCartItemElement(
          id,
          name,
          price,
          quantity,
          imageSrc
        );
        cartContainer.appendChild(cartItemElement);
      }
    }
  }

  let totalPrice = 0;
  let totalitems = 0;

  for (const itemId in cartItems) {
    if (cartItems.hasOwnProperty(itemId)) {
      totalitems += cartItems[itemId].quantity;
      totalPrice +=
        cartItems[itemId].quantity * parseFloat(cartItems[itemId].price);
    }
  }

  const billAmountElement = document.querySelector(".bill-Items");
  billAmountElement.textContent = totalitems;

  const totalAmountElement = document.querySelector(".total-amount");
  totalAmountElement.textContent = "₹" + totalPrice.toFixed(0);
}

function toggleMenu() {
  var menu = document.getElementById("menuOptions");
  var icon = document.getElementById("icon-menu");
  menu.classList.toggle("show");
  icon.classList.toggle("active");
}

function checkout() {
  // Check if the user is logged in by checking the user_id cookie
  const userId = getCookie("user_id");
  const login = document.getElementById("container"); // Select the first element with class "container"
  if (!userId) {
    showMessage("Please log in or register to place an order.", "error", 5000);
    login.style.display = "block"; // Show the login
    return;
  }

  // If the user is logged in
  const url = window.location.href;
  const urlParams = new URLSearchParams(new URL(url).search);
  const tableNumber = urlParams.get('table_number');

  if (tableNumber === null || tableNumber === '') {
    showMessage("Please provide the table number to place your order. You can scan the table QR code.", "error", 5000);
    return; // Stop execution if table number is not provided
  }

  const today = new Date();
  const datePart =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();
  const orderId = datePart * 1000 + Math.floor(Math.random() * 1000);
  const specialInstructions = document.getElementById(
    "special-instructions"
  ).value;

  let total = 0;
  let totalQuantity = 0;
  for (let item in cartItems) {
    total += cartItems[item].price * cartItems[item].quantity;
    totalQuantity += cartItems[item].quantity;
  }

  const itemsData = [];
  for (let item in cartItems) {
    const itemId = item;
    const itemName = cartItems[item].name;
    const itemQuantity = cartItems[item].quantity;
    itemsData.push({ itemId, itemName, itemQuantity });
  }

  const checkoutData = {
    orderId: orderId,
    tableNumber: tableNumber,
    cartItems: itemsData,
    specialInstructions: specialInstructions,
    total: total,
    totalQuantity: totalQuantity,
    customer_id: getCookie("user_id"),
  };

  fetch("/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(checkoutData),
  }).then((response) => {
    if (response.ok) {
      sessionStorage.clear();
      setCookie("orderId", orderId, 1); // Set cookie with order ID and expiry of 1 day
      const orderDetails = `Order ID: ${orderId}, Total:RS.${total}, Total Quantity: ${totalQuantity}`;
      sessionStorage.setItem("orderDetails", orderDetails);
      sessionStorage.setItem("popupMessage", "Order placed!");
      sessionStorage.setItem("popupColor", "success");
      window.location.reload();
    } else {
      showMessage("Failed to place order!", "error", 3000);
    }
  });
}

// Function to retrieve a cookie by name
function getCookie(name) {
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.split("=");
    if (cookieName.trim() === name) {
      return cookieValue;
    }
  }
  return null;
}

function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "expires=" + date.toUTCString();
  document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function showModal(content) {
  const modal = document.getElementById("orderDetailsModal");
  const modalContent = document.getElementById("orderDetailsContent");
  const ul = document.createElement("ul");

  content.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    ul.appendChild(li);
  });

  modalContent.innerHTML = "";
  modalContent.appendChild(ul);

  modal.style.display = "block";
  modal.addEventListener("click", function (event) {
    if (event.target.classList.contains("close")) {
      modal.style.display = "none";
    }
  });
}

// Function to toggle between forms
function toggleForms(showFormId, hideFormId) {
  const showForm = document.getElementById(showFormId);
  const hideForm = document.getElementById(hideFormId);
  showForm.style.display = "block";
  hideForm.style.display = "none";
}

document.addEventListener("DOMContentLoaded", function () {
  const container = document.querySelector(".container");
  const modal = document.querySelector(".checkout");

  // Event listener for container clicks
  container.addEventListener("click", async (event) => {
    const { target } = event;
    if (target.id === "loginLink") {
      event.preventDefault();
      toggleForms("modalSignin", "modalRegister");
    } else if (target.id === "registerLink") {
      event.preventDefault();
      toggleForms("modalRegister", "modalSignin");
    } else if (target.classList.contains("close")) {
      container.style.display = "none";
      toggleForms("modalSignin", "modalRegister");
    }
  });

  // Function to handle form submission
  async function handleFormSubmission(formId, actionType) {
    const form = document.getElementById(formId);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      const cleanedFormData = new URLSearchParams();

      let isValid = true;
      let errorMessage = "";

      formData.forEach((value, key) => {
        let cleanedValue = value; // Start with the original value

        // Remove leading zeros only for the phone number
        if (key === "number") {
          cleanedValue = cleanedValue.replace(/^0+/, '');
          if (cleanedValue.length < 10) {
            isValid = false;
            errorMessage = "Phone number must be 10 digits.";
          } else if (cleanedValue.length > 10) {
            isValid = false;
            errorMessage = "Phone number cannot be more than 10 digits.";
          }
        }

        // Validation for password
        if (key === "new-password") {
          const hasDigit = /\d/.test(cleanedValue);
          if (cleanedValue.length < 6) {
            isValid = false;
            errorMessage = "Password must be at least 6 characters long and contain at least one digit.";
          } else if (!hasDigit) {
            isValid = false;
            errorMessage = "Password must contain at least one digit.";
          }
        }

        cleanedFormData.append(key, cleanedValue);
      });

      if (!isValid) {
        showMessage(errorMessage, "error", 3000);
        return;
      }

      // Make the fetch request only if isValid is true
      try {
        const response = await fetch("/auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: cleanedFormData.toString() + "&" + actionType,
        });

        const responseData = await response.json();
        const { success, error, message } = responseData;

        if (success) {
          showMessage(message, "success", 3000);
          if (modal.style.display === "block") {
            container.style.display = "none";
          } else {
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        } else if (error) {
          showMessage(message, "error", 5000);
        } else {
          showMessage(message, "error", 3000);
          setTimeout(() => {
            toggleForms("modalRegister", "modalSignin");
          }, 1000);
        }
      } catch (error) {
        showMessage("An error occurred. Please try again later.", "error", 3000);
      }
    });
  }
  // Handle sign-in form submission
  handleFormSubmission("signinForm", "login");
  // Handle registration form submission
  handleFormSubmission("registerForm", "register");

  // Event listener for login button
  const loginButton = document.getElementById("login");
  const menuOptions = document.getElementById("menuOptions");
  var icon = document.getElementById("icon-menu");
  loginButton.addEventListener("click", (event) => {
    event.preventDefault();
    container.style.display = "block";
    menuOptions.classList.remove("show");
    icon.classList.remove("active");
  });

  const logoutButton = document.getElementById("logout");
  logoutButton.addEventListener("click", (event) => {
    event.preventDefault();
    const cookies = document.cookie.split("; ");
    for (let cookie of cookies) {
      const [name, _] = cookie.split("=");
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
    // Show logout message
    showMessage("You have been logged out.", "success", 3000);
    // Reload the page after 1 second
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  });

  const loginLink = document.getElementById("login");
  const logoutLink = document.getElementById("logout");

  // Check if the user is logged in by checking the user_id cookie
  const userId = getCookie("user_id");
  if (userId) {
    // User is logged in, show the logout link
    logoutLink.style.display = "block";
    loginLink.style.display = "none";
  } else {
    // User is not logged in, show the login link
    loginLink.style.display = "block";
    logoutLink.style.display = "none";
  }
});

document.getElementById("details").addEventListener("click", function () {
  // Listen for a click event on the element with ID "details"
  const orderId = getCookie("orderId"); // Retrieve orderId from cookie
  if (orderId) {
    // If orderId is present
    fetch(`/order_details/${orderId}`)
      .then(response => {
        if (response.ok) {
          // If the response is successful, redirect to order details page
          window.location.href = `/order_details/${orderId}`;
        } else {
          // If there's an error in response, display error message from server
          response.json().then(data => {
            showMessage(data.message, "error", 3000);
          });
        }
      })
      .catch(error => {
        // If there's an error in fetching the data, display error message
        showMessage("Error retrieving order details", "error", 3000);
      });
  } else {
    // If orderId is not present, display error message
    showMessage("You have not placed an order yet", "error", 3000);
  }
});

document.addEventListener("click", function (event) {
  const menuOptions = document.getElementById("menuOptions");
  const iconMenu = document.getElementById("icon-menu");

  // Check if the click is outside the menuOptions and iconMenu
  if (!menuOptions.contains(event.target) && !iconMenu.contains(event.target)) {
    // Close the menu if the click is outside the menu and icon, and the menu is shown
    if (menuOptions.classList.contains("show")) {
      menuOptions.classList.remove("show");
      iconMenu.classList.remove("active");
    }
  }
});