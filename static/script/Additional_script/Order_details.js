function toggleMenu() {
    var menu = document.getElementById("menuOptions");
    var icon = document.getElementById("icon-menu");
    menu.classList.toggle("show");
    icon.classList.toggle("active");
}

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

function showMessage(message, type, duration = 3500) {
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

// Function to toggle between forms
function toggleForms(showFormId, hideFormId) {
    const showForm = document.getElementById(showFormId);
    const hideForm = document.getElementById(hideFormId);
    showForm.style.display = "block";
    hideForm.style.display = "none";
}

document.addEventListener("DOMContentLoaded", function () {
    const container = document.querySelector(".container2");

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
                showMessage(errorMessage, "error");
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
                    showMessage(message, "success");
                    container.style.display = "none";
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else if (error) {
                    showMessage(message, "error");
                } else {
                    showMessage(message, "error");
                    setTimeout(() => {
                        toggleForms("modalRegister", "modalSignin");
                    }, 1000);
                }
            } catch (error) {
                showMessage("An error occurred. Please try again later.", "error");
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
        // Prevent default action
        event.preventDefault();
        // Clear the user_id cookie
        document.cookie =
            "user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        showMessage("You have been logged out.", "success");
        setTimeout(() => {
            window.history.back();
        }, 1500);
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

document.getElementById('submit-feedback-review').addEventListener('click', function () {

    const userId = getCookie("user_id");
    const login = document.getElementById("container2"); // Select the first element with class "container"
    if (!userId) {
        showMessage("Please log in or register to submit feedback.", "error");
        login.style.display = "block"; // Show the login
        return;
    }

    const orderId = document.getElementById('order-id').value;
    if (!orderId) {
        showMessage("Please provide an order ID.", "error");
        return;
    }

    const foodQuality = document.querySelector('input[name="food-quality"]:checked');
    const service = document.querySelector('input[name="service"]:checked');
    const ambience = document.querySelector('input[name="ambience"]:checked');
    const additionalFeedback = document.getElementById('feedback-review').value.trim();

    if (!foodQuality && !service && !ambience) {
        showMessage("Please rate at least one aspect: food quality, service, or ambience.", "error");
        return;
    }

    fetch('/api/submit-feedback', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            customerId: userId,
            orderId,
            foodQuality: foodQuality ? foodQuality.value : null,
            service: service ? service.value : null,
            ambience: ambience ? ambience.value : null,
            additionalFeedback: additionalFeedback || null
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success == true) {
                showMessage(data.message, "success")
                document.getElementById('mega_arange').style.display = "none";
                document.getElementById('feedback-submitted-message').style.display = "block";
            } else {
                showMessage(data.message, "error")
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
});

document.getElementById('back-button').addEventListener('click', function () {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.close();
    }
});

window.addEventListener("load", function () {
    const feedbackIdElement = document.getElementById('feedbackId').value;
    if (isNaN(feedbackIdElement)) {
        document.getElementById('mega_arange').style.display = "block";
        document.getElementById('feedback-submitted-message').style.display = "none";
    } else {
        document.getElementById('mega_arange').style.display = "none";
        document.getElementById('feedback-submitted-message').style.display = "block";
    }
});

function pay() {
    const modal = document.getElementById("payModal");
    const span = document.getElementById("Close");

    modal.style.display = "block";

    span.onclick = function () {
        modal.style.display = "none";
    };
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };
};

function onlinePaymentButton(orderId, totalPrice, tableNumber, paymentMethod) {
    processPayment(orderId, totalPrice, tableNumber, paymentMethod);
};

function waiterPaymentButton(orderId, totalPrice, tableNumber, paymentMethod) {
    processPayment(orderId, totalPrice, tableNumber, paymentMethod);
}

function processPayment(orderId, totalPrice, tableNumber, paymentMethod) {
    const button = document.getElementById("waiterPaymentButton");
    const button2 = document.getElementById("onlinePaymentButton")
    if (button && button2) {
        button.disabled = true;
        button2.disabled = true;
    }
    const userId = getCookie("user_id");
    var data = {
        userId: userId,
        totalAmount: totalPrice,
        tableNumber: tableNumber,
        orderId: orderId,
        paymentMethod: paymentMethod
    };

    fetch("/api/payment", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            if (data.redirect_url) {
                showMessage(data.message, "success")
                setTimeout(() => {
                    window.location.href = data.redirect_url;
                }, 2000);
            } else {
                showMessage(data.message, "success")
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            if (button && button2) {
                button.disabled = false;
                button2.disabled = false;
            }
        })
}