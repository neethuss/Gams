const orderCollection = require("../../models/orderModel");

//get method for rendering order management page
const getOrederManagement = async (req, res) => {
  try {
    const successMsg = req.flash("success");
    const errorMsg = req.flash("error");
    const perPage = 5;
    const page = parseInt(req.query.page) || 1;

    const orderDetails = await orderCollection
      .find()
      .populate("userId")
      .populate({
        path: "products.product",
        model: "product",
      })
      .populate("shippingAddress")
      .sort({ orderDate: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    const totalOrders = await orderCollection.countDocuments();
    const totalPages = Math.ceil(totalOrders / perPage);

    res.render("adminViews/orderManagement", {
      orders: orderDetails,
      page,
      totalPages,
      successMsg,
      errorMsg,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while rendering order management page");
  }
};

//get method for changing order staus
const getUpdateOrderStatus = async (req, res) => {
  const orderId = req.params.orderId;
  const newStatus = req.params.newStatus;
  try {
    const order = await orderCollection.findById(orderId);

    if (order.status === "Cancelled") {
      req.flash("error", "Order already cancelled");
      return res.redirect("/admin/orderManagement");
    }

    const updatedOrder = await orderCollection.findByIdAndUpdate(
      orderId,
      { $set: { status: newStatus } },
      { new: true }
    );

    req.flash("success", `Order status updated to ${newStatus}`);
    res.redirect("/admin/orderManagement");
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).send("Internal Server Error");
  }
};

//get method for rendering a particular order detail
const getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await orderCollection
      .findById(orderId)
      .populate({
        path: "products.product",
        populate: {
          path: "product_category",
          model: "category",
        },
      })
      .populate("shippingAddress");

    res.render("adminViews/orderDetails", { order });
  } catch (error) {}
};

module.exports = {
  getOrederManagement,
  getUpdateOrderStatus,
  getOrderDetails,
};
