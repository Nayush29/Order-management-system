document.querySelector("form").addEventListener("submit", function (event) {
  event.preventDefault();
  var password = document.getElementById("password").value;
  var username = document.getElementById("username").value;

  if (validateForm(password, username)) {
    const formData = new FormData(this);
    fetch("/login", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.redirect_url) {
          showMessage(data.message, "success");
          setTimeout(() => {
            window.location.href = data.redirect_url;
          }, 1000);
        } else {
          showMessage(data.error, "error");
        }
      })
      .catch((error) => {
        showMessage("An error occurred. Please try again later.", "error");
      });
  }
});

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
function validateForm(password, username) {
  const usernameRegex = /^[a-zA-Z0-9]+$/;

  if (!password.trim()) {
    if (!usernameRegex.test(username)) {
      showMessage("Username must contain only characters and digits.", "error");
      return false;
    }
    return true;
  }

  if (password.length < 8) {
    showMessage("Password must be at least 8 characters long.", "error");
    document.getElementById("password").value = "";
    return false;
  }

  const hasAlphabet = /[a-zA-Z]/.test(password);
  if (!hasAlphabet) {
    showMessage("Password must contain alphabetic character.", "error");
    document.getElementById("password").value = "";
    return false;
  }

  const hasNumber = /\d/.test(password);
  if (!hasNumber) {
    showMessage("Password must contain numeric character.", "error");
    document.getElementById("password").value = "";
    return false;
  }

  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  if (!hasSpecialChar) {
    showMessage("Password must contain special character.", "error");
    document.getElementById("password").value = "";
    return false;
  }

  if (!usernameRegex.test(username)) {
    showMessage("Username must contain only characters and digits.", "error");
    return false;
  }

  return true;
}
