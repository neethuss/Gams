const cartCollection = require("../../models/cartModel");
const userCollection = require("../../models/userModel");
const addressCollection = require("../../models/addressModel");
const couponCollection = require("../../models/couponModel");

//get method for checkout page
const getCheckout = async (req, res) => {
  try {
    req.session.addressOrigin = "checkout";
    const user = req.session.user;
    const userId = user._id;

    let currentDate = new Date();

    const coupons = await couponCollection.find({
      expiryDate: { $gt: currentDate },unlist:true
    });

    const address = await userCollection
      .findOne({ _id: userId })
      .populate("userAddress");
    const cart = await cartCollection
      .findOne({ userId: userId })
      .populate("products.product");

    const cartQuantity = cart.products.length;

    const addresses = await addressCollection.find({ userId: userId });
    res.render("userViews/checkout", {
      address: address.userAddress,
      user,
      cart,
      addresses,
      coupons,
      cartQuantity,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while rendering checkout page");
  }
};

//pos method for post coupon apply
const postCouponApply = async (req, res) => {
  try {
    const userSe = req.session.user;
    const userId = userSe._id;

    const couponCode = req.body.couponCode;
    const cartTotal = req.body.cartTotal;

    const coupon = await couponCollection.findOne({ couponCode: couponCode });

    if (!coupon) {
      const discountAmount = 0;
      const total = cartTotal - discountAmount;

      return res.json({
        message: "Coupon not found",
        showToast: true,
        discountAmount: discountAmount.toFixed(2),
        total: total.toFixed(2),
      });
    }

    const couponId = coupon._id;
    const user = await userCollection.findById(userId);

    const userHasAppliedCoupon = user.appliedCoupons.includes(couponId);

    if (userHasAppliedCoupon) {
      const discountAmount = 0;
      const total = cartTotal - discountAmount;
      return res.json({
        message: "Coupon already applied",
        showToast: true,
        discountAmount: discountAmount.toFixed(2),
        total: total.toFixed(2),
      });
    }

    if (coupon.minimumPurchaseAmount > cartTotal) {
      const discountAmount = 0;
      const total = cartTotal - discountAmount;
      return res.json({
        message: "Cannot apply the coupon for this amount",
        showToast: true,
        discountAmount: discountAmount.toFixed(2),
        total: total.toFixed(2),
      });
    } else {
      const discountAmount = coupon.discountAmount;

      const total = cartTotal - discountAmount;

      res.json({
        discountAmount: discountAmount.toFixed(2),
        total: total.toFixed(2),
        couponId: couponId,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while post coupon apply");
  }
};

module.exports = {
  getCheckout,
  postCouponApply,
};
