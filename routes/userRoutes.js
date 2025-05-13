const express = require('express');
const router = express.Router();

// Controllers
const userController = require('../controller/userController/userController');
const otpController = require('../controller/userController/otpController');
const shopController = require('../controller/userController/shopController');
const wishlistController = require('../controller/userController/wishlistController');
const cartController = require('../controller/userController/cartController');
const checkoutController = require('../controller/userController/checkoutController');
const profileController = require('../controller/userController/profileController');
const orderController = require('../controller/userController/orderController');

const authentication = require('../middleware/userAuth').isBlocked;

router.get('/', userController.getHome);
router.get('/login', userController.getLogin);
router.post('/login', userController.postLogin);
router.get('/forgotPassword', userController.getForgotPassword);
router.post('/forgotPassword', userController.postForgotPassword);
router.get('/forgotPasswordOtp', otpController.getForgotPasswordOtp);
router.post('/forgotPasswordOtp', otpController.postForgotPasswordOtp);
router.get('/resendOtp', userController.getResendOtp);
router.get('/resendSignupOtp', userController.getResendSignupOtp);
router.get('/newPassword', userController.getNewPassword);
router.post('/newPassword', userController.postNewPassword);
router.get('/signup', userController.getSignup);
router.post('/signup', userController.postSignup);
router.get('/signupOtp', otpController.getSignupOtp);
router.post('/signupOtp', otpController.postSignupOtp);


router.get('/shop', authentication, shopController.getShop);
router.get('/searchProduct', authentication, shopController.getSearchProduct);
router.get('/filterByCategory', authentication, shopController.getFilterByCategory);
router.get('/sortByPrice', authentication, shopController.getSortByPrice);
router.get('/product/:proId', authentication, shopController.getProduct);


router.route('/wishlist')
  .get(authentication, wishlistController.getWishlist)
  .post(authentication, wishlistController.postWishlist);
router.get('/wishlist/remove/:id', authentication, wishlistController.getRemoveWishlist);


router.route('/cart')
  .get(authentication, cartController.getCart)
  .post(authentication, cartController.postCart);
router.post('/updateCart', authentication, cartController.updateCart);
router.get('/removeCart/:id/:quantity', authentication, cartController.removeCart);


router.post('/couponApply', authentication, checkoutController.postCouponApply);
router.get('/checkout', authentication, checkoutController.getCheckout);


router.post('/razorpay', authentication, orderController.postRazorpay);
router.post('/walletPayment', authentication, orderController.postWalletPayment);
router.get('/order/:pay', authentication, orderController.getOrder);
router.get('/orderConfirmed', authentication, orderController.getOrderConfirmed);
router.get('/myOrders', authentication, orderController.getMyOrders);
router.post('/cancelOrder', authentication, orderController.cancelOrder);
router.post('/returnOrder', authentication, orderController.returnOrder);
router.get('/invoiceDownload', authentication, orderController.getInvoiceDownload);
router.get('/orderDetails/:id', authentication, orderController.getOrderDetail);


router.get('/profile', authentication, profileController.getProfile);
router.route('/editProfile/:id')
  .get(authentication, profileController.getEditProfile)
  .post(authentication, profileController.postEditProfile);
router.route('/addAddress')
  .get(authentication, profileController.getAddAddress)
  .post(authentication, profileController.postAddAddress);
router.post('/defaultAddress', authentication, profileController.postSetDefaultAddress);
router.route('/editAddress/:addressId')
  .get(authentication, profileController.getEditAddress)
  .post(authentication, profileController.postEditAddress);
router.get('/deleteAddress/:addressId', authentication, profileController.getDeleteAddress);


router.get('/wallet', authentication, profileController.getWallet);
router.get('/walletHistory', authentication, profileController.getWalletHistory);


router.get('/referalLogout', authentication, userController.getReferalLogout);
router.get('/logout', authentication, userController.getLogout);

module.exports = router;
