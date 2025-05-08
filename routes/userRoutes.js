const express = require('express')
const router = express.Router()

const userController = require('../controller/userController/userController')
const otpcontroller = require('../controller/userController/otpController')
const shopController = require('../controller/userController/shopController')
const wishlistController = require('../controller/userController/wishlistController')
const cartController = require('../controller/userController/cartController')
const checkoutcontroller = require('../controller/userController/checkoutController')
const profileController = require('../controller/userController/profileController')
const orderController = require('../controller/userController/orderController')

const userBlockMiddleware = require('../middleware/userAuth')
const userSessionMiddleware = require('../middleware/userSession')

router.get('/',userBlockMiddleware.isBlocked,userController.getHome)

router.get('/login',userController.getLogin)
router.post('/login',userController.postLogin)
router.get('/forgotPassword',userController.getForgotPassword)
router.post('/forgotPassword',userController.postForgotPassword)
router.get('/forgotPasswordOtp',otpcontroller.getForgotPasswordOtp)
router.post('/forgotPasswordOtp',otpcontroller.postForgotPasswordOtp)

router.get('/resendOtp',userController.getResendOtp)

router.get('/newPassword',userController.getNewPassword)
router.post('/newPassword',userController.postNewPassword)

router.get('/signup',userController.getSignup)
router.post('/signup',userController.postSignup)

router.get('/signupOtp',otpcontroller.getSignupOtp)
router.post('/signupOtp',otpcontroller.postSignupOtp)


router.get('/shop',userSessionMiddleware.isUser,userBlockMiddleware.isBlocked,shopController.getShop)

router.get('/searchProduct',userSessionMiddleware.isUser,userBlockMiddleware.isBlocked,shopController.getSearchProduct)
router.get('/filterByCategory',userSessionMiddleware.isUser,userBlockMiddleware.isBlocked,shopController.getFilterByCategory)
router.get('/sortByPrice',userSessionMiddleware.isUser,userBlockMiddleware.isBlocked,shopController.getSortByPrice)

router.get('/product/:proId',userSessionMiddleware.isUser,userSessionMiddleware.isUser,userBlockMiddleware.isBlocked,shopController.getProduct)

router.get('/wishlist',userSessionMiddleware.isUser,userBlockMiddleware.isBlocked,wishlistController.getWishlist)
router.post('/wishlist',userBlockMiddleware.isBlocked,wishlistController.postWishlist)
router.get('/removeWishlist/:id',userSessionMiddleware.isUser,userBlockMiddleware.isBlocked,wishlistController.getRemoveWishlist)

router.get('/cart',userSessionMiddleware.isUser,userBlockMiddleware.isBlocked,cartController.getCart)
router.post('/cart',userBlockMiddleware.isBlocked,cartController.postCart)
router.post('/updateCart',userBlockMiddleware.isBlocked,cartController.updateCart)
router.get('/removeCart/:id/:quantity',userSessionMiddleware.isUser,userBlockMiddleware.isBlocked,cartController.removeCart)

router.post('/couponApply',userBlockMiddleware.isBlocked,checkoutcontroller.postCouponApply)

router.get('/checkout',userSessionMiddleware.isUser,userBlockMiddleware.isBlocked,checkoutcontroller.getCheckout)

router.post('/razorpay',userBlockMiddleware.isBlocked,orderController.postRazorpay)
router.post('/walletPayment',userBlockMiddleware.isBlocked,orderController.postWalletPayment)

router.get('/order/:pay',userSessionMiddleware.isUser,userBlockMiddleware.isBlocked,orderController.getOrder)
router.get('/orderConfirmed',userSessionMiddleware.isUser,userBlockMiddleware.isBlocked,orderController.getOrderConfirmed)
router.get('/myOrders',userSessionMiddleware.isUser,userBlockMiddleware.isBlocked,orderController.getMyOrders)
router.post('/cancelOrder',userBlockMiddleware.isBlocked,orderController.cancelOrder)
router.post('/returnOrder',userBlockMiddleware.isBlocked,orderController.returnOrder)
router.get('/invoiceDownload',userSessionMiddleware.isUser,userBlockMiddleware.isBlocked,orderController.getInvoiceDownload)
router.get('/orderDetails/:id',userSessionMiddleware.isUser,orderController.getOrderDetail)

router.get('/profile',userSessionMiddleware.isUser,userBlockMiddleware.isBlocked,profileController.getProfile)
router.get('/editProfile/:id',userSessionMiddleware.isUser,userBlockMiddleware.isBlocked,profileController.getEditProfile)
router.post('/editProfile/:id',userBlockMiddleware.isBlocked,profileController.postEditProfile)
router.get('/addAddress',userSessionMiddleware.isUser,userBlockMiddleware.isBlocked,profileController.getAddAddress)
router.post('/addAddress',userBlockMiddleware.isBlocked,profileController.postAddAddress)
router.post('/defaultAddress',profileController.postSetDefaultAddress)
router.get('/editAddress/:addressId',userSessionMiddleware.isUser,userBlockMiddleware.isBlocked,profileController.getEditAddress)
router.post('/editAddress/:addressId',userBlockMiddleware.isBlocked,profileController.postEditAddress)
router.get('/deleteAddress/:addressId',userSessionMiddleware.isUser,userBlockMiddleware.isBlocked,profileController.getDeleteAddress)

router.get('/wallet',userSessionMiddleware.isUser,userBlockMiddleware.isBlocked,profileController.getWallet)
router.get('/walletHistory',userSessionMiddleware.isUser,userBlockMiddleware.isBlocked,profileController.getWalletHistory)

router.get('/referalLogout',userSessionMiddleware.isUser,userController.getReferalLogout)

router.get('/logout',userSessionMiddleware.isUser,userController.getLogout)

module.exports = router