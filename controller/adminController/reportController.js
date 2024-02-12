const orderCollection = require("../../models/orderModel");
const PDFDocument = require('pdfkit');
const excel = require("exceljs");

//get method for sales report
const getSalesReport = async (req, res) => {
  try {
    let query = {status:'Delivered'};

    if (req.query.startDate && req.query.endDate) {
      const startDate = new Date(req.query.startDate);
      const endDate = new Date(req.query.endDate);

      query.orderDate = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const perPage = 5; 
    const page = parseInt(req.query.page) || 1; 

    const totalOrders = await orderCollection.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / perPage);

    const orderDetails = await orderCollection
      .find(query)
      .populate("userId")
      .populate({
        path: "products.product",
        model: "product",
      })
      .populate("shippingAddress")
      .skip((page - 1) * perPage)
      .limit(perPage);

    res.render("adminViews/salesReport", { orders: orderDetails, page, totalPages });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while rendering sales report");
  }
};




const getGeneratePdf = async (req, res) => {
  try {
  
    const orders = await orderCollection
      .find({ status: 'Delivered' })
      .populate("userId")
      .populate("products.product")
      .populate("shippingAddress");

   
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.pdf');

    
    const doc = new PDFDocument();
    doc.pipe(res);

   
    doc.fontSize(25).text('Sales Report', { underline: true }).moveDown();

    
    orders.forEach((order, index) => {
      doc.fontSize(14).text(`Order ${index +  1}:`);
      doc.fontSize(12).text(`User: ${order.userId.username}`);
      doc.fontSize(12).text(`Email: ${order.userId.email}`);
      doc.fontSize(12).text(`Phone: ${order.userId.phone}`);
      doc.fontSize(12).text(`Address: ${order.shippingAddress.address}, ${order.shippingAddress.district}, ${order.shippingAddress.state}, ${order.shippingAddress.country}, ${order.shippingAddress.pincode}`);
      doc.fontSize(12).text(`Payment Method: ${order.paymentMethod}`);
      doc.fontSize(12).text(`Order Date: ${new Date(order.orderDate).toLocaleDateString()}`);
      doc.fontSize(12).text(`Status: ${order.status}`);
      doc.fontSize(12).text(`Discount Amount: ${order.discountAmount}`)
      doc.fontSize(12).text(`Total Amount: ${order.payTotal}`);
      
      order.products.forEach((product, idx) => {
        doc.fontSize(12).text(`Product ${idx +  1}: ${product.product.product_name}`);
      });
      doc.moveDown();
    });

    
    doc.end();
  } catch (error) {
    console.log(error);
    res.status(500).send('Error while generating PDF');
  }
};

const getGenerateExcel = async(req,res)=>{
  try {
    const orders = await orderCollection
    .find({ status: 'Delivered' })
    .populate("userId")
    .populate("products.product")
    .populate("shippingAddress");

  // Create a new workbook and add a worksheet
  const workbook = new excel.Workbook();
  const worksheet = workbook.addWorksheet('Orders');

  // Define columns
  worksheet.columns = [
    { header: 'Order Number', key: 'orderNumber', width:  10 },
    { header: 'Username', key: 'username', width:  32 },
    { header: 'Email', key: 'email', width:  32 },
    { header: 'Phone', key: 'phone', width:  15 },
    { header: 'Address', key: 'address', width:  50 },
    { header: 'Payment Method', key: 'paymentMethod', width:  15 },
    { header: 'Order Date', key: 'orderDate', width:  15 },
    { header: 'Status', key: 'status', width:  15 },
    { header: 'Total Amount', key: 'totalAmount', width:  15 },
    { header: 'Products', key: 'products', width:  50 }
  ];

  // Add rows for each order
  orders.forEach((order, index) => {
    const products = order.products.map(p => p.product.product_name).join(', ');
    worksheet.addRow({
      orderNumber: index +  1,
      username: order.userId.username,
      email: order.userId.email,
      phone: order.userId.phone,
      address: `${order.shippingAddress.address}, ${order.shippingAddress.district}, ${order.shippingAddress.state}, ${order.shippingAddress.country}, ${order.shippingAddress.pincode}`,
      paymentMethod: order.paymentMethod,
      orderDate: order.orderDate.toISOString().slice(0,10),
      status: order.status,
      totalAmount: order.payTotal,
      products: products
    });
  });

  // Write the workbook to a buffer
  const buffer = await workbook.xlsx.writeBuffer();

  // Set the headers for the Excel file
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=orders.xlsx');

  // Send the Excel file to the client
  res.send(buffer);
  } catch (error) {
    console.log(error)
    res.status(500).send('Error whiile generating excel')
  }
}



module.exports = {
  getSalesReport,
  getGeneratePdf,
  getGenerateExcel
};
