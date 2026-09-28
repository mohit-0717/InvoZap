function generateInvoice() {

    let customer = document.getElementById("customer").value;
    let email = document.getElementById("email").value;
    let product = document.getElementById("product").value;
    let quantity = document.getElementById("quantity").value;
    let price = document.getElementById("price").value;
    let gst = document.getElementById("gst").value;


    // Simple validation

    if (customer == "" || email == "" || product == "" || price == "") {

        alert("Please fill all the fields.");

        return;
    }


    // Calculate subtotal

    let subtotal = quantity * price;


    // Calculate GST

    let gstAmount = subtotal * gst / 100;


    // Calculate total

    let total = subtotal + gstAmount;


    // Display invoice

    document.getElementById("result").innerHTML =

        "<h3>Invoice Generated Successfully!</h3>" +

        "<p><b>Customer:</b> " + customer + "</p>" +

        "<p><b>Email:</b> " + email + "</p>" +

        "<p><b>Product:</b> " + product + "</p>" +

        "<p><b>Quantity:</b> " + quantity + "</p>" +

        "<p><b>Price:</b> ₹" + price + "</p>" +

        "<p><b>Subtotal:</b> ₹" + subtotal + "</p>" +

        "<p><b>GST:</b> ₹" + gstAmount + "</p>" +

        "<h3>Total: ₹" + total + "</h3>";
}