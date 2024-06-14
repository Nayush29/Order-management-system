let isFetching = false;

document.addEventListener("DOMContentLoaded", function () {
  var currentDateTimeElem = document.getElementById("currentDateTime");
  setInterval(function () {
    var now = new Date();
    var dateTimeString = now.toLocaleString();
    currentDateTimeElem.textContent = dateTimeString;
  }, 0);
});

function showSalesReport() {
  fetch('/api/sales')
    .then(response => response.json())
    .then(data => {
      document.getElementById("optionsSection").innerHTML = `
  <div class="sales-report">
  <div class="section sales-summary">
    <h2>Sales Summary</h2>
    <hr>
    <table class="styled-table">
      <tbody>
        <tr>
          <td><strong>Total Sales</strong></td>
          <td>RS.${data.total_sales}</td>
        </tr>
        <tr>
          <td colspan="2"><strong>Sales by Category</strong></td>
        </tr>
        <tr>
          <td colspan="2">
            <div class="category-container">
              <table class="category-table">
                <tbody>
                  ${Object.entries(data.sales_by_category_today).map(([category, amount]) => `
                  <tr>
                    <td>${category}</td>
                    <td>RS.${parseFloat(amount).toFixed(0)}</td>
                  </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
        <tr>
          <td colspan="2"><strong>Sales by Time Period</strong></td>
        </tr>
        <tr>
          <td> - This Week's Sales:</td>
          <td>RS.${data.this_week_sales}</td>
        </tr>
        <tr>
          <td> - This Month's Sales:</td>
          <td>RS.${data.this_month_sales}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="section sales-menu">
    <h2>Sales by Menu Item</h2>
    <hr>
    <table class="styled-table">
      <tbody>
        <tr>
          <td colspan="2"><strong>Top-Selling Items</strong></td>
        </tr>
        ${data.top_selling_items_today.map(([item, amount]) => `
        <tr>
          <td> - ${item}</td>
          <td>RS.${parseFloat(amount).toFixed(0)}</td>
        </tr>
        `).join('')}
        <tr>
          <td colspan="2"><strong>Low-Selling Items</strong></td>
        </tr>
        ${data.low_selling_items_today.map(([item, amount]) => `
        <tr>
          <td> - ${item}</td>
          <td>RS.${parseFloat(amount).toFixed(0)}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  <div class="section customer-metrics">
    <h2>Customer Metrics</h2>
    <hr>
    <table class="styled-table">
      <tbody>
        <tr>
          <td><strong>Number of Transactions</strong></td>
          <td>${data.num_transactions}</td>
        </tr>
        <tr>
          <td><strong>Average Transaction Value</strong></td>
          <td>RS.${parseFloat(data.avg_transaction_value).toFixed(0)}</td>
        </tr>
        <tr>
          <td><strong>Customer Count</strong></td>
          <td>${data.unique_customers_today}</td>
        </tr>
        <tr>
          <td colspan="2"><strong>Transactions by Payment Method</strong></td>
        </tr>
        <tr>
          <td> - Online</td>
          <td>${data.transactions_by_payment_method_online} transactions totaling RS.${data.total_amount_online}</td>
        </tr>
        <tr>
          <td> - Waiter</td>
          <td>${data.transactions_by_payment_method_waiter} transactions totaling RS.${data.total_amount_waiter}</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
`;
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
}

function showMenuEditor() {
  document.getElementById("optionsSection").innerHTML = `
  <div class="editor">
  <h2>Menu Editor</h2>
  <hr>
  <form id="form1">
    <input type="hidden" id="action_type" name="action_type" value="menu_item">
    <input type="hidden" id="menu_item_id" name="menu_item_id">
    <div class="form-group">
      <label for="category">Category</label>
      <input type="number" id="category" name="category" class="form-control">
    </div>
    <div class="form-group">
      <label for="name">Name</label>
      <input type="text" id="name" name="name" class="form-control" required>
    </div>
    <div class="form-group">
      <label for="price">Price</label>
      <input type="number" id="price" name="price" class="form-control" step="1" required>
    </div>
    <div class="form-group">
      <label for="image">Upload Image</label>
      <label class="custom-file-input">
        <input type="file" id="image" name="image" accept="image/*" required>
      </label> <label for="image" id="imagepreview" style="display: none;">Image Preview</label>
      <img class="preview" id="imagePreview" style="display: none; width: 100px; height: 100px;">
    </div>
    <div class="form-group">
      <label for="veg">Vegetarian</label>
      <div class="radio-group">
        <input type="radio" id="veg" name="veg_nonveg" value="1" checked>
        <label for="veg">Yes</label>
        <input type="radio" id="nonveg" name="veg_nonveg" value="0">
        <label for="nonveg">No</label>
      </div>
    </div>
    <div class="group">
      <button id="update" type="submit" class="btn btn-primary">Add</button>
      <button onclick="clearForm1()" type="button" class="btn btn-danger">Reset</button>
    </div>
  </form>
</div>
<div id="display-table1" class="display-table">
  <h2>Menu Items</h2>
  <div class="table-container">
    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Category</th>
          <th>Price</th>
          <th>Vegetarian</th>
          <th>Image</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="menu-items">
      </tbody>
    </table>
  </div>
</div>
`;

  fetch("/api/menu_items")
    .then((response) => response.json())
    .then((data) => {
      const menuItemsContainer = document.getElementById("menu-items");
      data.forEach((item) => {
        const row = document.createElement("tr");
        row.setAttribute("data-id", item.menu_item_id);
        let imageSrc =
          item.image === null ?
            "/static/images/Additional_images/coming_soon.jpg" :
            `data:image/jpeg;base64,${item.image}`;
        row.innerHTML = `
                    <td>${item.menu_item_id}</td>
                    <td class="item-name">${item.name}</td>
                    <td class="item-category">${item.category_id}</td>
                    <td class="item-price">${Number(item.price).toFixed(0)}</td>
                    <td class="item-veg">${item.is_veg ? "Yes" : "No"}</td>
                    <td class="item-image"><img src="${imageSrc}" alt="${item.name}"></td>
                    <td>
                        <button class="btn btn-warning" onclick="editItem(${item.menu_item_id})">Edit</button>
                        <button class="btn btn-danger" onclick="hideItem(${item.menu_item_id},this)">Hide</button>
                    </td>
                `;
        menuItemsContainer.appendChild(row);
      });
    });

  document.getElementById("image").addEventListener("change", function (event) {
    const imagePreview = document.getElementById("imagePreview");
    const imagepreview = document.getElementById("imagepreview");
    var divelement1 = document.querySelector(".editor");
    var divelement2 = document.querySelector(".table-container");
    divelement1.style.height = "650px";
    divelement2.style.height = "595px";
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        imagePreview.src = e.target.result;
        imagePreview.style.display = "block";
        imagepreview.style.display = "block";
      };
      reader.readAsDataURL(file);
    } else {
      imagePreview.style.display = "none";
      imagePreview.src = "";
    }
  });

  document.getElementById("form1").addEventListener("submit", function (event) {
    event.preventDefault();
    const formData = new FormData(this);
    fetch("/api/edit", {
      method: "POST",
      enctype: "multipart/form-data",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        showMessage(data.message, data.success ? "success" : "error");
        if (data.success) {
          showMenuEditor();
        }
      })
      .catch((Error) => {
        showMessage("An error occurred. Please try again later.", "error");
      });
  });
}

function editItem(id) {
  clearForm1();
  const row = document.querySelector(`tr[data-id='${id}']`);
  if (row) {
    const item = {
      menu_item_id: id,
      name: row.querySelector(".item-name").textContent,
      category_id: row.querySelector(".item-category").textContent,
      price: parseFloat(row.querySelector(".item-price").textContent),
      is_veg: row.querySelector(".item-veg").textContent === "Yes",
      image: row.querySelector(".item-image img").src.split(",")[1],
    };
    let imageSrc =
      item.image === undefined ?
        "/static/images/Additional_images/coming_soon.jpg" :
        `data:image/jpeg;base64,${item.image}`;

    document.getElementById("menu_item_id").value = id;
    document.getElementById("category").value = item.category_id;
    document.getElementById("name").value = item.name;
    document.getElementById("price").value = item.price;
    document.getElementById("veg").checked = item.is_veg;
    document.getElementById("nonveg").checked = !item.is_veg;
    var divelement1 = document.querySelector(".editor");
    var divelement2 = document.querySelector(".table-container");
    divelement1.style.height = "650px";
    divelement2.style.height = "595px";
    const imagePreview = document.getElementById("imagePreview");
    const imagepreview = document.getElementById("imagepreview");
    imagePreview.src = imageSrc;
    imagepreview.style.display = "block";
    imagePreview.style.display = "block";
    document.getElementById("image").required = false;
    const update = document.getElementById("update");
    update.textContent = "Update";
  } else {
    console.error("Row not found for ID:", id);
  }
}

function hideItem(id, button) {
  fetch("/api/hide_item", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: id
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        if (button.textContent === "Hide") {
          button.textContent = "Unhide";
          button.classList.remove("btn-danger");
          button.classList.add("btn-success");
          alert("Item hidden successfully");
        } else {
          button.textContent = "Hide";
          button.classList.remove("btn-success");
          button.classList.add("btn-danger");
          alert("Item unhidden successfully");
        }
      } else {
        alert("Failed to toggle item visibility: " + data.error);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById("Confirmation-Modal");
  const confirmBtn = document.getElementById("confirmBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const closeBtn = document.querySelector(".close");
  let actionFunction = null;

  function closeModal() {
    modal.style.display = "none";
  }

  closeBtn.onclick = () => closeModal();
  window.onclick = (event) => {
    if (event.target == modal) closeModal();
  };
  cancelBtn.onclick = () => closeModal();

  confirmBtn.onclick = () => {
    if (actionFunction) actionFunction();
    closeModal();
  };

  window.confirmAction = (action, name, id) => {
    let message = '';
    if (action === 'deleteDocument') {
      message = `Are you sure you want to delete ${name}?`;
      actionFunction = () => deleteDocument(name, id);
    } else if (action === 'removeEmployee') {
      message = `Are you sure you want to remove ${name}?`;
      actionFunction = () => removeEmployee(id);
    }
    document.getElementById("modalText").innerText = message;
    modal.style.display = "block";
  };

  function deleteDocument(fileName, id) {
    const data = {
      filename: fileName,
      employee_id: id
    };

    fetch('/api/delete_document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showMessage(data.message, "success");
          const documentList = document.getElementById("documentList");
          const rowToDelete = documentList.querySelector(`tr[data-id="${fileName}"]`);
          if (rowToDelete) {
            rowToDelete.remove();
          }
        } else {
          showMessage(data.message || data.error, "error");
        }
      })
      .catch(error => {
        showMessage("An error occurred. Please try again later.", "error");
      });
  }

  function removeEmployee(id) {
    fetch("/api/remove", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id
      })
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showMessage("Employee successfully removed.", "success");
          setTimeout(() => {
            showEmployeeDetails();
          }, 0);
        } else {
          showMessage(data.error, "error");
        }
      })
      .catch(error => {
        showMessage("An error occurred. Please try again later.", "error");
      });
  }
});

function showEmployeeDetails() {
  document.getElementById("optionsSection").innerHTML = `
  <div class="editor">
    <h2>Employee Editor</h2>
    <hr>
    <form id="form1">
        <input type="hidden" id="action_type" name="action_type" value="employee">
        <input type="hidden" id="employee_id" name="employee_id">
        <div class="form-group">
            <label for="fullname">Full Name</label>
            <input type="text" id="fullname" name="fullname" class="form-control" required>
        </div>
        <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" name="username" class="form-control" required>
        </div>
        <div class="form-group">
            <label id="passwordlable" for="password">Default Password</label>
            <div class="input-group">
                <input type="password" id="password" name="new-password" class="form-control" required>
                <button type="button" class="primary1" onclick="changePassword()">Change</button>
            </div>
        </div>
        <div class="form-group">
            <label for="role">Role</label>
            <select name="role" id="role" class="form-control" required>
                <option value="">Select a role</option>
                <option value="admin">Admin</option>
                <option value="kitchen">Kitchen</option>
                <option value="waiter">Waiter</option>
            </select>
        </div>
        <div class="form-group">
            <label for="salary">Salary</label>
            <input type="number" id="salary" name="salary" class="form-control" step="1000" required>
        </div>
        <div class="form-group">
            <label for="image">Upload Image</label>
            <label class="custom-file-input">
                <input type="file" id="image" name="image" accept="image/*" required>
            </label>
            <label class="imagepreview" id="imagepreview" style="display: none;">Image Preview</label>
            <img class="preview" id="imagePreview" style="display: none; width: 100px; height: 100px;">
        </div>
        <div class="form-group">
            <label for="documents">Upload Documents</label>
            <input type="file" id="documents" name="documents[]" accept=".pdf,image/jpeg,image/png,.txt" multiple
                required>
        </div>
        <div class="group">
            <button id="update" type="submit" class="btn btn-primary">Add</button>
            <button onclick="clearForm2()" type="button" class="btn btn-danger">Reset</button>
        </div>
    </form>
</div>
<div id="display-table2" class="display-table">
    <h2>Employee Details</h2>
    <div class="table-container">
        <table class="table">
            <thead>
                <tr>
                    <th>Employee ID</th>
                    <th>Full Name</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Salary</th>
                    <th>Image</th>
                    <th>Documents</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="employee-details">
            </tbody>
        </table>
    </div>
</div>
`;

  fetch("/api/employees")
    .then((response) => response.json())
    .then((data) => {
      const employeeDetailsContainer = document.getElementById("employee-details");
      data.forEach((employee) => {
        const row = document.createElement("tr");
        row.setAttribute("data-id", employee.id);
        row.innerHTML = `
        <td>${employee.id}</td>
        <td class="employee-fullname">${employee.fullname}</td>
        <td class="employee-username">${employee.username}</td>
        <td class="employee-role">${employee.role}</td>
        <td class="employee-salary">${Number(employee.salary).toFixed(0)}<span class="salary-unit">/month</span></td>
        <td class="employee-image"><img src="data:image/jpeg;base64,${employee.image}" alt="${employee.fullname}"></td>
        <td class="employee-document">
        <img src="/static/images/Additional_images/documents.png"
             id="Document"
             alt="Documents"
             title="View Documents"
             onclick="openModal(this.getAttribute('data-documents'), ${employee.id})"
             data-documents='${JSON.stringify(employee.documents).replace(/'/g, "&apos;")}'    
             style="width: 50px; height: 50px;">
        </td>    
        <td>
          <button class="btn btn-warning" onclick="editEmployee(${employee.id})">Edit</button>
          <button class="btn btn-danger1" onclick="confirmAction('removeEmployee','${employee.fullname}','${employee.id}')">Remove</button>
        </td>
      `;
        employeeDetailsContainer.appendChild(row);
      });
    });

  document.getElementById("image").addEventListener("change", function (event) {
    const imagePreview = document.getElementById("imagePreview");
    const imagepreview = document.getElementById("imagepreview");
    var divelement1 = document.querySelector(".editor");
    var divelement2 = document.querySelector(".table-container");
    if (document.querySelector(".primary1").style.display === "block") {
      divelement1.style.height = "845px";
      divelement2.style.height = "790px";
    } else {
      divelement1.style.height = "800px";
      divelement2.style.height = "745px";
    }
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        imagePreview.src = e.target.result;
        imagePreview.style.display = "block";
        imagepreview.style.display = "block";
      };
      reader.readAsDataURL(file);
    } else {
      imagePreview.style.display = "none";
      imagePreview.src = "";
    }
  });

  document.getElementById("form1").onsubmit = function (event) {
    event.preventDefault();
    var password = document.getElementById("password").value;
    var username = document.getElementById("username").value;
    if (validateForm(password, username)) {
      const formData = new FormData(this);
      fetch("/api/edit", {
        method: "POST",
        enctype: "multipart/form-data",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          showMessage(data.message, data.success ? "success" : "error");
          if (data.success) {
            const usernameInput = document.getElementById("username");
            var username1 = usernameInput.value;
            if (data.message.includes("Sorry, the username '" + username1 + "' is already taken.")) {
              usernameInput.value = "";
            } else if (data.success) {
              showEmployeeDetails();
            }
          }
        })
        .catch((error) => {
          showMessage("An error occurred. Please try again later.", "error");
        });
    }
  };
}

function editEmployee(id) {
  clearForm2()
  const row = document.querySelector(`tr[data-id='${id}']`);
  if (row) {
    const item = {
      fullname: row.querySelector(".employee-fullname").textContent,
      username: row.querySelector(".employee-username").textContent,
      role: row.querySelector(".employee-role").textContent,
      salary: parseFloat(row.querySelector(".employee-salary").textContent.replace('/month', '')),
      image: row.querySelector(".employee-image img").src,
    };
    document.getElementById("employee_id").value = id;
    document.getElementById("fullname").value = item.fullname;
    document.getElementById("username").value = item.username;
    document.getElementById("role").value = item.role;
    document.getElementById("salary").value = item.salary;
    document.getElementById("password").disabled = true;
    document.querySelector(".primary1").style.display = "block";
    document.getElementById('passwordlable').textContent = "Change Password";
    document.getElementById('documents').removeAttribute('required');
    var divelement1 = document.querySelector(".editor");
    var divelement2 = document.querySelector(".table-container");
    divelement1.style.height = "845px";
    divelement2.style.height = "790px";
    const imagePreview = document.getElementById("imagePreview");
    const imagepreview = document.getElementById("imagepreview");
    imagePreview.src = item.image;
    imagepreview.style.display = "block";
    imagePreview.style.display = "block";
    document.getElementById("image").required = false;
    const update = document.getElementById("update");
    update.textContent = "Update";
  } else {
    console.error("Row not found for ID:", id);
  }
}

function openModal(documents_data, id) {
  const modal = document.getElementById('DocumentModal');
  const btn1 = document.getElementById("Close");
  const span = document.getElementById("Close1");
  const tableBody1 = document.getElementById("documentList");
  tableBody1.innerHTML = '';
  modal.style.display = "block";

  function closeModal() {
    modal.style.display = "none";
    showEmployeeDetails();
  }

  span.onclick = () => closeModal();
  window.onclick = (event) => {
    if (event.target == modal) closeModal();
  };
  btn1.onclick = () => closeModal();

  const docs = JSON.parse(documents_data.replace(/&apos;/g, "'"));

  docs.forEach((doc) => {
    const fileName = doc.document_name;
    const fileContent = doc.document_data;
    const fileType = getFileType(fileName);

    const row = document.createElement('tr');
    row.setAttribute("data-id", fileName);
    row.innerHTML = `
      <td>${fileName}</td>
      <td>
          <button class="view-button" onclick="viewDocument('${fileName}', '${fileContent}', '${fileType}')">View</button>
          <button class="download-button" onclick="downloadDocument('${fileName}', '${fileContent}', '${fileType}')">Download</button>
          <button class="delete-button" onclick="confirmAction('deleteDocument','${fileName}','${id}')">Delete</button>
      </td>
    `;
    tableBody1.appendChild(row);
  });
}

function getFileType(fileName) {
  const extension = fileName.split('.').pop().toLowerCase();
  switch (extension) {
    case 'pdf':
      return 'application/pdf';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'bmp':
      return `image/${extension}`;
    case 'txt':
      return 'text/plain';
    default:
      return 'application/octet-stream';
  }
}

function viewDocument(fileName, fileContent, fileType) {
  const dataUrl = `data:${fileType};base64,${fileContent}`;
  const newTab = window.open();
  newTab.document.write('<html><head><title>' + fileName + '</title></head><body style="margin: 0;">');
  newTab.document.write(`<embed src="${dataUrl}" style="object-fit: scale-down; width: 100%; height: 100%;" type="${fileType}" />`);
  newTab.document.write('</body></html>');
}

function downloadDocument(fileName, fileContent, fileType) {
  const dataUrl = `data:${fileType};base64,${fileContent}`;
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = fileName;
  anchor.click();
}

function changePassword() {
  var modal = document.getElementById("passwordModal");
  const span = document.getElementById("close");
  modal.style.display = "block";

  function closeModal() {
    modal.style.display = "none";
  }
  span.onclick = () => closeModal();
  window.onclick = function (event) {
    if (event.target == modal) {
      closeModal();
    }
  };

  document.getElementById("adminLoginForm").onsubmit = function (event) {
    event.preventDefault();
    var password = document.getElementById("adminPassword").value;
    var username = document.getElementById('adminUsername').value;

    if (validateForm(password, username)) {
      const formData = new FormData(this);
      fetch("/login", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.message) {
            showMessage(data.message, "success");
            closeModal();
            document.getElementById("password").disabled = false;
            document.getElementById("password").value = '';
            document.querySelector(".primary1").style.display = "none";
            var divelement1 = document.querySelector(".display-table");
            var divelement2 = document.querySelector(".editor");
            var divelement3 = document.querySelector(".table-container");
            divelement1.style.height = "";
            divelement2.style.height = "";
            divelement3.style.height = "655px";
          } else if (data.error === 'Non-admin login attempt detected. You are logged out.') {
            showMessage(data.error, "error");
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          } else {
            showMessage(data.error, "error");
          }
        })
        .catch((error) => {
          showMessage("An error occurred. Please try again later.", "error");
        });
    }
  };
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

function showCustomerDetails() {
  document.getElementById("optionsSection").innerHTML = `
<div class="customer-details-container">
<div class="flex-container">
  <div class="column1">
    <div class="customer-details">
      <h3>Customer Details</h3>
      <hr>
      <div class="table-container2">
        <table class="table2">
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Name</th>
              <th>Number</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="customerDetailsTable">
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <div class="column">
  <h3>Update Number</h3>
  <hr>
  <form id="updateNumberForm">
  <input type="hidden" id="action_type" name="action_type" value="Customer">
  <input type="hidden" id="customer_id" name="customer_id">
    <div class="form-group">
      <label for="customerName">Customer Name</label>
      <input type="text" class="customerName" id="customerName" name="customerName" placeholder="Enter customer name">
    </div>
    <div class="form-group">
      <label for="newNumber">New Number</label>
      <input type="number" id="newNumber" name="newNumber" placeholder="Enter new number" step="any">
    </div>
    <div class="group">
      <button type="submit" class="btn5 btn-primary">Update Number</button>
      <button type="button"class="btn5 btn-danger" onclick="clearForm3()">Reset</button>
    </div>
  </form>
</div>
</div>
<div class="column">
  <h3>Order Related</h3>
  <div class="table-container2">
    <table class="table2">
      <thead>
        <tr>
          <th>Order ID</th>
          <th>Order Date</th>
          <th>Total Price</th>
          <th>Total Quantity</th>
          <th>Table Number</th>
          <th>Special Instructions</th>
        </tr>
      </thead>
      <tbody id="orderRelatedTable">
      </tbody>
    </table>
  </div>
</div>
</div>
  `;

  fetch("/api/customer_details")
    .then((response) => response.json())
    .then((data) => {
      const customerDetailsTable = document.getElementById("customerDetailsTable");
      data.forEach((Details) => {
        const row = document.createElement("tr");
        row.setAttribute("data-id", Details.customer_id);
        row.innerHTML = `
                  <td>${Details.customer_id}</td>
                  <td class="customer-name">${Details.name}</td>
                  <td class="customer-number">${Details.phone_number}</td>
                  <td>
                    <button class="btn5 btn-warning" onclick="editCustomer('${Details.customer_id}')">Edit</button>
                    <button class="view-button1" onclick="viewOrders('${Details.customer_id}')">View Orders</button>
                  </td>
              `;
        customerDetailsTable.appendChild(row);
      });
    });

  document.getElementById("updateNumberForm").onsubmit = function (event) {
    event.preventDefault();

    const formData = new FormData(this);
    const customerId = formData.get("customer_id");

    if (!customerId) {
      showMessage("Customer ID is required to proceed with the update.", "error");
      return;
    }
    fetch("/api/edit", {
      method: "POST",
      enctype: "multipart/form-data",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        showMessage(data.message, data.success ? "success" : "error");
        if (data.success && !data.message.includes(`Sorry, the number '${formData.get("newNumber")}' is already in use. Please provide a different number.`)) {
          showCustomerDetails();
        }
      })
      .catch((error) => {
        showMessage("An error occurred. Please try again later.", "error");
      });
  };
}

function editCustomer(customerId) {
  clearForm3()
  const row = document.querySelector(`tr[data-id='${customerId}']`);
  if (row) {
    const details = {
      fullname: row.querySelector(".customer-name").textContent,
      number: row.querySelector(".customer-number").textContent,
    };
    document.getElementById("customer_id").value = customerId;
    document.getElementById("customerName").disabled = true;
    document.getElementById("customerName").value = details.fullname;
    document.getElementById("newNumber").value = details.number;
  } else {
    console.error("Row not found for ID:", id);
  }
}

function viewOrders(customerId) {
  if (isFetching) {
    showMessage("A request is already in progress. Please wait.", "error");
    return;
  }

  isFetching = true;

  const orderRelatedTable = document.getElementById("orderRelatedTable");

  fetch("/api/customerorders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ customerId })
  })
    .then((response) => response.json())
    .then((data) => {
      showMessage(data.message, data.success ? "success" : "error");
      if (data.success) {
        const orders = data.orders;
        orderRelatedTable.innerHTML = "";
        orders.forEach(order => {
          const row = document.createElement("tr");
          row.setAttribute("data-id", order.order_id);
          row.innerHTML = `
            <td>${order.order_id}</td>
            <td>${order.date}</td>
            <td>${order.price}</td>
            <td>${order.quantity}</td>
            <td>${order.table_number}</td>
            <td>${order.instructions}</td>
          `;
          orderRelatedTable.appendChild(row);
        });
      } else {
        orderRelatedTable.innerHTML = "";
      }
    })
    .catch((error) => {
      console.error('Error fetching orders:', error);
      showMessage('An error occurred while fetching orders.', 'error');
    })
    .finally(() => {
      isFetching = false; // Reset the flag once the request is complete
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

function clearForm1() {
  document.querySelector("form").reset();
  const imagePreview = document.getElementById("imagePreview");
  const imagepreview = document.getElementById("imagepreview");
  imagePreview.style.display = "none";
  imagepreview.style.display = "none";
  var divelement1 = document.querySelector(".display-table");
  var divelement2 = document.querySelector(".editor");
  var divelement3 = document.querySelector(".table-container");
  divelement1.style.height = "";
  divelement2.style.height = "";
  divelement3.style.height = "";
  const update = document.getElementById("update");
  update.textContent = "Add";
  document.getElementById("menu_item_id").value = "";
}

function clearForm2() {
  document.querySelector("form").reset();
  const imagePreview = document.getElementById("imagePreview");
  const imagepreview = document.getElementById("imagepreview");
  imagePreview.style.display = "none";
  imagepreview.style.display = "none";
  var divelement1 = document.querySelector(".display-table");
  var divelement2 = document.querySelector(".editor");
  var divelement3 = document.querySelector(".table-container");
  divelement1.style.height = "";
  divelement2.style.height = "";
  divelement3.style.height = "";
  const update = document.getElementById("update");
  update.textContent = "Add";
  document.querySelector(".primary1").style.display = "none";
  document.getElementById("password").disabled = false;
  document.getElementById('passwordlable').textContent = "Default Password";
  document.getElementById("employee_id").value = "";
}

function clearForm3() {
  document.querySelector("form").reset();
  document.getElementById("customer_id").value = "";
}

document.getElementById('logout').addEventListener('click', function () {
  fetch("/logout", {
    method: "POST"
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.message) {
        showMessage(data.message, "success");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      } else {
        showMessage('Logout failed. Please try again.', "error");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
});

function showFeedbackReviews() {
  const optionsSection = document.getElementById("optionsSection");
  optionsSection.innerHTML = `
  <div class="FeedbackReviews-container">
  <div class="column">
    <div class="customer-details">
      <h3>Feedback Details</h3>
      <hr>
      <table class="table2">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer ID</th>
            <th>Customer Name</th>
            <th>Customer Number</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="customerDetailsTable">
        </tbody>
      </table>
    </div>
  </div>
<div class="column" id="column" style="display:none;">
    <h3>Feedback</h3>
    <hr>
      <div class="rating-section">
        <p>Food Quality</p>
        <div class="star-rating" id="food-quality">
          <input type="radio" id="food-star5" name="food-quality" value="5">
          <label for="food-star5">5 stars</label>
          <input type="radio" id="food-star4" name="food-quality" value="4">
          <label for="food-star4">4 stars</label>
          <input type="radio" id="food-star3" name="food-quality" value="3">
          <label for="food-star3">3 stars</label>
          <input type="radio" id="food-star2" name="food-quality" value="2">
          <label for="food-star2">2 stars</label>
          <input type="radio" id="food-star1" name="food-quality" value="1">
          <label for="food-star1">1 star</label>
        </div>
      </div>
      <div class="rating-section">
        <p>Service</p>
        <div class="star-rating" id="service">
          <input type="radio" id="service-star5" name="service" value="5">
          <label for="service-star5">5 stars</label>
          <input type="radio" id="service-star4" name="service" value="4">
          <label for="service-star4">4 stars</label>
          <input type="radio" id="service-star3" name="service" value="3">
          <label for="service-star3">3 stars</label>
          <input type="radio" id="service-star2" name="service" value="2">
          <label for="service-star2">2 stars</label>
          <input type="radio" id="service-star1" name="service" value="1">
          <label for="service-star1">1 star</label>
        </div>
      </div>
      <div class="rating-section">
        <p>Ambience</p>
        <div class="star-rating" id="ambience">
          <input type="radio" id="ambience-star5" name="ambience" value="5">
          <label for="ambience-star5">5 stars</label>
          <input type="radio" id="ambience-star4" name="ambience" value="4">
          <label for="ambience-star4">4 stars</label>
          <input type="radio" id="ambience-star3" name="ambience" value="3">
          <label for="ambience-star3">3 stars</label>
          <input type="radio" id="ambience-star2" name="ambience" value="2">
          <label for="ambience-star2">2 stars</label>
          <input type="radio" id="ambience-star1" name="ambience" value="1">
          <label for="ambience-star1">1 star</label>
        </div>
      </div>
    <div class="sections">
      <textarea id="feedback-review"></textarea>
    </div>
    <div class ="columbtn">
          <button class="btn5 btn-danger" id="closes" onclick="closefeedback()">Close</button>
    </div>
  </div>
</div>
  `;

  fetch("/api/feedback")
    .then((response) => response.json())
    .then((data) => {
      const feedbackReviewsContainer = document.getElementById("customerDetailsTable");
      data.forEach((item) => {
        const row = document.createElement("tr");
        row.setAttribute("data-id", item.id);
        row.innerHTML = `
          <td class="order_id">${item.order_id}</td>
          <td class="customer_id">${item.customer_id}</td>
          <td class="name">${item.name}</td>
          <td class="phone_number">${item.phone_number}</td>
          <td class="created_at">${item.created_at}</td>
          <td>
            <button class="view-button1" onclick="viewFeedback('${item.id}')">View Feedback</button>    
          </td>
        `;
        feedbackReviewsContainer.appendChild(row);
      });
    });
}

function viewFeedback(feedbackID) {
  if (isFetching) {
    showMessage("A request is already in progress. Please wait.", "error");
    return;
  }

  isFetching = true;

  fetch("/api/customerfeedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ feedbackID })
  })
    .then((response) => response.json())
    .then((data) => {
      showMessage(data.message, data.success ? "success" : "error");
      if (data.success) {
        const feedback = data.feedbacks;
        document.getElementById('column').style.display = "block";
        document.getElementById(`food-star${feedback.food_quality}`).checked = true;
        document.getElementById(`service-star${feedback.service}`).checked = true;
        document.getElementById(`ambience-star${feedback.ambience}`).checked = true;
        document.getElementById('feedback-review').value = feedback.additional_feedback || "";
      }
    })
    .catch((error) => {
      console.error('Error fetching feedback:', error);
      showMessage('An error occurred while fetching feedback.', 'error');
    })
    .finally(() => {
      isFetching = false;
    });
}
function closefeedback() {
  document.getElementById("column").style.display = "none";
}