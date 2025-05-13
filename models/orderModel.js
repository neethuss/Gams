const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: "user",
    required: true,
  },

  products: [
    {
      product: {
        type: mongoose.Schema.ObjectId,
        ref: "product",
        required: true,
      },
      quantity: {
        type: Number,
      },
      totalPrice: {
        type: Number,
      },
    },
  ],

   shippingAddress: {
    name: String,
    address:String,
    district: String,
    state: String,
    pincode: String,
    country: String,
    phone: String,
    
  },

  discountAmount:{
    type:Number,
    default:0
  },

  payTotal:{
    type:Number,
    required:true
  },

  paymentMethod: {
    type: String,
    default:"COD"
  },

  orderDate: {
    type: Date,
    default: Date.now(),
  },
  status:{
    type:String,
    default:"Pending"
  }
});

module.exports = mongoose.model("order", orderSchema);
