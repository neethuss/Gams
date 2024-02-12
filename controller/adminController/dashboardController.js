const userCollection = require("../../models/userModel");
const orderCollection = require("../../models/orderModel");
const bannerCollection = require("../../models/bannerModel");

//get method for rendering admin dashboarad
const getDashboard = async (req, res) => {
  try {
    const successMsg = req.flash("success");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    //calculating total amount for today's sale
    const calculateTodaySalesAmount = await orderCollection.aggregate([
      {
        $match: {
          orderDate: { $gte: today },
          status: "Delivered",
        },
      },
      {
        $group: {
          _id: null,
          todaySalesAmount: { $sum: "$payTotal" },
        },
      },
    ]);

    let todaySalesAmount = 0;
    if (calculateTodaySalesAmount && calculateTodaySalesAmount.length > 0) {
      todaySalesAmount = calculateTodaySalesAmount[0].todaySalesAmount;
    }

    //calculating todays total number of orders
    const todayOrderCount = await orderCollection.countDocuments({
      status: "Delivered",
      orderDate: { $gte: today },
    });

    //calculating newUserCount
    const calulateNewUsersCount = await userCollection.aggregate([
      {
        $match: {
          createdAt: { $gte: today },
        },
      },
      {
        $count: "calulateNewUsersCount",
      },
    ]);

    let newUsersCount = 0;
    if (calulateNewUsersCount && calulateNewUsersCount.length > 0) {
      newUsersCount = calulateNewUsersCount[0].calulateNewUsersCount;
    }

    //calculating total number of users
    const totalUsers = await userCollection.countDocuments();

    //calculating total amount of sales
    const calulateSalesAmount = await orderCollection.aggregate([
      { $match: { status: "Delivered" } },
      { $group: { _id: null, salesAmount: { $sum: "$payTotal" } } },
    ]);

    let salesAmount = 0;

    if (calulateSalesAmount && calulateSalesAmount.length > 0) {
      salesAmount = calulateSalesAmount[0].salesAmount;
    }

    const banners = await bannerCollection.find();

    //weely sales report
    const startOfWeek = () => {
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day == 0 ? -6 : 1);
      return new Date(today.setDate(diff));
    };

    const weeklySales = await orderCollection.aggregate([
      {
        $match: {
          orderDate: { $gte: startOfWeek() },
          status: "Delivered",
        },
      },
      {
        $group: {
          _id: { $week: "$orderDate" },
          totalSales: { $sum: "$payTotal" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const weeklySalesData = weeklySales.map((item) => item.totalSales);

    //category wise sales report
    const categoryWiseSales = await orderCollection.aggregate([
      {
        $match: {
          status: "Delivered",
        },
      },
      {
        $unwind: "$products",
      },
      {
        $lookup: {
          from: "products",
          localField: "products.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $lookup: {
          from: "categories",
          localField: "productDetails.product_category",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: "$categoryDetails",
      },
      {
        $group: {
          _id: "$categoryDetails.category_name",
          totalSales: { $sum: "$payTotal" },
        },
      },
      {
        $sort: { totalSales: -1 },
      },
    ]);

    const categorySalesLabel = categoryWiseSales.map((item) => item._id);
    const categorySalesData = categoryWiseSales.map((item) => item.totalSales);
    
    // Calculating payment method usage for sales
    const paymentMethodStats = await orderCollection.aggregate([
      {
        $match: { status: "Delivered" },
      },
      {
        $group: {
          _id: "$paymentMethod",
          totalPayments: { $sum: "$payTotal" },
          countOrders: { $sum: 1 },
        },
      },
      {
        $sort: { totalPayments: -1 },
      },
    ]);

    let paymentMethodLabels = [];
    let paymentMethodData = [];

    paymentMethodStats.forEach((stat) => {
      paymentMethodLabels.push(stat._id);
      paymentMethodData.push(stat.totalPayments);
    });

    res.render("adminViews/dashboard", {
      successMsg,
      todaySalesAmount,
      todayOrderCount,
      totalUsers,
      newUsersCount,
      salesAmount,
      banners,
      weeklySalesData,
      categorySalesLabel,
      categorySalesData,
      paymentMethodLabels,
      paymentMethodData,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error rendering admin dashboard");
  }
};

module.exports = {
  getDashboard,
};
