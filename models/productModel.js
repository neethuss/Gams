const mongoose = require('mongoose')
const {Schema} = mongoose

const productSchema = new mongoose.Schema({

 
  product_name:{
    type:String,
    required:true
  },

  product_category:{
    type: Schema.Types.ObjectId,
    ref: 'category',
    required : true
  },

  product_price:{
    type:Number,
    required:true
  },

  product_stock:{
    type:Number,
    required:true
  },

  product_image:{ 
    type:[String],
    required:true
  },

  inWishlist:{
    type:Boolean,
    default:false
  },

  unlist:{
    type:Boolean,
    default:true
  }

})

module.exports = mongoose.model('product',productSchema)