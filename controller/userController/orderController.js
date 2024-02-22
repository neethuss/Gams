const userCollection = require("../../models/userModel");
const cartCollection = require("../../models/cartModel");
const productCollection = require("../../models/productModel");
const orderCollection = require("../../models/orderModel");
const walletCollection = require("../../models/walletModel");
const Razorpay = require("razorpay");
const pdf = require("pdfkit-table");

//get method for order
const getOrder = async (req, res) => {
  try {
    if (req.session.user) {
      const userDetails = req.session.user;
      const user = await userCollection.findOne({ email: userDetails.email });
      const userId = user._id;
      const userAddress = user.userAddress
  
      const cartDetails = await cartCollection.findOne({ userId: userId });
      console.log(cartDetails);
      

      let productDetails = [];
      let productPromises = cartDetails.products.map(async (val) => {
        const product = await productCollection.findById(val.product);
        const newStock = product.product_stock - val.quantity;

        
        const updatedStock = Math.max(0, newStock);

        await productCollection.updateOne(
          { _id: val.product },
          { $set: { product_stock: updatedStock } }
        );
        const price = product.product_price;
        const totalPrice = price * val.quantity;
        return {
          product: val.product,
          quantity: val.quantity,
          totalPrice: totalPrice,
        };
      });

      Promise.all(productPromises)
        .then(async (results) => {
          productDetails = results;
          let detail = productDetails;

          // Remove purchased products from the cart
          await cartCollection.updateOne(
            { userId: userId },
            {
              $pull: {
                products: {
                  product: { $in: cartDetails.products.map((p) => p.product) },
                },
              },
            }
          );

          // Insert order
          await orderCollection.insertMany([
            {
              userId: userId,
              products: detail,
              shippingAddress: userAddress,
              paymentMethod: req.params.pay,
              orderDate: Date.now(),
              discountAmount: req.query.discountAmount,
              payTotal: req.query.totalPrice,
            },
          ]);

          if (req.query.couponId && req.query.couponId !== undefined) {
            await userCollection.findByIdAndUpdate(userId, {
              $push: { appliedCoupons: req.query.couponId }
            });
          }

          res.redirect("/orderConfirmed"); 
        })
        .catch((err) => {
          console.error(err);
          res.status(500).send("Internal Server Error");
        });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};


//get method for rendering order confirmed page
const getOrderConfirmed = async (req, res) => {
  try {
    if (req.session.user) {
      const order = await orderCollection.findOne({userId:req.session.user._id}).sort({ orderDate: -1 }) 
      .limit(1)
      res.render("userViews/orderConfirmed",{order});
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while rendering order confirmation page");
  }
};


//get method for getting all orders for a particular user
const getMyOrders = async (req, res) => {
  try {
    if (req.session.user) {
      const user = req.session.user;
      const userId = user._id;

      const page = parseInt(req.query.page) || 1;
      const perPage = 5;

      const totalOrders = await orderCollection.countDocuments({ userId: userId.toString() });
      const totalPages = Math.ceil(totalOrders / perPage);

      const skip = (page - 1) * perPage;

      const orders = await orderCollection
        .find({ userId: userId.toString() })
        .populate("products.product")
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(perPage);

        const cart = await cartCollection.findOne({userId:req.session.user._id})
        const cartQuantity = cart.products.length

      res.render("userViews/myOrders", { orders, page, totalPages,cartQuantity });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while rendering my order page");
  }
};




//post method for candel order
const cancelOrder = async (req, res) => {
  try {
    if (req.session.user) {
      const user = req.session.user;
      const order = await orderCollection.findById(req.body.id);
      await orderCollection.findByIdAndUpdate(req.body.id, {
        $set: { status: "Cancelled" },
      });
      const userId = user._id;

      const totalPrice = order.payTotal
    if(order.paymentMethod != 'COD'){
      await walletCollection.findOneAndUpdate(
        { userId: userId },
        { $inc: { walletAmount: totalPrice } },
        { new: true, upsert: true }
      );
      await walletCollection.findOneAndUpdate(
        { userId: userId },
        {
          $push: {
            walletHistory: {
              process: "refund for cancelled order",
              amount: totalPrice,
              date: Date.now(),
            },
          },
        },
        { new: true }
      );
      
    }
      
      res.json({ message: "yes" });
    }
  } catch (error) {
    console.log(error.message);
  }
};


//post method for returning order
const returnOrder = async (req, res) => {
  try {
    if (req.session.user) {
      const user = req.session.user;
      const order = await orderCollection.findById(req.body.id);
      await orderCollection.findByIdAndUpdate(req.body.id, {
        $set: { status: "Returning" },
      });
      const userId = user._id;

      const totalPrice = order.payTotal
      await walletCollection.findOneAndUpdate(
        { userId: userId },
        { $inc: { walletAmount: totalPrice } },
        { new: true, upsert: true }
      );
      await walletCollection.findOneAndUpdate(
        { userId: userId },
        {
          $push: {
            walletHistory: {
              process: "refund for return order",
              amount: totalPrice,
              date: Date.now(),
            },
          },
        },
        { new: true }
      );
      const wallet = await walletCollection.findOne({ userId: userId });
      console.log(wallet);
      res.json({ message: "yes" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while returning order");
  }
};


//get method for invoice download
const getInvoiceDownload = async (req, res) => {
  try {
    const order = await orderCollection
      .findOne({ _id: req.query.id })
      .populate("products.product")
      .populate("shippingAddress");
    
    const doc = new pdf({ margin: 50 });

    doc.fontSize(18).text("TAX INVOICE", { align: "center" });

    doc.moveDown();
    doc.lineCap("butt").moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    doc.moveDown();
    doc.fontSize(16).text("Order Details", { underline: true });

    doc.text(`OrderId: ${order._id}`)

    

    // Table for Products
    const productsTable = {
      title: "Products",
      headers: ["Product Name", "Quantity", "Total Price"],
      rows: [],
    };


    order.products.forEach((product, index) => {
      productsTable.rows.push([
        product.product.product_name,
        product.quantity,
        product.totalPrice,
      ]);
    });

    await doc.table(productsTable);
    

    doc.text(`Discount Amount: ${order.discountAmount}`)
    doc.text(`Amount paid: ${order.payTotal}`)
    doc.text(
      `Shipping Address: ${order.shippingAddress.name}, ${order.shippingAddress.address}, ${order.shippingAddress.pincode}, ${order.shippingAddress.district}, ${order.shippingAddress.state}, ${order.shippingAddress.country}, ${order.shippingAddress.phone}`
    );

    doc.moveDown();
    doc.lineCap("butt").moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    doc.moveDown();
    doc
      .fontSize(14)
      .text("Thank you for shopping with us!", { align: "center" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Invoice_${order._id}.pdf`
    );

    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while invoice download");
  }
};



//post method for razorpay payment
const postRazorpay = async (req, res) => {
  try {
    let total = req.body.totalPrice;
    let instance = new Razorpay({
      key_id: process.env.RAZORPAY_ID_KEY,
      key_secret: process.env.RAZORPAY_SECRET_KEY,
    });
    let options = {
      amount: Number(total) * 100,
      currency: "INR",
      receipt: "receipt#",
      notes: {
        key1: "value3",
        key2: "value2",
      },
    };
    instance.orders.create(options, function (err, order) {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Error creating order", details: err });
        return;
      }
      res.status(200).json({ orderId: order.id });
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Error while creating Razorpay payment", details: error });
  }
};

//post method for payment through wwallet
const postWalletPayment = async (req, res) => {
  try {
    if (req.session.user) {
      const user = req.session.user;
      const userId = user._id;
      const totalAmount = req.body.totalPrice;
      console.log(totalAmount, "heeeeee");

      const wallet = await walletCollection.findOne({ userId: userId });
      if (!wallet) {
        return res.status(404).send({ message: "Wallet not found." });
      }
      let walletAmount = wallet.walletAmount;

      console.log(walletAmount, "waaaaa");

      if (walletAmount >= totalAmount) {
        await walletCollection.findOneAndUpdate(
          { userId: userId },
          { $inc: { walletAmount: -totalAmount } },
          { new: true, upsert: true }
        );

        await walletCollection.findOneAndUpdate(
          { userId: userId },
          {
            $push: {
              walletHistory: {
                process: "debited for wallet payment",
                amount: totalAmount,
                date: Date.now(),
              },
            },
          },
          { new: true }
        );
        
        return res.status(200).send({ message: "Sufficient balance." });
      } else {
       
        return res.status(400).send({ message: "Insufficient balance." });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Error while processing wallet payment");
  }
};


//get method for rendering order detail page
const getOrderDetail = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await orderCollection
      .findById(orderId)
      .populate({
        path: 'products.product',
        populate: {
          path: 'product_category',
          model: 'category'
        }
      })
      .populate('shippingAddress');

      const cart = await cartCollection.findOne({userId:req.session.user._id})
      const cartQuantity = cart.products.length
    res.render('userViews/orderDetails', { order ,cartQuantity});
  } catch (error) {
    console.log(error);
    res.status(500).send('Error while rendering order detail page');
  }
};


module.exports = {
  getOrder,
  getOrderConfirmed,
  getMyOrders,
  cancelOrder,
  returnOrder,
  getInvoiceDownload,
  postRazorpay,
  postWalletPayment,
  getOrderDetail
};
