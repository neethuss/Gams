const couponCollection = require("../../models/couponModel");

//get method for rendering coupon management page
const getCouponManagement = async (req, res) => {
  try {
    if (req.session.admin) {
      const perPage = 5;
      const page = parseInt(req.query.page) || 1; 

      const successMsg = req.flash("success");

      const totalCoupons = await couponCollection.countDocuments();
      const totalPages = Math.ceil(totalCoupons / perPage);

      const skip = (page - 1) * perPage;

      const coupons = await couponCollection.find().skip(skip).limit(perPage);

      res.render("adminViews/couponManagement", { coupons, page, totalPages, successMsg });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while rendering coupon management");
  }
};


//get method for rendering add coupon page
const getAddCoupon = async (req, res) => {
  try {
    res.render("adminViews/addCoupon");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while rendering add coupon");
  }
};


//post method for add coupon
const postAddCoupon = async (req, res) => {
  try {
    const couponCode = req.body.couponCode;
    const check = await couponCollection.findOne({
      couponCode: { $regex: new RegExp("^" + couponCode + "$", "i") },
    });

    if (check) {
      return (
        res.render("adminViews/addCoupon"), { msg: "Coupon already exists" }
      );
    } else {
      const couponData = {
        couponName: req.body.couponName,
        couponCode: req.body.couponCode,
        discountAmount: req.body.discountAmount,
        minimumPurchaseAmount: req.body.minimumPurchaseAmount,
        expiryDate: req.body.expiryDate,
      };

      await couponCollection.insertMany([couponData]);

      req.flash("success", "Coupon added");
      res.redirect("/admin/couponManagement");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while post add coupon");
  }
};


//get method for edit coupon
const getEditCoupon = async (req, res) => {
  try {
    if (req.session.admin) {
      const couponId = req.params.id;
      const coupon = await couponCollection.findById(couponId);

      res.render("adminViews/editCoupon", { coupon });
    } else {
      res.render("adminViews/login");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while rendering edit coupon page");
  }
};


//post method for edit category
const postEditCoupon = async (req, res) => {
  try {
    
    if (req.session.admin) {
      const couponId = req.params.id;
    console.log(req.body,'hahdfj');
      const couponCode = req.body.couponCode;

     

      const check = await couponCollection.findOne({
        couponCode:  couponCode ,
        _id: { $ne: couponId }, 
      });

      if (check) {
        return res.redirect("/admin/editCoupon", {
          msg: "Coupon already exists",
        });
      } else {
        await couponCollection.findByIdAndUpdate(
          couponId,
          {
            couponName: req.body.couponName,
            couponCode: req.body.couponCode,
            discountAmount: req.body.discountAmount,
            minimumPurchaseAmount: req.body.minimumPurchaseAmount,
            expiryDate: req.body.expiryDate,
          },
          { new: true }
        );
        req.flash("success", "Coupon details edited");
        res.redirect("/admin/couponManagement");
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while post edit coupon");
  }
};


//get method for unlist a coupon
const getBlockCoupon = async (req, res) => {
  try {
    const couponId = req.query.id
    const coupon = await couponCollection.findOne({
      _id: couponId
    });
    if (coupon) {
      const block = coupon.unlist;

      if (block) {
        await couponCollection.findByIdAndUpdate(
          couponId,
          { $set: { unlist:false } }
        );
      } else {
        await couponCollection.findByIdAndUpdate(
          couponId,
          { $set: { unlist: true } }
        );
      }
    }

    res.redirect("/admin/couponManagement");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error occured");
  }
};


module.exports = {
  getCouponManagement,
  getAddCoupon,
  postAddCoupon,
  getEditCoupon,
  postEditCoupon,
  getBlockCoupon
};
