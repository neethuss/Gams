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

    doc.fontSize(25).text('Sales Report', { align: 'center' }).moveDown(2);

    const pageWidth = doc.page.width;
    const margin = 50;
    const tableWidth = pageWidth - (margin * 2);
    let yPosition = doc.y;

    const columns = [
      { header: 'Order #', width: tableWidth * 0.1 },
      { header: 'Customer', width: tableWidth * 0.2 },
      { header: 'Date', width: tableWidth * 0.15 },
      { header: 'Payment', width: tableWidth * 0.15 },
      { header: 'Products', width: tableWidth * 0.25 },
      { header: 'Total', width: tableWidth * 0.15 }
    ];

    doc.font('Helvetica-Bold');
    doc.fontSize(12);
    
    doc.fillColor('#f0f0f0')
       .rect(margin, yPosition, tableWidth, 20)
       .fill();
    
    doc.fillColor('#000000');
    let xPosition = margin;
    columns.forEach(column => {
      doc.text(column.header, xPosition, yPosition + 5, {
        width: column.width,
        align: 'center'
      });
      xPosition += column.width;
    });
    
    yPosition += 20;
    doc.font('Helvetica');

    doc.moveTo(margin, yPosition)
       .lineTo(margin + tableWidth, yPosition)
       .stroke();

    orders.forEach((order, index) => {
      if (yPosition > doc.page.height - 100) {
        doc.addPage();
        yPosition = 50;
        
        doc.font('Helvetica-Bold');
        doc.fillColor('#f0f0f0')
           .rect(margin, yPosition, tableWidth, 20)
           .fill();
        
        doc.fillColor('#000000');
        let headerX = margin;
        columns.forEach(column => {
          doc.text(column.header, headerX, yPosition + 5, {
            width: column.width,
            align: 'center'
          });
          headerX += column.width;
        });
        
        yPosition += 20;
        doc.font('Helvetica');
        
        doc.moveTo(margin, yPosition)
           .lineTo(margin + tableWidth, yPosition)
           .stroke();
      }

      const productList = order.products.map(p => p.product.product_name).join(', ');
      const customerInfo = `${order.userId.username}\n${order.userId.email}\n${order.userId.phone}`;
      
      const textHeight = Math.max(
        doc.heightOfString(customerInfo, { width: columns[1].width }),
        doc.heightOfString(productList, { width: columns[4].width })
      );
      const rowHeight = Math.max(textHeight + 10, 40);

      if (index % 2 === 1) {
        doc.fillColor('#f9f9f9')
           .rect(margin, yPosition, tableWidth, rowHeight)
           .fill();
      }
      doc.fillColor('#000000');

      let xPosition = margin;
      
      doc.text((index + 1).toString(), xPosition, yPosition + 5, {
        width: columns[0].width,
        align: 'center'
      });
      xPosition += columns[0].width;
      
      doc.text(customerInfo, xPosition, yPosition + 5, {
        width: columns[1].width,
        align: 'left'
      });
      xPosition += columns[1].width;
      
      doc.text(new Date(order.orderDate).toLocaleDateString(), xPosition, yPosition + 5, {
        width: columns[2].width,
        align: 'center'
      });
      xPosition += columns[2].width;
      
      doc.text(order.paymentMethod, xPosition, yPosition + 5, {
        width: columns[3].width,
        align: 'center'
      });
      xPosition += columns[3].width;
      
      doc.text(productList, xPosition, yPosition + 5, {
        width: columns[4].width,
        align: 'left'
      });
      xPosition += columns[4].width;
      
      doc.text(`₹${order.payTotal}`, xPosition, yPosition + 5, {
        width: columns[5].width,
        align: 'right'
      });
      
      yPosition += rowHeight;
      
      doc.moveTo(margin, yPosition)
         .lineTo(margin + tableWidth, yPosition)
         .stroke();
    });

    yPosition += 20;
    doc.fontSize(12).font('Helvetica-Bold').text(`Total Orders: ${orders.length}`, margin, yPosition);
    yPosition += 20;
    
    const totalAmount = orders.reduce((sum, order) => sum + Number(order.payTotal), 0);
    doc.text(`Total Revenue: ₹${totalAmount.toFixed(2)}`, margin, yPosition);
    
    doc.fontSize(10).font('Helvetica')
       .text(`Report generated on: ${new Date().toLocaleDateString()}`, margin, doc.page.height - 50, {
         align: 'center',
         width: tableWidth
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
