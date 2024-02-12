const mongoose = require('mongoose')

const cartSchema = new mongoose.Schema({
  
  userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'user',
    required:true
  },

  products:[{
    product:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'product',
      required:true
    },

    quantity:{
      type:Number,
      required:true
    }
    
  }],
  discountAmount:{
    type:Number,
    default:0
  },
  
})

module.exports = mongoose.model('cart',cartSchema)