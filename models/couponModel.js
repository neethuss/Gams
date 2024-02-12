const mongoose = require('mongoose')

const couponSchema = new mongoose.Schema({

  couponName:{
    type:String,
    required:true
  },

  couponCode:{
    type:String,
    required:true
  },

  discountAmount:{
    type:Number,
    required:true
  },

  minimumPurchaseAmount:{
    type:Number,
    required:true
  },

  expiryDate:{
    type:Date,
    required:true
  },

  unlist:{
    type:Boolean,
    default:true
  }


})

module.exports = mongoose.model('coupon',couponSchema)