const mongoose = require('mongoose')

const walletSchema = new mongoose.Schema({

  userId:{
    type:mongoose.Schema.ObjectId,
    required:true
  },
  walletAmount:{
    type:Number,
    required:true
  },
  walletHistory:[{
    process:{
      type:String,
      required:true
    },
    amount:{
      type:Number,
      required:true
    },
    date:{
      type:Date,
      default:Date.now()
      
    }
  }]

})

module.exports = mongoose.model("wallet", walletSchema);