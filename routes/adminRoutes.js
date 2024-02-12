const express = require('express')
const router = express.Router()
const multer = require('../middleware/multer')

const dashboardController = require('../controller/adminController/dashboardController')
const loginController = require('../controller/adminController/loginController')
const userController = require('../controller/adminController/userController')
const categoryController = require('../controller/adminController/categoryController')
const productController = require('../controller/adminController/productController')
const orderController = require('../controller/adminController/orderController')
const couponController = require('../controller/adminController/couponController')
const reportController = require('../controller/adminController/reportController')
const bannerController = require('../controller/adminController/bannerController')

const adminSessionMiddleware = require('../middleware/adminAuth')

router.get('/',loginController.getLogin)
router.post('/',loginController.postLogin)

router.get('/dashboard',adminSessionMiddleware.isAdmin,dashboardController.getDashboard)

router.get('/userManagement',adminSessionMiddleware.isAdmin,userController.getUserManagement)
router.get('/blockUser',adminSessionMiddleware.isAdmin,userController.getBlockUser)

router.get('/categoryManagement',adminSessionMiddleware.isAdmin,categoryController.getCategoryManagement)
router.get('/addCategory',adminSessionMiddleware.isAdmin,categoryController.getAddCategory)
router.post('/addCategory',adminSessionMiddleware.isAdmin,categoryController.postAddCategory)
router.get('/editCategory/:catId',adminSessionMiddleware.isAdmin,categoryController.getEditCategory)
router.post('/editCategory/:catId',adminSessionMiddleware.isAdmin,categoryController.postEditCategory)
router.get('/blockCategory',adminSessionMiddleware.isAdmin,categoryController.getBlockCategory)

router.get('/productManagement',adminSessionMiddleware.isAdmin,productController.getProductManagement)
router.get('/addProduct',adminSessionMiddleware.isAdmin,productController.getAddProduct)
router.post('/addProduct',adminSessionMiddleware.isAdmin,multer.upload.array('productImage',4),productController.postAddProduct)
router.get('/editProduct/:proId',adminSessionMiddleware.isAdmin,productController.getEditProduct)
router.post('/editProduct/:proId',adminSessionMiddleware.isAdmin,multer.upload.array('productImage',4),productController.postEditProduct)
router.get('/blockProduct',adminSessionMiddleware.isAdmin,productController.getBlockProduct)
router.get('/deleteImage/:index/:id',adminSessionMiddleware.isAdmin, productController.getDeleteImage);

router.get('/orderManagement',adminSessionMiddleware.isAdmin,adminSessionMiddleware.isAdmin,orderController.getOrederManagement)
router.get('/updateOrderStatus/:orderId/:newStatus',adminSessionMiddleware.isAdmin,orderController.getUpdateOrderStatus)
router.get('/orderDetails/:orderId',orderController.getOrderDetails)

router.get('/couponManagement',adminSessionMiddleware.isAdmin,couponController.getCouponManagement)
router.get('/addCoupon',adminSessionMiddleware.isAdmin,couponController.getAddCoupon)
router.post('/addCoupon',adminSessionMiddleware.isAdmin,couponController.postAddCoupon)
router.get('/editcoupon/:id',adminSessionMiddleware.isAdmin,couponController.getEditCoupon)
router.post('/editCoupon/:id',adminSessionMiddleware.isAdmin,couponController.postEditCoupon)
router.get('/blockCoupon',adminSessionMiddleware.isAdmin,couponController.getBlockCoupon)

router.get('/bannerManagement',adminSessionMiddleware.isAdmin,bannerController.getBannerManagement)
router.get('/addBanner',adminSessionMiddleware.isAdmin,bannerController.getAddBanner)
router.post('/addBanner',adminSessionMiddleware.isAdmin,multer.upload.array('bannerImage'),bannerController.postAddBanner)
router.get('/deleteBanner/:bannerId',adminSessionMiddleware.isAdmin,bannerController.getDeleteBanner)

router.get('/salesReport',adminSessionMiddleware.isAdmin,adminSessionMiddleware.isAdmin,reportController.getSalesReport)
router.get('/generatePdf',adminSessionMiddleware.isAdmin,reportController.getGeneratePdf)
router.get('/generateExcel',adminSessionMiddleware.isAdmin,reportController.getGenerateExcel)

router.get('/logout',loginController.getLogout)

module.exports = router