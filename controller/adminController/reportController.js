const orderCollection = require("../../models/orderModel");
const PDFDocument = require('pdfkit');
const excel = require('exceljs');
const fs = require('fs');
const path = require('path');

//get method for sales report
const getSalesReport = async (req, res) => {
  try {
    // Default query for delivered orders
    let query = { status: 'Delivered' };
    let startDate, endDate;
    let reportType = req.query.reportType || '';
    let reportPeriodText = 'All Time';
    let paginationQueryString = '';
    let exportQueryParams = '';

    // Handle report type filters (daily, weekly, monthly)
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    if (reportType === 'daily') {
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0); // Start of today
      
      query.orderDate = {
        $gte: startOfDay,
        $lte: today
      };
      
      startDate = startOfDay.toISOString().split('T')[0];
      endDate = today.toISOString().split('T')[0];
      reportPeriodText = `Today (${startDate})`;
      paginationQueryString = `reportType=daily`;
      exportQueryParams = `?reportType=daily`;
    } 
    else if (reportType === 'weekly') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday of this week
      startOfWeek.setHours(0, 0, 0, 0);
      
      query.orderDate = {
        $gte: startOfWeek,
        $lte: today
      };
      
      startDate = startOfWeek.toISOString().split('T')[0];
      endDate = today.toISOString().split('T')[0];
      reportPeriodText = `This Week (${startDate} to ${endDate})`;
      paginationQueryString = `reportType=weekly`;
      exportQueryParams = `?reportType=weekly`;
    }
    else if (reportType === 'monthly') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      query.orderDate = {
        $gte: startOfMonth,
        $lte: today
      };
      
      startDate = startOfMonth.toISOString().split('T')[0];
      endDate = today.toISOString().split('T')[0];
      reportPeriodText = `This Month (${startDate} to ${endDate})`;
      paginationQueryString = `reportType=monthly`;
      exportQueryParams = `?reportType=monthly`;
    }
    // Handle custom date range filter
    else if (req.query.startDate && req.query.endDate) {
      startDate = req.query.startDate;
      endDate = req.query.endDate;
      
      // Create Date objects for comparison
      const startDateObj = new Date(startDate);
      startDateObj.setHours(0, 0, 0, 0);
      
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      
      query.orderDate = {
        $gte: startDateObj,
        $lte: endDateObj
      };
      
      // if start and end dates are the same
      if (startDate === endDate) {
        reportPeriodText = `${startDate}`;
      } else {
        reportPeriodText = `${startDate} to ${endDate}`;
      }
      
      paginationQueryString = `startDate=${startDate}&endDate=${endDate}`;
      exportQueryParams = `?startDate=${startDate}&endDate=${endDate}`;
    }

    // Pagination settings
    const perPage = 5;
    const page = parseInt(req.query.page) || 1;
    
    // Get total orders count for the query
    const totalOrders = await orderCollection.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / perPage);
    
    // Get order details
    const orderDetails = await orderCollection
      .find(query)
      .populate("userId")
      .populate({
        path: "products.product",
        model: "product",
      })
      .populate("shippingAddress")
      .sort({ orderDate: -1 }) 
      .skip((page - 1) * perPage)
      .limit(perPage);
    
    // Calculate total revenue
    const allOrdersForRevenue = await orderCollection
      .find(query)
      .select('payTotal');
    
    const totalRevenue = allOrdersForRevenue.reduce((sum, order) => sum + Number(order.payTotal), 0);
    
    res.render("adminViews/salesReport", { 
      orders: orderDetails, 
      page, 
      totalPages, 
      totalOrders, 
      totalRevenue,
      reportType,
      reportPeriodText,
      startDate,
      endDate,
      paginationQueryString,
      exportQueryParams,
      perPage
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while rendering sales report");
  }
};

const getGeneratePdf = async (req, res) => {
  try {
    let query = { status: 'Delivered' };
    let reportTitle = 'All Time Sales Report';
    
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    // Date range filtering logic
    if (req.query.reportType === 'daily') {
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      
      query.orderDate = {
        $gte: startOfDay,
        $lte: today
      };
      
      reportTitle = `Daily Sales Report - ${startOfDay.toISOString().split('T')[0]}`;
    } 
    else if (req.query.reportType === 'weekly') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      query.orderDate = {
        $gte: startOfWeek,
        $lte: today
      };
      
      reportTitle = `Weekly Sales Report - ${startOfWeek.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`;
    }
    else if (req.query.reportType === 'monthly') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      query.orderDate = {
        $gte: startOfMonth,
        $lte: today
      };
      
      reportTitle = `Monthly Sales Report - ${startOfMonth.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`;
    }
    else if (req.query.startDate && req.query.endDate) {
      const startDate = new Date(req.query.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999);
      
      query.orderDate = {
        $gte: startDate,
        $lte: endDate
      };
      
      if (req.query.startDate === req.query.endDate) {
        reportTitle = `Sales Report - ${req.query.startDate}`;
      } else {
        reportTitle = `Sales Report - ${req.query.startDate} to ${req.query.endDate}`;
      }
    }

    // Fetch orders based on the query
    const orders = await orderCollection
      .find(query)
      .populate("userId")
      .populate("products.product")
      .populate("shippingAddress")
      .sort({ orderDate: -1 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=sales-report-${Date.now()}.pdf`);

    const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
    doc.pipe(res);

    // Add header
    doc.fontSize(22).text(reportTitle, { align: 'center' }).moveDown(0.5);
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' }).moveDown(1);

    const pageWidth = doc.page.width;
    const margin = 50;
    const tableWidth = pageWidth - (margin * 2);

    // Summary section
    doc.fontSize(14).text('Order Summary', { align: 'left' }).moveDown(0.5);
    
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.payTotal), 0);
    const totalDiscount = orders.reduce((sum, order) => sum + Number(order.discountAmount || 0), 0);
    const totalProducts = orders.reduce((sum, order) => sum + order.products.length, 0);
    
    doc.fontSize(10);
    doc.text(`Total Orders: ${orders.length}`, { continued: true });
    doc.text(`     Total Products: ${totalProducts}`, { continued: true });
    doc.text(`     Total Discount: ₹${totalDiscount.toFixed(2)}`, { continued: true });
    doc.text(`     Total Revenue: ₹${totalRevenue.toFixed(2)}`).moveDown(1.5);

    // Draw order table
    doc.fontSize(14).text('Order Details', { align: 'left' }).moveDown(0.5);
    
    // Render each order with nested product details
    let yPosition = doc.y;
    let orderCount = 1;
    
    for (const order of orders) {
      // Check if there's enough space for a new order header plus at least one product
      if (yPosition > doc.page.height - 200) {
        doc.addPage();
        yPosition = 50;
        doc.fontSize(10).text(`Page ${doc._pageNumber}`, doc.page.width - 100, 30);
      }
      
      // Order header box
      doc.rect(margin, yPosition, tableWidth, 60)
         .fillAndStroke('#f6f6f6', '#000000');
         
      doc.fillColor('#000000');
      
      // Order header content
      doc.fontSize(11).font('Helvetica-Bold');
      doc.text(`Order #${orderCount}`, margin + 10, yPosition + 10);
      doc.fontSize(9).font('Helvetica');
      
      const customerInfo = `Customer: ${order.userId.username} | Email: ${order.userId.email} | Phone: ${order.userId.phone}`;
      doc.text(customerInfo, margin + 10, yPosition + 25);
      
      let addressStr = 'N/A';
      if (order.shippingAddress) {
        addressStr = `${order.shippingAddress.address}, ${order.shippingAddress.district}, ${order.shippingAddress.state}, ${order.shippingAddress.pincode}`;
      }
      
      doc.text(`Address: ${addressStr}`, margin + 10, yPosition + 40);
      
      // Order meta info - right side
      const orderDate = new Date(order.orderDate).toLocaleDateString();
      const orderInfo = `Date: ${orderDate} | Payment: ${order.paymentMethod} | Status: ${order.status}`;
      doc.text(orderInfo, pageWidth - 300, yPosition + 10);
      
      // Order financials - right side
      doc.text(`Discount: ₹${Number(order.discountAmount || 0).toFixed(2)}`, pageWidth - 300, yPosition + 25);
      doc.font('Helvetica-Bold').text(`Total: ₹${Number(order.payTotal).toFixed(2)}`, pageWidth - 300, yPosition + 40);
      doc.font('Helvetica');
      
      yPosition += 70; // Space after order header
      
      // Products table header
      const productColumns = [
        { header: 'Item #', width: tableWidth * 0.07 },
        { header: 'Product Name', width: tableWidth * 0.35 },
        { header: 'Price', width: tableWidth * 0.15 },
        { header: 'Quantity', width: tableWidth * 0.12 },
        { header: 'Total', width: tableWidth * 0.15 },
        { header: 'Product ID', width: tableWidth * 0.16 }
      ];
      
      // Draw product table header
      doc.fillColor('#e0e0e0')
         .rect(margin, yPosition, tableWidth, 20)
         .fill();
      
      doc.fillColor('#000000').font('Helvetica-Bold');
      let xPosition = margin;
      
      productColumns.forEach(column => {
        doc.text(column.header, xPosition + 5, yPosition + 5, {
          width: column.width - 10,
          align: column.header === 'Total' || column.header === 'Price' || column.header === 'Quantity' ? 'right' : 'left'
        });
        xPosition += column.width;
      });
      
      yPosition += 20;
      doc.font('Helvetica');
      
      // Draw product items
      order.products.forEach((product, prodIndex) => {
        // Check if we need a new page for this product
        if (yPosition > doc.page.height - 80) {
          doc.addPage();
          yPosition = 50;
          
          // Reprint the product table header on new page
          doc.fillColor('#e0e0e0')
             .rect(margin, yPosition, tableWidth, 20)
             .fill();
          
          doc.fillColor('#000000').font('Helvetica-Bold');
          let headerX = margin;
          
          productColumns.forEach(column => {
            doc.text(column.header, headerX + 5, yPosition + 5, {
              width: column.width - 10,
              align: column.header === 'Total' || column.header === 'Price' || column.header === 'Quantity' ? 'right' : 'left'
            });
            headerX += column.width;
          });
          
          yPosition += 20;
          doc.font('Helvetica');
        }
        
        // Alternate row colors
        if (prodIndex % 2 === 1) {
          doc.fillColor('#f9f9f9')
             .rect(margin, yPosition, tableWidth, 20)
             .fill();
        }
        
        doc.fillColor('#000000');
        
        // Draw product data
        xPosition = margin;
        
        // Item number
        doc.text((prodIndex + 1).toString(), xPosition + 5, yPosition + 5, {
          width: productColumns[0].width - 10
        });
        xPosition += productColumns[0].width;
        
        // Product name
        doc.text(product.product.product_name, xPosition + 5, yPosition + 5, {
          width: productColumns[1].width - 10
        });
        xPosition += productColumns[1].width;
        
        // Unit price (calculated from total/quantity)
        const unitPrice = (product.totalPrice / product.quantity).toFixed(2);
        doc.text(`₹${unitPrice}`, xPosition + 5, yPosition + 5, {
          width: productColumns[2].width - 10,
          align: 'right'
        });
        xPosition += productColumns[2].width;
        
        // Quantity
        doc.text(product.quantity.toString(), xPosition + 5, yPosition + 5, {
          width: productColumns[3].width - 10,
          align: 'right'
        });
        xPosition += productColumns[3].width;
        
        // Total price - fix the display of values by ensuring proper number formatting
        doc.text(`₹${Number(product.totalPrice).toFixed(2)}`, xPosition + 5, yPosition + 5, {
          width: productColumns[4].width - 10,
          align: 'right'
        });
        xPosition += productColumns[4].width;
        
        // Product ID
        doc.text(product.product._id.toString(), xPosition + 5, yPosition + 5, {
          width: productColumns[5].width - 10,
          align: 'left' // Ensure left alignment for product ID
        });
        
        yPosition += 20;
      });
      
      // Draw line after products
      doc.moveTo(margin, yPosition)
         .lineTo(margin + tableWidth, yPosition)
         .stroke();
      
      yPosition += 20; // Space before next order
      orderCount++;
    }
    
    // Add footer
    doc.fontSize(10)
       .text(`End of Report - ${reportTitle}`, margin, doc.page.height - 50, {
         align: 'center',
         width: tableWidth
       });

    doc.end();
  } catch (error) {
    console.log(error);
    res.status(500).send('Error while generating PDF');
  }
};

const getGenerateExcel = async(req, res) => {
  try {
    let query = { status: 'Delivered' };
    let reportTitle = 'All Time Sales Report';
    
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    // Date range filtering logic
    if (req.query.reportType === 'daily') {
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      
      query.orderDate = {
        $gte: startOfDay,
        $lte: today
      };
      
      reportTitle = `Daily_${startOfDay.toISOString().split('T')[0]}`;
    } 
    else if (req.query.reportType === 'weekly') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      query.orderDate = {
        $gte: startOfWeek,
        $lte: today
      };
      
      reportTitle = `Weekly_${startOfWeek.toISOString().split('T')[0]}_to_${today.toISOString().split('T')[0]}`;
    }
    else if (req.query.reportType === 'monthly') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      query.orderDate = {
        $gte: startOfMonth,
        $lte: today
      };
      
      reportTitle = `Monthly_${startOfMonth.toISOString().split('T')[0]}_to_${today.toISOString().split('T')[0]}`;
    }
    else if (req.query.startDate && req.query.endDate) {
      const startDate = new Date(req.query.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999);
      
      query.orderDate = {
        $gte: startDate,
        $lte: endDate
      };
      
      if (req.query.startDate === req.query.endDate) {
        reportTitle = `${req.query.startDate}`;
      } else {
        reportTitle = `${req.query.startDate}_to_${req.query.endDate}`;
      }
    }

    // Fetch orders based on the query
    const orders = await orderCollection
      .find(query)
      .populate("userId")
      .populate("products.product")
      .populate("shippingAddress")
      .sort({ orderDate: -1 });

    // Create a new workbook
    const workbook = new excel.Workbook();
    
    // Add summary worksheet
    const summarySheet = workbook.addWorksheet('Summary');
    
    // Add report metadata
    summarySheet.addRow(['Sales Report', reportTitle]);
    summarySheet.addRow(['Generated on', new Date().toLocaleString()]);
    summarySheet.addRow([]);  // Empty row as separator
    
    // Summary statistics
    const totalOrders = orders.length;
    const totalProducts = orders.reduce((sum, order) => sum + order.products.length, 0);
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.payTotal), 0);
    const totalDiscount = orders.reduce((sum, order) => sum + Number(order.discountAmount || 0), 0);
    
    summarySheet.addRow(['Total Orders', totalOrders]);
    summarySheet.addRow(['Total Products Sold', totalProducts]);
    summarySheet.addRow(['Total Revenue', totalRevenue]);
    summarySheet.addRow(['Total Discounts', totalDiscount]);
    summarySheet.addRow(['Net Revenue', totalRevenue - totalDiscount]);
    
    // Style summary section
    for (let i = 1; i <= 7; i++) {
      const row = summarySheet.getRow(i);
      if (i <= 2) {
        row.font = { bold: true, size: 14 };
      }
      if (i >= 5) {
        row.getCell(1).font = { bold: true };
        if (i >= 6) {
          row.getCell(2).numFmt = '₹#,##0.00';
        }
      }
    }
    
    // Add order details worksheet with more comprehensive information
    const orderSheet = workbook.addWorksheet('Order Details');
    
    // Define order columns with expanded fields to match PDF report
    orderSheet.columns = [
      { header: 'Order ID', key: 'orderId', width: 12 },
      { header: 'Customer Name', key: 'username', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Address', key: 'address', width: 40 },
      { header: 'District', key: 'district', width: 15 },
      { header: 'State', key: 'state', width: 15 },
      { header: 'Pincode', key: 'pincode', width: 10 },
      { header: 'Order Date', key: 'orderDate', width: 12 },
      { header: 'Payment Method', key: 'paymentMethod', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Discount', key: 'discount', width: 12 },
      { header: 'Total Amount', key: 'totalAmount', width: 15 },
      { header: 'Product Count', key: 'productCount', width: 12 }
    ];
    
    // Style the header row
    orderSheet.getRow(1).font = { bold: true, size: 12 };
    orderSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Add order data with expanded address fields
    orders.forEach((order, index) => {
      const shippingAddress = order.shippingAddress || {};
      
      orderSheet.addRow({
        orderId: index + 1,
        username: order.userId.username,
        email: order.userId.email,
        phone: order.userId.phone,
        address: shippingAddress.address || 'N/A',
        district: shippingAddress.district || 'N/A',
        state: shippingAddress.state || 'N/A',
        pincode: shippingAddress.pincode || 'N/A',
        orderDate: order.orderDate.toISOString().slice(0,10),
        paymentMethod: order.paymentMethod,
        status: order.status,
        discount: Number(order.discountAmount || 0),
        totalAmount: Number(order.payTotal),
        productCount: order.products.length
      });
      
      // Style every other row
      if (index % 2 === 1) {
        const row = orderSheet.getRow(index + 2); // +2 because headers are row 1
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9F9F9' }
        };
      }
    });
    
    // Format currency columns
    orderSheet.getColumn('discount').numFmt = '₹#,##0.00';
    orderSheet.getColumn('totalAmount').numFmt = '₹#,##0.00';
    
    // Add product details worksheet
    const productSheet = workbook.addWorksheet('Product Details');
    
    // Define product columns
    productSheet.columns = [
      { header: 'Order ID', key: 'orderId', width: 10 },
      { header: 'Product ID', key: 'productId', width: 24 },
      { header: 'Product Name', key: 'productName', width: 40 },
      { header: 'Unit Price', key: 'unitPrice', width: 12 },
      { header: 'Quantity', key: 'quantity', width: 10 },
      { header: 'Total Price', key: 'totalPrice', width: 15 },
      { header: 'Customer', key: 'customer', width: 20 },
      { header: 'Order Date', key: 'orderDate', width: 12 }
    ];
    
    // Style the header row
    productSheet.getRow(1).font = { bold: true, size: 12 };
    productSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Add product data
    let productRowIndex = 2;
    orders.forEach((order, orderIndex) => {
      order.products.forEach((product) => {
        const unitPrice = product.totalPrice / product.quantity;
        
        productSheet.addRow({
          orderId: orderIndex + 1,
          productId: product.product._id.toString(),
          productName: product.product.product_name,
          unitPrice: Number(unitPrice),
          quantity: product.quantity,
          totalPrice: Number(product.totalPrice),
          customer: order.userId.username,
          orderDate: order.orderDate.toISOString().slice(0,10)
        });
        
        // Style every other row
        if (productRowIndex % 2 === 0) {
          const row = productSheet.getRow(productRowIndex);
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9F9F9' }
          };
        }
        
        productRowIndex++;
      });
    });
    
    // Format currency columns
    productSheet.getColumn('unitPrice').numFmt = '₹#,##0.00';
    productSheet.getColumn('totalPrice').numFmt = '₹#,##0.00';
    
    // Add product summary worksheet (grouped by product)
    const productSummarySheet = workbook.addWorksheet('Product Summary');
    
    // Define product summary columns
    productSummarySheet.columns = [
      { header: 'Product ID', key: 'productId', width: 24 },
      { header: 'Product Name', key: 'productName', width: 40 },
      { header: 'Total Quantity', key: 'totalQuantity', width: 15 },
      { header: 'Total Revenue', key: 'totalRevenue', width: 15 },
      { header: 'Average Unit Price', key: 'avgUnitPrice', width: 18 },
      { header: 'Order Count', key: 'orderCount', width: 12 } // New column to track in how many orders this product appears
    ];
    
    // Style the header row
    productSummarySheet.getRow(1).font = { bold: true, size: 12 };
    productSummarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Create product summary data with enhanced metrics
    const productSummary = {};
    
    orders.forEach(order => {
      order.products.forEach(product => {
        const productId = product.product._id.toString();
        
        if (!productSummary[productId]) {
          productSummary[productId] = {
            productId: productId,
            productName: product.product.product_name,
            totalQuantity: 0,
            totalRevenue: 0,
            orderSet: new Set() // Track unique orders containing this product
          };
        }
        
        productSummary[productId].totalQuantity += product.quantity;
        productSummary[productId].totalRevenue += Number(product.totalPrice);
        productSummary[productId].orderSet.add(order._id.toString());
      });
    });
    
    // Add product summary data
    let summaryRowIndex = 2;
    Object.values(productSummary).forEach((product, index) => {
      product.avgUnitPrice = product.totalRevenue / product.totalQuantity;
      
      productSummarySheet.addRow({
        productId: product.productId,
        productName: product.productName,
        totalQuantity: product.totalQuantity,
        totalRevenue: product.totalRevenue,
        avgUnitPrice: product.avgUnitPrice,
        orderCount: product.orderSet.size // Count of unique orders
      });
      
      // Style every other row
      if (index % 2 === 1) {
        const row = productSummarySheet.getRow(summaryRowIndex);
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9F9F9' }
        };
      }
      
      summaryRowIndex++;
    });
    
    // Format currency columns
    productSummarySheet.getColumn('totalRevenue').numFmt = '₹#,##0.00';
    productSummarySheet.getColumn('avgUnitPrice').numFmt = '₹#,##0.00';
    
    // Add a new worksheet for payment method analysis
    const paymentAnalysisSheet = workbook.addWorksheet('Payment Analysis');
    
    // Define payment analysis columns
    paymentAnalysisSheet.columns = [
      { header: 'Payment Method', key: 'paymentMethod', width: 20 },
      { header: 'Order Count', key: 'orderCount', width: 15 },
      { header: 'Total Revenue', key: 'totalRevenue', width: 15 },
      { header: 'Average Order Value', key: 'avgOrderValue', width: 20 }
    ];
    
    // Style the header row
    paymentAnalysisSheet.getRow(1).font = { bold: true, size: 12 };
    paymentAnalysisSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Create payment method summary
    const paymentSummary = {};
    
    orders.forEach(order => {
      const paymentMethod = order.paymentMethod;
      
      if (!paymentSummary[paymentMethod]) {
        paymentSummary[paymentMethod] = {
          paymentMethod: paymentMethod,
          orderCount: 0,
          totalRevenue: 0
        };
      }
      
      paymentSummary[paymentMethod].orderCount += 1;
      paymentSummary[paymentMethod].totalRevenue += Number(order.payTotal);
    });
    
    // Add payment summary data
    Object.values(paymentSummary).forEach((payment, index) => {
      payment.avgOrderValue = payment.totalRevenue / payment.orderCount;
      
      paymentAnalysisSheet.addRow({
        paymentMethod: payment.paymentMethod,
        orderCount: payment.orderCount,
        totalRevenue: payment.totalRevenue,
        avgOrderValue: payment.avgOrderValue
      });
      
      // Style every other row
      if (index % 2 === 1) {
        const row = paymentAnalysisSheet.getRow(index + 2); // +2 because headers are row 1
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9F9F9' }
        };
      }
    });
    
    // Format currency columns
    paymentAnalysisSheet.getColumn('totalRevenue').numFmt = '₹#,##0.00';
    paymentAnalysisSheet.getColumn('avgOrderValue').numFmt = '₹#,##0.00';
    
    // Generate a unique filename
    const filename = `sales_report_${reportTitle.replace(/\s/g, '_')}_${Date.now()}.xlsx`;
    
    // Create the directory path
    const dirPath = path.join(__dirname, '../../public/reports');
    const filepath = path.join(dirPath, filename);
    
    // Ensure the reports directory exists
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
    } catch (mkdirError) {
      console.error('Error creating directory:', mkdirError);
    }
    
    // Write to file
    await workbook.xlsx.writeFile(filepath);
    
    // Provide download link - make sure it's relative to the public folder
    const downloadUrl = `/reports/${filename}`;
    
    // Return JSON response with download URL
    res.status(200).json({
      status: 'success',
      message: 'Excel report generated successfully',
      data: {
        downloadUrl,
        reportTitle,
        orderCount: orders.length,
        productCount: totalProducts,
        totalAmount: totalRevenue.toFixed(2),
        totalDiscount: totalDiscount.toFixed(2)
      }
    });
    
  } catch (error) {
    console.error('Error generating Excel report:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate Excel report',
      error: error.message
    });
  }
};

module.exports = {
  getSalesReport,
  getGeneratePdf,
  getGenerateExcel
}
