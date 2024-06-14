import base64
import json
import os
import random
import bcrypt
import mysql.connector
import logging
import time
import subprocess
from datetime import datetime, timedelta, date
from mysql.connector import Error
from logging.handlers import RotatingFileHandler
from flask import (
    Flask,
    jsonify,
    make_response,
    render_template,
    request,
    url_for,
)
from flask_login import (
    LoginManager,
    UserMixin,
    login_user,
    login_required,
    logout_user,
    current_user,
)

app = Flask(__name__)
app.secret_key = os.urandom(24)
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=1)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"


def connect_to_database():
    try:
        return mysql.connector.connect(
            host="localhost",
            user="root",
            password="1234",
            database="restaurant_database",
        )
    except Error as e:
        print("Error connecting to MySQL database:", e)
        exit(1)


db = connect_to_database()

log_file_path = "C:/Users/Buddy/Documents/Vs/Projects/Order management system/log.txt"
if not os.path.exists(log_file_path):
    open(log_file_path, "a").close()
handler = RotatingFileHandler(log_file_path, maxBytes=1048576, backupCount=2)
formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
handler.setFormatter(formatter)
app.logger.addHandler(handler)
app.logger.setLevel(logging.INFO)
handler.close()


class User(UserMixin):
    def __init__(self, id):
        self.id = id


@login_manager.user_loader
def load_user(user_id):
    try:
        cursor = db.cursor()
        cursor.execute("SELECT id, role FROM employees WHERE id = %s", (user_id,))
        user_data = cursor.fetchone()
        cursor.close()

        if user_data:
            return User(user_data)
    except Error as e:
        app.logger.error("Error loading user from the database: %s", e)
    return None


# Login Logout and Authentication routes
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        action_type = request.form.get("action_type")

        if action_type == "authentication":
            admin_username = request.form.get("adminUsername")
            new_password = request.form.get("new-password")

            if not admin_username or not new_password:
                return (
                    jsonify({"error": "Admin username and new password required."}),
                    400,
                )

            try:
                with db.cursor() as cursor:
                    cursor.execute(
                        "SELECT id, role, password FROM employees WHERE username = %s",
                        (admin_username,),
                    )
                    user_data = cursor.fetchone()

                if user_data:
                    user_id, user_role, stored_password = user_data
                    if bcrypt.checkpw(
                        new_password.encode("utf-8"), stored_password.encode("utf-8")
                    ):
                        if user_role == "admin":
                            app.logger.info(
                                "Admin login authenticated for password update/change. User ID: %s",
                                user_id,
                            )
                            return jsonify(
                                {
                                    "message": "Admin login authenticated. You can now change the password."
                                }
                            )
                        else:
                            app.logger.warning(
                                "Non-admin login attempt by user: %s", user_id
                            )
                            logout_user()
                            return (
                                jsonify(
                                    {
                                        "error": "Non-admin login attempt detected. You are logged out."
                                    }
                                ),
                                403,
                            )
                    else:
                        app.logger.warning(
                            "Failed login attempt: Invalid admin credentials."
                        )
                        return (
                            jsonify({"error": "Invalid admin username or password."}),
                            401,
                        )
                else:
                    app.logger.warning(
                        "Failed login attempt: Admin user does not exist. Username - %s",
                        admin_username,
                    )
                    return (
                        jsonify({"error": "Invalid admin username or password."}),
                        401,
                    )
            except Error as e:
                app.logger.error("Error during admin login attempt: %s", e)
                return jsonify({"error": "An error occurred during login."}), 500

        else:
            username = request.form.get("username")
            password = request.form.get("password")

            if not username or not password:
                return jsonify({"error": "Username and password required."}), 400

            try:
                with db.cursor() as cursor:
                    cursor.execute(
                        "SELECT id, role, password FROM employees WHERE username = %s",
                        (username,),
                    )
                    user_data = cursor.fetchone()

                if user_data:
                    user_id, user_role, stored_password = user_data
                    if bcrypt.checkpw(
                        password.encode("utf-8"), stored_password.encode("utf-8")
                    ):
                        user = User(user_id)
                        login_user(user)
                        app.logger.info(
                            "Successful login attempt: User ID - %s", user_id
                        )
                        return jsonify(
                            {
                                "redirect_url": get_redirect_url(user_role),
                                "message": "Login Successful",
                            }
                        )
                    else:
                        app.logger.warning(
                            "Failed login attempt: Incorrect password. User ID - %s",
                            user_id,
                        )
                        return jsonify({"error": "Invalid username or password."}), 401
                else:
                    app.logger.warning(
                        "Failed login attempt: User does not exist. Username - %s",
                        username,
                    )
                    return jsonify({"error": "Invalid username or password."}), 401
            except Error as e:
                app.logger.error("Error during login attempt: %s", e)
                return jsonify({"error": "An error occurred during login."}), 500

    return render_template("Additional_pages/Login.html")


def get_redirect_url(role):
    if role == "admin":
        return url_for("dashboard")
    elif role == "kitchen":
        return url_for("orderflow")
    elif role == "waiter":
        return url_for("pos")
    else:
        return "/"


@app.route("/logout", methods=["POST"])
@login_required
def logout():
    app.logger.info("Successful logout: User ID - %s", current_user.id[0])
    logout_user()
    return jsonify({"message": "Logout successfully"}), 200


@app.route("/auth", methods=["POST"])
def auth():
    cursor = db.cursor()
    Phonenumer = request.form.get("number")
    password = request.form.get("new-password")

    if "login" in request.form:
        cursor.execute("SELECT * FROM customer WHERE phone_number = %s", (Phonenumer,))
        user = cursor.fetchone()

        if user:
            if bcrypt.checkpw(password.encode("utf-8"), user[3].encode("utf-8")):
                response = make_response(
                    jsonify({"success": True, "message": "Sign-in successful!"}), 201
                )
                response.set_cookie("user_id", str(user[0]))
                return response
            else:
                return jsonify({"error": True, "message": "Invalid password"}), 401
        else:
            return (
                jsonify(
                    {"message": "Looks like you are not registered. Please register."}
                ),
                404,
            )

    elif "register" in request.form:
        name = request.form.get("name")

        cursor.execute(
            "SELECT customer_id FROM customer WHERE phone_number = %s", (Phonenumer,)
        )
        existing_customer_id = cursor.fetchone()

        if existing_customer_id:
            return (
                jsonify(
                    {
                        "message": "This phone number is already registered. Please use a different number or log in."
                    }
                ),
                400,
            )
        else:
            hashed_password = bcrypt.hashpw(
                password.encode("utf-8"), bcrypt.gensalt()
            ).decode("utf-8")
            customer_id = "{:04}".format(random.randint(0, 9999))
            cursor.execute(
                "INSERT INTO customer (customer_id, name, phone_number, password) VALUES (%s, %s, %s, %s)",
                (customer_id, name, Phonenumer, hashed_password),
            )
            db.commit()

            response = make_response(
                jsonify({"success": True, "message": "Registration successful!"}), 201
            )
            response.set_cookie("user_id", customer_id)
            return response
    cursor.close()
    return jsonify({"error": "Invalid request."}), 400


# Menu and Chekout Routes
@app.route("/")
def menu():
    cursor = db.cursor()
    cursor.execute(
        "SELECT c.category_id, c.name, c.image, m.menu_item_id, m.name, m.image, m.price, m.is_veg, m.is_hidden FROM categories c JOIN menu_items m ON c.category_id = m.category_id"
    )
    menu_data = cursor.fetchall()
    cursor.close()

    categories = {}
    for category_id, category_name, category_image, *_ in menu_data:
        if category_id not in categories:
            categories[category_id] = {"name": category_name, "image": category_image}

    menu_items = []
    for (
        category_id,
        category_name,
        _,
        menu_item_id,
        menu_name,
        menu_image,
        price,
        is_veg,
        is_hidden,
    ) in menu_data:
        if not is_hidden:
            category = categories[category_id]
            is_veg_bool = bool(is_veg)
            menu_items.append(
                {
                    "category_id": category_id,
                    "category_name": category["name"],
                    "category_image": (
                        base64.b64encode(category["image"]).decode("utf-8")
                        if category_image is not None
                        else None
                    ),
                    "menu_item_id": menu_item_id,
                    "menu_name": menu_name,
                    "menu_image": (
                        base64.b64encode(menu_image).decode("utf-8")
                        if menu_image is not None
                        else None
                    ),
                    "price": price,
                    "is_veg": is_veg_bool,
                }
            )
    return render_template("menu.html", menu_items=menu_items)


@app.route("/checkout", methods=["POST"])
def checkout():
    order_data = request.json
    order_id = order_data.get("orderId")
    items = order_data.get("cartItems")
    total_quantity = order_data.get("totalQuantity")
    table_number = order_data.get("tableNumber")
    total_price = order_data.get("total")
    special_instructions = order_data.get("specialInstructions")
    customer_id = order_data.get("customer_id")

    try:
        cursor = db.cursor()

        order_insert_query = """
        INSERT INTO orders (order_id, order_date, total_price, total_quantity, table_number, customer_id, special_instructions)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        order_insert_values = (
            order_id,
            datetime.now(),
            total_price,
            total_quantity,
            table_number,
            customer_id,
            special_instructions,
        )
        cursor.execute(order_insert_query, order_insert_values)

        item_insert_query = "INSERT INTO order_items (order_id, item_name, item_id, item_quantity) VALUES (%s, %s, %s, %s)"
        item_insert_values = [
            (order_id, item["itemName"], item["itemId"], item["itemQuantity"])
            for item in items
        ]
        cursor.executemany(item_insert_query, item_insert_values)

        db.commit()
        cursor.close()
        return "Checkout successfully.", 200
    except mysql.connector.Error as err:
        app.logger.error("MySQL Error: %s", err)
        db.rollback()
        return "An error occurred while processing the checkout.", 500


@app.route("/order_details/<order_id>")
def order_details(order_id):
    try:
        with db.cursor(dictionary=True) as cursor:
            cursor.execute(
                """
                SELECT 
                    o.order_id, o.order_date, o.total_price, o.total_quantity, o.table_number, o.special_instructions,
                    oi.item_name, oi.item_quantity, oi.status, mi.image, mi.price, f.id,p.payment_method
                FROM orders o
                LEFT JOIN order_items oi ON o.order_id = oi.order_id
                LEFT JOIN payments p ON o.order_id = p.order_id
                LEFT JOIN feedback f ON o.order_id = f.order_id
                LEFT JOIN menu_items mi ON oi.item_id = mi.menu_item_id
                WHERE o.order_id = %s
                """,
                (order_id,),
            )
            rows = cursor.fetchall()

            if not rows:
                return jsonify({"message": "Order ID not found"}), 404

            order = {
                "order_id": rows[0]["order_id"],
                "order_date": rows[0]["order_date"],
                "total_price": rows[0]["total_price"],
                "total_quantity": rows[0]["total_quantity"],
                "table_number": rows[0]["table_number"],
                "special_instructions": rows[0]["special_instructions"],
                "feedback": rows[0]["id"],
                "payment": rows[0]["payment_method"],
            }

            items = [
                {
                    "item_name": row["item_name"],
                    "item_quantity": row["item_quantity"],
                    "status": row["status"],
                    "item_image": base64.b64encode(row["image"]).decode("utf-8")
                    if row["image"]
                    else None,
                    "price": row["price"],
                }
                for row in rows
                if row["item_name"]
            ]

            return render_template(
                "Additional_pages/Order_details.html", order=order, items=items
            )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/submit-feedback", methods=["POST"])
def submit_feedback():
    data = request.get_json()
    customer_id = data.get("customerId")
    order_id = data.get("orderId")
    food_quality = data.get("foodQuality")
    service = data.get("service")
    ambience = data.get("ambience")
    additional_feedback = data.get("additionalFeedback")

    try:
        cursor = db.cursor()
        cursor.execute(
            "SELECT * FROM orders WHERE order_id = %s AND customer_id = %s",
            (order_id, customer_id),
        )
        order = cursor.fetchone()

        if not order:
            return (
                jsonify(
                    {"success": False, "message": "Invalid order ID or customer ID."}
                ),
                400,
            )

        insert_feedback_query = """
            INSERT INTO feedback (order_id, customer_id, food_quality, service, ambience, additional_feedback) 
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        cursor.execute(
            insert_feedback_query,
            (
                order_id,
                customer_id,
                food_quality,
                service,
                ambience,
                additional_feedback,
            ),
        )
        db.commit()

        return jsonify({"success": True, "message": "Feedback submitted successfully."})

    except mysql.connector.Error as err:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "An error occurred. Please try again later.",
                    "error": f"{err}",
                }
            ),
            500,
        )
    finally:
        cursor.close()


@app.route("/payment")
def payment():
    return render_template("Additional_pages/Payment.html")


@app.route("/api/payment", methods=["POST"])
def process_payment():
    try:
        data = request.json
        userId = data.get("userId")
        total_amount = data.get("totalAmount")
        table_number = data.get("tableNumber")
        order_id = data.get("orderId")
        payment_method = data.get("paymentMethod")

        cursor = db.cursor()
        insert_order_query = """INSERT INTO payments (total_amount, table_number, order_id, payment_method,customer_id) 
                                VALUES (%s, %s, %s, %s,%s)"""
        cursor.execute(
            insert_order_query, (total_amount, table_number, order_id, payment_method,userId)
        )
        db.commit()

        if payment_method == "online":
            return jsonify(
                {
                    "redirect_url": url_for("payment"),
                    "message": "Redirecting you to the payment page. Please wait...",
                }
            )
        elif payment_method == "waiter":
            return (
                jsonify(
                    {
                        "message": "Thank you for your order. Your payment will be collected by our waiter shortly."
                    }
                ),
                200,
            )
        else:
            return jsonify({"error": "Invalid payment method"}), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Dashboard and api routes
@app.route("/dashboard")
@login_required
def dashboard():
    if current_user.id[1] != "admin":
        app.logger.warning(
            "Access Denied: User ID - %s attempted to access Dashboard",
            current_user.id[0],
        )
        return render_template("Additional_pages/AccessDenied.html"), 400
    return render_template("Dashboard.html")


@app.route("/api/sales")
@login_required
def show_sales():
    if current_user.id[1] != "admin":
        app.logger.warning(
            "Access Denied: User ID - %s attempted to access Show Sales API",
            current_user.id[0],
        )
        return render_template("Additional_pages/AccessDenied.html"), 400

    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM payments")
    sales_data = cursor.fetchall()

    cursor.execute(
        """
        SELECT oi.order_id, oi.item_name, mi.price AS item_price, mi.category_id
        FROM order_items oi
        INNER JOIN menu_items mi ON oi.item_id = mi.menu_item_id
    """
    )
    order_items_data = cursor.fetchall()

    cursor.execute("SELECT * FROM categories")
    categories_data = cursor.fetchall()

    cursor.close()

    category_id_to_name = {
        category["category_id"]: category["name"] for category in categories_data
    }

    today = datetime.now().date()
    today_sales = sum(
        order["total_amount"]
        for order in sales_data
        if order["payment_datetime"].date() == today
    )
    start_of_week = today - timedelta(days=today.weekday())
    this_week_sales = sum(
        order["total_amount"]
        for order in sales_data
        if start_of_week <= order["payment_datetime"].date() <= today
    )
    this_month_sales = sum(
        order["total_amount"]
        for order in sales_data
        if order["payment_datetime"].date().month == today.month
    )
    num_transactions = sum(
        1 for order in sales_data if order["payment_datetime"].date() == today
    )
    avg_transaction_value = (
        sum(
            order["total_amount"]
            for order in sales_data
            if order["payment_datetime"].date() == today
        )
        / num_transactions
        if num_transactions > 0
        else 0
    )

    payment_methods_online = 0
    payment_methods_waiter = 0
    total_amount_online = 0
    total_amount_waiter = 0
    unique_customers_today = set()

    for sale in sales_data:
        payment_date = sale["payment_datetime"].date()
        if payment_date == today:
            payment_method = sale["payment_method"]
            if payment_method == "online":
                payment_methods_online += 1
                total_amount_online += sale["total_amount"]
            elif payment_method == "waiter":
                payment_methods_waiter += 1
                total_amount_waiter += sale["total_amount"]

            unique_customers_today.add(sale["order_id"])

    category_sales_today = {category["name"]: 0 for category in categories_data}
    item_sales_today = {}

    today_order_items = [
        order_item
        for order_item in order_items_data
        if order_item["order_id"] in unique_customers_today
    ]

    for order_item in today_order_items:
        category_id = order_item["category_id"]
        category_name = category_id_to_name.get(category_id)
        if category_name:
            category_sales_today[category_name] += order_item["item_price"]

        item_name = order_item["item_name"]
        if item_name not in item_sales_today:
            item_sales_today[item_name] = 0
        item_sales_today[item_name] += order_item["item_price"]

    top_selling_items_today = sorted(
        item_sales_today.items(), key=lambda x: x[1], reverse=True
    )[:3]
    low_selling_items_today = sorted(item_sales_today.items(), key=lambda x: x[1])[:3]

    sales_json = {
        "num_transactions": num_transactions,
        "avg_transaction_value": avg_transaction_value,
        "total_sales": today_sales,
        "this_week_sales": this_week_sales,
        "this_month_sales": this_month_sales,
        "transactions_by_payment_method_online": payment_methods_online,
        "transactions_by_payment_method_waiter": payment_methods_waiter,
        "total_amount_waiter": total_amount_waiter,
        "total_amount_online": total_amount_online,
        "unique_customers_today": len(unique_customers_today),
        "sales_by_category_today": category_sales_today,
        "top_selling_items_today": top_selling_items_today,
        "low_selling_items_today": low_selling_items_today,
    }

    return jsonify(sales_json)


@app.route("/api/menu_items", methods=["GET"])
@login_required
def get_menu_items():
    if current_user.id[1] != "admin":
        app.logger.warning(
            "Access Denied: User ID - %s attempted to access Menu Items API",
            current_user.id[0],
        )
        return render_template("Additional_pages/AccessDenied.html"), 400

    cursor = db.cursor()
    cursor.execute(
        "SELECT menu_item_id, name, category_id, price, is_veg, image, is_hidden FROM menu_items"
    )
    menu_items = cursor.fetchall()
    cursor.close()

    menu_items_data = [
        {
            "menu_item_id": item[0],
            "name": item[1],
            "category_id": item[2],
            "price": item[3],
            "is_veg": item[4],
            "image": (
                base64.b64encode(item[5]).decode("utf-8")
                if item[5] is not None
                else None
            ),
            "is_hidden": item[6],
        }
        for item in menu_items
    ]
    return jsonify(menu_items_data)


@app.route("/api/hide_item", methods=["POST"])
@login_required
def hide_item():
    if current_user.id[1] != "admin":
        app.logger.warning(
            "Access Denied: User ID - %s attempted to access Hide Item API",
            current_user.id[0],
        )
        return render_template("Additional_pages/AccessDenied.html")

    data = request.get_json()
    item_id = data.get("id")

    if not item_id:
        return jsonify({"success": False, "error": "No ID provided"})

    try:
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT * FROM menu_items WHERE menu_item_id = %s", (item_id,))
        item = cursor.fetchone()

        if item:
            is_hidden = not item["is_hidden"]
            cursor.execute(
                "UPDATE menu_items SET is_hidden = %s WHERE menu_item_id = %s",
                (is_hidden, item_id),
            )
            db.commit()
            return jsonify({"success": True})
        else:
            return jsonify({"success": False, "error": "Item not found"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})
    finally:
        cursor.close()


@app.route("/api/employees", methods=["GET"])
@login_required
def get_employees():
    if current_user.id[1] != "admin":
        app.logger.warning(
            "Access Denied: User ID - %s attempted to access Employees API",
            current_user.id,
        )
        return render_template("Additional_pages/AccessDenied.html"), 400

    cursor = db.cursor()
    cursor.execute(
        "SELECT id, fullname, username, role, salary, image, document_name, document_data FROM employees"
    )
    employees = cursor.fetchall()
    cursor.close()

    employee_data = []
    for employee in employees:
        documents = []
        document_names = json.loads(employee[6]) if employee[6] else []
        document_contents = json.loads(employee[7]) if employee[7] else []

        for name, content in zip(document_names, document_contents):
            documents.append({"document_name": name, "document_data": content})

        employee_info = {
            "id": employee[0],
            "fullname": employee[1],
            "username": employee[2],
            "role": employee[3],
            "salary": employee[4],
            "image": (
                base64.b64encode(employee[5]).decode("utf-8") if employee[5] else None
            ),
            "documents": documents,
        }
        employee_data.append(employee_info)

    return jsonify(employee_data)


@app.route("/api/remove", methods=["POST"])
@login_required
def remove():
    if current_user.id[1] != "admin":
        app.logger.warning(
            "Access Denied: User ID - %s attempted to access Remove API. Current User: %s",
            current_user.id[0],
            current_user,
        )
        return render_template("Additional_pages/AccessDenied.html")

    data = request.get_json()
    id = data.get("id")

    if not id:
        return jsonify({"success": False, "error": "No ID provided"})

    try:
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT * FROM employees WHERE id = %s", (id,))
        item = cursor.fetchone()

        if item:
            cursor.execute("DELETE FROM employees WHERE id = %s", (id,))
            db.commit()
            app.logger.info(
                "Employee removed successfully: ID - %s. Deletion requested by User ID: %s",
                id,
                current_user.id[0],
            )
            return jsonify({"success": True})
        else:
            return jsonify({"success": False, "error": "Employee not found"})
    except Exception as e:
        app.logger.error(
            "Error occurred during removal: %s. Deletion requested by User ID: %s",
            str(e),
            current_user.id[0],
        )
        return jsonify({"success": False, "error": str(e)})
    finally:
        cursor.close()


@app.route("/api/delete_document", methods=["POST"])
@login_required
def delete():
    if current_user.id[1] != "admin":
        app.logger.warning(
            "Access Denied: User ID - %s attempted to access Delete API. Current User: %s",
            current_user.id,
            current_user,
        )
        return render_template("Additional_pages/AccessDenied.html")

    data = request.get_json()
    filename = data.get("filename")
    employee_id = data.get("employee_id")

    if not filename or not employee_id:
        return jsonify(
            {"success": False, "error": "No file name or employee ID provided"}
        )

    cursor = db.cursor()
    try:
        sql = "SELECT document_name, document_data FROM employees WHERE id = %s"
        cursor.execute(sql, (employee_id,))
        row = cursor.fetchone()

        if row:
            document_names_json = row[0]
            document_contents_json = row[1]

            document_names = json.loads(document_names_json)
            document_contents_base64 = json.loads(document_contents_json)

            try:
                index = document_names.index(filename)
            except ValueError:
                index = -1

            if index != -1:
                del document_names[index]
                del document_contents_base64[index]

                updated_document_contents_base64 = [
                    base64.b64encode(base64.b64decode(content)).decode("utf-8")
                    for content in document_contents_base64
                ]

                updated_document_names_json = json.dumps(document_names)
                updated_document_contents_json = json.dumps(
                    updated_document_contents_base64
                )

                sql_update = "UPDATE employees SET document_name = %s, document_data = %s WHERE id = %s"
                cursor.execute(
                    sql_update,
                    (
                        updated_document_names_json,
                        updated_document_contents_json,
                        employee_id,
                    ),
                )
                db.commit()
                app.logger.info(
                    "Document '%s' deleted successfully for employee ID - %s. Deletion requested by User ID: %s",
                    filename,
                    employee_id,
                    current_user.id[0],
                )
                return jsonify(
                    {
                        "success": True,
                        "message": f"Document '{filename}' deleted successfully.",
                    }
                )
            else:
                return jsonify(
                    {"success": False, "message": f"Document '{filename}' not found."}
                )
        else:
            return jsonify({"success": False, "message": "Employee not found."})

    except Exception as e:
        db.rollback()
        app.logger.error(
            "Error occurred during document deletion: %s. Deletion requested by User ID: %s",
            str(e),
            current_user.id[0],
        )
        return jsonify({"success": False, "error": str(e)})

    finally:
        cursor.close()


@app.route("/api/customer_details", methods=["GET"])
@login_required
def get_customer():
    if current_user.id[1] != "admin":
        app.logger.warning(
            "Access Denied: User ID - %s attempted to access Employees API",
            current_user.id,
        )
        return render_template("Additional_pages/AccessDenied.html"), 400

    cursor = db.cursor()
    cursor.execute("SELECT customer_id, name, phone_number FROM customer")
    customers = cursor.fetchall()
    cursor.close()

    customers_data = []
    for customer in customers:

        customer_info = {
            "customer_id": customer[0],
            "name": customer[1],
            "phone_number": customer[2],
        }
        customers_data.append(customer_info)

    return jsonify(customers_data)


@app.route("/api/customerorders", methods=["POST"])
@login_required
def get_customerorders():
    if current_user.id[1] != "admin":
        app.logger.warning(
            "Access Denied: User ID - %s attempted to access Orders API",
            current_user.id,
        )
        return render_template("Additional_pages/AccessDenied.html"), 403

    data = request.get_json()
    customer_id = data.get("customerId")

    if not customer_id:
        return jsonify({"success": False, "message": "No customer ID provided"}), 400

    try:
        cursor = db.cursor(dictionary=True)

        cursor.execute("SELECT * FROM customer WHERE customer_id = %s", (customer_id,))
        customer = cursor.fetchone()

        if not customer:
            return jsonify({"success": False, "message": "Customer not found"}), 404

        cursor.execute("SELECT * FROM orders WHERE customer_id = %s", (customer_id,))
        orders = cursor.fetchall()

        if not orders:
            return (
                jsonify(
                    {"success": False, "message": "No orders found for this customer"}
                ),
                404,
            )

        orders_data = []
        for order in orders:
            formatted_date = order["order_date"].strftime("%a, %d %b %Y %H:%M:%S")
            order_info = {
                "order_id": order["order_id"],
                "date": formatted_date,
                "price": order["total_price"],
                "quantity": order["total_quantity"],
                "table_number": order["table_number"],
                "instructions": order["special_instructions"],
            }
            orders_data.append(order_info)

        return (
            jsonify(
                {
                    "success": True,
                    "orders": orders_data,
                    "message": "Orders retrieved successfully",
                }
            ),
            200,
        )

    except Exception as e:
        app.logger.error(
            "Error occurred while fetching orders: %s. Requested by User ID: %s",
            str(e),
            current_user.id,
        )
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        cursor.close()


@app.route("/api/edit", methods=["POST"])
@login_required
def submit():
    if current_user.id[1] != "admin":
        app.logger.warning(
            "Access Denied: User ID - %s attempted to access Edit API",
            current_user.id[0],
        )
        return render_template("Additional_pages/AccessDenied.html")

    action_type = request.form.get("action_type")
    cursor = db.cursor()

    try:
        if action_type == "menu_item":
            menu_item_id = request.form.get("menu_item_id")
            category = request.form.get("category")
            name = request.form.get("name")
            price = request.form.get("price")
            image = request.files.get("image")
            veg_nonveg = request.form.get("veg_nonveg")

            cursor.execute(
                "SELECT menu_item_id FROM menu_items WHERE menu_item_id = %s",
                (menu_item_id,),
            )
            existing_item = cursor.fetchone()

            if existing_item:
                cursor.execute(
                    "SELECT menu_item_id FROM menu_items WHERE name = %s AND menu_item_id != %s",
                    (name, menu_item_id),
                )
                existing_dish = cursor.fetchone()

                if existing_dish:
                    message = f"Sorry, the dish '{name}' is already in the menu."
                else:
                    update_query = "UPDATE menu_items SET category_id = %s, name = %s, price = %s, is_veg = %s"
                    params = [category, name, price, veg_nonveg]

                    if image:
                        image_data = image.read()
                        update_query += ", image = %s"
                        params.append(image_data)

                    update_query += " WHERE menu_item_id = %s"
                    params.append(menu_item_id)
                    cursor.execute(update_query, params)
                    message = "Menu item updated successfully"
            else:
                cursor.execute("SELECT name FROM menu_items WHERE name = %s", (name,))
                existing_dish = cursor.fetchone()

                if existing_dish:
                    message = f"Sorry, the dish '{name}' is already in the menu."
                else:
                    insert_query = "INSERT INTO menu_items (category_id, name, price, image, is_veg) VALUES (%s, %s, %s, %s, %s)"
                    image_data = image.read() if image else None
                    params = [category, name, price, image_data, veg_nonveg]
                    cursor.execute(insert_query, params)
                    message = "Menu item added successfully"

        elif action_type == "employee":
            employee_id = request.form.get("employee_id")
            full_name = request.form.get("fullname")
            username = request.form.get("username")
            password = request.form.get("new-password")
            role = request.form.get("role")
            salary = request.form.get("salary")
            image = request.files.get("image")
            files = request.files.getlist("documents[]")
            documents = []
            for file in files:
                filename = file.filename
                content = file.read()
                documents.append((filename, content))
            document_names = [doc[0] for doc in documents]
            document_contents = [doc[1] for doc in documents]
            document_contents_base64 = [
                base64.b64encode(content).decode("utf-8")
                for content in document_contents
            ]
            document_names_json = json.dumps(document_names)
            document_contents_json = json.dumps(document_contents_base64)
            hashed_password = (
                bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode(
                    "utf-8"
                )
                if password
                else None
            )

            if employee_id:

                cursor.execute(
                    "SELECT id, username FROM employees WHERE id = %s", (employee_id,)
                )
                employee = cursor.fetchone()
                if employee:
                    current_username = employee[1]

                    if username != current_username:
                        cursor.execute(
                            "SELECT id FROM employees WHERE username = %s", (username,)
                        )
                        existing_username = cursor.fetchone()

                        if existing_username:
                            message = f"Sorry, the username '{username}' is already taken. Please choose a different username."
                        else:
                            update_query = "UPDATE employees SET fullname = %s, username = %s, role = %s, salary = %s"
                            params = [full_name, username, role, salary]

                            if image:
                                image_data = image.read()
                                update_query += ", image = %s"
                                params.append(image_data)
                            if hashed_password:
                                update_query += ", password = %s"
                                params.append(hashed_password)

                            cursor.execute(
                                "SELECT document_name, document_data FROM employees WHERE id = %s",
                                (employee_id,),
                            )
                            existing_document_info = cursor.fetchone()
                            (
                                existing_document_names_json,
                                existing_document_contents_json,
                            ) = (
                                existing_document_info
                                if existing_document_info
                                else (None, None)
                            )

                            if any(documents) and documents[0] != ("", b""):
                                document_names_json = (
                                    existing_document_names_json
                                    if existing_document_names_json
                                    else "[]"
                                )
                                document_contents_json = (
                                    existing_document_contents_json
                                    if existing_document_contents_json
                                    else "[]"
                                )

                                new_document_names = json.loads(document_names_json) + [
                                    doc[0] for doc in documents
                                ]
                                new_document_contents = json.loads(
                                    document_contents_json
                                ) + [
                                    base64.b64encode(doc[1]).decode("utf-8")
                                    for doc in documents
                                ]
                                combined_document_names_json = json.dumps(
                                    new_document_names
                                )
                                combined_document_contents_json = json.dumps(
                                    new_document_contents
                                )

                                update_query += (
                                    ", document_name = %s, document_data = %s"
                                )
                                params.extend(
                                    (
                                        combined_document_names_json,
                                        combined_document_contents_json,
                                    )
                                )
                            else:
                                update_query += (
                                    ", document_name = %s, document_data = %s"
                                )
                                params.extend(
                                    (
                                        existing_document_names_json,
                                        existing_document_contents_json,
                                    )
                                )

                            update_query += " WHERE id = %s"
                            params.append(employee_id)
                            cursor.execute(update_query, params)
                            message = "Employee updated successfully."
                    else:
                        update_query = (
                            "UPDATE employees SET fullname = %s, role = %s, salary = %s"
                        )
                        params = [full_name, role, salary]

                        if image:
                            image_data = image.read()
                            update_query += ", image = %s"
                            params.append(image_data)
                        if hashed_password:
                            update_query += ", password = %s"
                            params.append(hashed_password)

                        cursor.execute(
                            "SELECT document_name, document_data FROM employees WHERE id = %s",
                            (employee_id,),
                        )
                        existing_document_info = cursor.fetchone()
                        (
                            existing_document_names_json,
                            existing_document_contents_json,
                        ) = (
                            existing_document_info
                            if existing_document_info
                            else (None, None)
                        )

                        if any(documents) and documents[0] != ("", b""):
                            document_names_json = (
                                existing_document_names_json
                                if existing_document_names_json
                                else "[]"
                            )
                            document_contents_json = (
                                existing_document_contents_json
                                if existing_document_contents_json
                                else "[]"
                            )

                            new_document_names = json.loads(document_names_json) + [
                                doc[0] for doc in documents
                            ]
                            new_document_contents = json.loads(
                                document_contents_json
                            ) + [
                                base64.b64encode(doc[1]).decode("utf-8")
                                for doc in documents
                            ]
                            combined_document_names_json = json.dumps(
                                new_document_names
                            )
                            combined_document_contents_json = json.dumps(
                                new_document_contents
                            )

                            update_query += ", document_name = %s, document_data = %s"
                            params.extend(
                                (
                                    combined_document_names_json,
                                    combined_document_contents_json,
                                )
                            )
                        else:
                            update_query += ", document_name = %s, document_data = %s"
                            params.extend(
                                (
                                    existing_document_names_json,
                                    existing_document_contents_json,
                                )
                            )

                        update_query += " WHERE id = %s"
                        params.append(employee_id)
                        cursor.execute(update_query, params)
                        message = "Employee updated successfully."
            else:
                cursor.execute(
                    "SELECT id FROM employees WHERE username = %s", (username,)
                )
                existing_username = cursor.fetchone()

                if existing_username:
                    message = f"Sorry, the username '{username}' is already taken. Please choose a different username."
                else:
                    employee_id = random.randint(1000, 9999)
                    insert_query = "INSERT INTO employees (id, fullname, username, password, role, salary, image,document_name, document_data) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)"
                    image_data = image.read() if image else None
                    params = [
                        employee_id,
                        full_name,
                        username,
                        hashed_password,
                        role,
                        salary,
                        image_data,
                        document_names_json,
                        document_contents_json,
                    ]
                    cursor.execute(insert_query, params)
                    message = "Employee added successfully"

        elif action_type == "Customer":
            customer_id = request.form.get("customer_id")
            newNumber = request.form.get("newNumber")

            if customer_id:

                cursor.execute(
                    "SELECT customer_id FROM customer WHERE phone_number = %s",
                    (newNumber,),
                )
                existing_number = cursor.fetchone()

                if existing_number:
                    message = f"Sorry, the number '{newNumber}' is already in use. Please provide a different number."
                else:
                    update_query = (
                        "UPDATE customer SET phone_number = %s WHERE customer_id = %s"
                    )
                    params = [newNumber, customer_id]
                    cursor.execute(update_query, params)
                    message = "The customer's number has been successfully updated."

        db.commit()
        return jsonify({"success": True, "message": message})

    except Exception as e:
        app.logger.error("Database operation failed: %s", str(e))
        return jsonify(
            {
                "success": False,
                "message": "An error occurred. Please try again later.",
                "error": str(e),
            }
        )

    finally:
        cursor.close()


@app.route("/api/feedback")
@login_required
def feedback_review():
    if current_user.id[1] != "admin":
        app.logger.warning(
            "Access Denied: User ID - %s attempted to access Feedback Review API",
            current_user.id[0],
        )
        return render_template("Additional_pages/AccessDenied.html"), 400

    cursor = db.cursor()
    cursor.execute(
        """
        SELECT feedback.id, feedback.order_id, feedback.created_at,feedback.customer_id, customer.name, customer.phone_number 
        FROM feedback 
        JOIN customer ON feedback.customer_id = customer.customer_id
    """
    )
    feedback_review_data = cursor.fetchall()
    cursor.close()

    feedback_list = []
    for feedback in feedback_review_data:
        formatted_date = feedback[2].strftime("%a, %d %b %Y")
        feedback_info = {
            "id": feedback[0],
            "order_id": feedback[1],
            "created_at": formatted_date,
            "customer_id": feedback[3],
            "name": feedback[4],
            "phone_number": feedback[5],
        }
        feedback_list.append(feedback_info)

    return jsonify(feedback_list)


@app.route("/api/customerfeedback", methods=["POST"])
@login_required
def get_feedback():
    if current_user.id[1] != "admin":
        app.logger.warning(
            "Access Denied: User ID - %s attempted to access Feedback API",
            current_user.id,
        )
        return render_template("Additional_pages/AccessDenied.html"), 403

    data = request.get_json()
    id = data.get("feedbackID")

    if not id:
        return jsonify({"success": False, "message": "No Feedback ID provided"}), 400

    try:
        with db.cursor(dictionary=True) as cursor:
            cursor.execute(
                "SELECT food_quality, service, ambience, additional_feedback FROM feedback WHERE id = %s",
                (id,),
            )
            customerfeedback = cursor.fetchone()

        if not customerfeedback:
            return (
                jsonify({"success": False, "message": "Customer Feedback not found"}),
                404,
            )

        return (
            jsonify(
                {
                    "success": True,
                    "feedbacks": customerfeedback,
                    "message": "Feedbacks retrieved successfully",
                }
            ),
            200,
        )

    except Exception as e:
        app.logger.error(
            "Error occurred while fetching Feedback: %s. Requested by User ID: %s",
            str(e),
            current_user.id,
        )
        return (
            jsonify(
                {
                    "success": False,
                    "message": "An error occurred. Please try again later.",
                    "error": str(e),
                }
            ),
            500,
        )


# Orderflow and api routes
@app.route("/orderflow")
@login_required
def orderflow():
    if current_user.id[1] not in ["admin", "kitchen"]:
        app.logger.warning(
            "Access Denied: User ID - %s attempted to access OrderFlow",
            current_user.id[0],
        )
        return render_template("Additional_pages/AccessDenied.html"), 400
    return render_template("OrderFlow.html"), 200


@app.route("/api/orders", methods=["GET"])
@login_required
def get_orders():
    if current_user.id[1] not in ["admin", "kitchen"]:
        app.logger.warning(
            "Access Denied: User ID - %s attempted to access Orders API",
            current_user.id[0],
        )
        return render_template("Additional_pages/AccessDenied.html"), 400

    today_date = date.today()
    cursor = db.cursor()
    cursor.execute(
        """SELECT o.order_id, o.order_date, oi.item_quantity, o.special_instructions, oi.status,
                      oi.item_name, oi.new_id FROM orders o JOIN order_items oi ON o.order_id = oi.order_id
        WHERE DATE(o.order_date) = %s""",
        (today_date,),
    )
    orders = cursor.fetchall()
    cursor.close()

    grouped_orders = {}
    for order in orders:
        order_id = order[0]
        if order_id not in grouped_orders:
            grouped_orders[order_id] = {
                "order_id": order_id,
                "order_date": order[1].strftime("%I:%M %p"),
                "special_instructions": order[3],
                "order_items": [],
            }
        if order[4] != "Served":
            grouped_orders[order_id]["order_items"].append(
                {
                    "item_quantity": order[2],
                    "status": order[4],
                    "item_name": order[5],
                    "new_id": order[6],
                }
            )

    orders_data = list(grouped_orders.values())

    return jsonify(orders_data)


@app.route("/api/updatestatus", methods=["POST"])
@login_required
def update_status():
    if current_user.id[1] not in ["admin", "kitchen"]:
        app.logger.warning(
            "Access Denied: User ID - %s attempted to access OrderFlow",
            current_user.id[0],
        )
        return jsonify({"message": "Access Denied"}), 403

    item_status = request.form.get("item-status")
    new_status = request.form.get("status")

    cursor = db.cursor()
    cursor.execute(
        "UPDATE order_items SET status = %s WHERE new_id = %s",
        (new_status, item_status),
    )
    db.commit()
    cursor.close()

    return jsonify({"message": "Status updated successfully"}), 200


# Pos and api routes
@app.route("/pos")
@login_required
def pos():
    if current_user.id[1] not in ["admin", "waiter"]:
        app.logger.warning(
            "Access Denied: User ID - %s attempted to access POS", current_user.id[0]
        )
        return render_template("Additional_pages/AccessDenied.html"), 400
    return render_template("POS.html"), 200


@app.route("/api/servereadyoders")
@login_required
def get_readyorders():
    if current_user.id[1] not in ["admin", "waiter"]:
        app.logger.warning(
            "Access Denied: User ID - %s attempted to access Serve Ready Oders API",
            current_user.id[0],
        )
        return render_template("Additional_pages/AccessDenied.html"), 400

    today_date = date.today()
    cursor = db.cursor()
    cursor.execute(
        """SELECT o.order_id, c.name, o.table_number, o.total_price
        FROM orders o 
        JOIN customer c ON o.customer_id = c.customer_id
        WHERE DATE(o.order_date) = %s""",
        (today_date,),
    )
    orders = cursor.fetchall()

    orders_data = {}
    for order in orders:
        order_id = order[0]
        if order_id not in orders_data:
            orders_data[order_id] = {
                "orderID": order_id,
                "customerName": order[1],
                "tableNumber": order[2],
                "amount": order[3],
                "items": [],
            }

        cursor.execute(
            """SELECT oi.item_quantity, oi.item_name ,oi.new_id
            FROM order_items oi
            WHERE oi.order_id = %s AND oi.status = 'Complete'""",
            (order_id,),
        )
        items = cursor.fetchall()
        for item in items:
            orders_data[order_id]["items"].append(
                {"quantity": item[0], "itemName": item[1], "itemID": item[2]}
            )

    cursor.close()

    return jsonify(list(orders_data.values())), 200


@app.route("/api/markitemserved", methods=["POST"])
@login_required
def mark_item_served():
    if current_user.id[1] not in ["admin", "waiter"]:
        app.logger.warning(
            "Access Denied: User ID - %s attempted to access Mark Item Served API",
            current_user.id[0],
        )
        return render_template("Additional_pages/AccessDenied.html"), 400

    data = request.json
    orderID = data.get("orderID")
    itemID = data.get("itemID")

    cursor = db.cursor()
    cursor.execute(
        "UPDATE order_items SET status = %s WHERE new_id = %s AND order_id = %s",
        ("Served", itemID, orderID),
    )
    db.commit()
    cursor.close()

    return jsonify({"success": True, "message": "Status updated successfully"}), 200


@app.route("/api/paymentdetails")
@login_required
def get_completed_payments():
    if current_user.id[1] not in ["admin", "waiter"]:
        app.logger.warning(
            "Access Denied: User ID - %s attempted to access Payments Details API",
            current_user.id[0],
        )
        return render_template("Additional_pages/AccessDenied.html"), 400

    today_date = date.today()
    cursor = db.cursor()
    cursor.execute(
    """SELECT p.order_id, c.name, p.table_number, p.total_amount
    FROM payments p 
    JOIN customer c ON p.customer_id = c.customer_id
    WHERE DATE(p.payment_datetime) = %s AND p.payment_status = 'pending' AND p.payment_method = 'waiter'""",
    (today_date,),
    )
    payments = cursor.fetchall()

    payments_data = []
    for payment in payments:
        payment_info = {
            "orderID": payment[0],
            "customerName": payment[1],
            "tableNumber": payment[2],
            "amount": payment[3],
        }
        payments_data.append(payment_info)

    cursor.close()

    return jsonify(payments_data), 200

@app.route('/api/update_payment', methods=['POST'])
def update_payment():
    if current_user.id[1] not in ["admin", "waiter"]:
        app.logger.warning(
            "Access Denied: User ID - %s attempted to access Update Payment API",
            current_user.id[0],
        )
        return render_template("Additional_pages/AccessDenied.html"), 400
    
    payment_data = request.json
    orderID = payment_data.get("orderID")
    payment_status = payment_data.get('payment_status')
    payment_method = payment_data.get('payment_method')

    print(orderID,payment_status,payment_method)

    cursor = db.cursor()
    cursor.execute("UPDATE payments SET payment_status = %s,method = %s,employee_id = %s WHERE order_id = %s",
            (payment_status, payment_method,current_user.id[0],orderID),
    )
    db.commit()
    cursor.close()

    return jsonify({'message': 'Payment status updated successfully.'}), 200

if __name__ == "__main__":
    try:
        app.run()
    except KeyboardInterrupt:
        pass 