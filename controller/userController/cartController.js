const cartCollection = require("../../models/cartModel");
const productCollection = require('../../models/productModel')

//get method for cart page
const getCart = async (req, res) => {
  try {
    const user = req.session.user;
    const userId = user._id;
let cart = []
     cart = await cartCollection
      .findOne({ userId: userId })
      .populate("products.product");

    if (cart ) {

      cart.products = cart.products.filter(item=>item.product && item.product.unlist)

      const cartTotal = cart.products.reduce((total, product) => {
        return total + product.product.product_price * product.quantity;
      }, 0);

      cart.cartTotal = cartTotal;

      await cart.save();
    }
    const cartQuantity = cart.products.length;

    res.render("userViews/cart", { cart, userId, cartQuantity });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while rendering cart page");
  }
};

//post method for cart page
const postCart = async (req, res) => {
  try {
    const productId = req.body.productId;
    const userId = req.body.userId;
    const quantity = req.body.quantity;

    const cart = await cartCollection.findOne({ userId: userId });


    if (!cart) {
      // If cart doesn't exist, create a new cart and add the product

      const cart = {
        userId: userId,
        products: [{ product: productId, quantity: quantity }],
      };
      await cartCollection.insertMany(cart);
      await productCollection.updateOne({_id:productId},{$inc:{product_stock:-quantity}})

      res.redirect("/cart");
    } else {
      // If cart exists, check if the product is already in the car

      const existingProductIndex = cart.products.findIndex((item) =>
        item.product.equals(productId)
      );

      if (existingProductIndex === -1) {
        // If the product is not in the cart, add it

        cart.products.push({ product: productId, quantity: quantity });
        await productCollection.updateOne({_id:productId},{$inc:{product_stock:-quantity}})

        await cart.save();
        res.redirect("/cart");
      } else {
        // If the product is already in the cart, update the quantity

        cart.products[existingProductIndex].quantity += parseInt(quantity);
        await productCollection.updateOne({_id:productId},{$inc:{product_stock:-quantity}})

        await cart.save();
        res.redirect("/cart");
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while post cart");
  }
};

//get method for update cart after updating quantity
const updateCart = async (req, res) => {
  try {
    const userId = req.body.userId;
    const updatedProducts = req.body.updatedProducts;
    
    const cart = await cartCollection
      .findOne({ userId: userId })
      .populate("products.product");
      
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }
    
    for (const updatedProduct of updatedProducts) {
      const { productId, quantity } = updatedProduct;
      
      const existingProductIndex = cart.products.findIndex((item) =>
        item.product._id.equals(productId)
      );
      
      if (existingProductIndex !== -1) {
        const currentQuantity = cart.products[existingProductIndex].quantity;
        const newQuantity = parseInt(quantity);
        
        const quantityDifference = newQuantity - currentQuantity;
        
        if (quantityDifference !== 0) {
          await productCollection.updateOne(
            { _id: productId },
            { $inc: { product_stock: -quantityDifference } }
          );
        }
        
        cart.products[existingProductIndex].quantity = newQuantity;
      }
    }
    
    await cart.save();
    
    const cartTotal = cart.products.reduce((total, product) => {
      return total + product.product.product_price * product.quantity;
    }, 0);
    
    res.json({
      success: true,
      cart: cart,
      cartTotal: cartTotal.toFixed(2),
    });
    
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error occurred while updating cart" });
  }
};
//get method for remove a product from cart
const removeCart = async (req, res) => {
  try {
    const productId = req.params.id;
    const quantity = req.params.quantity
    const user = req.session.user;
    const userId = user._id;

    await cartCollection.updateOne(
      { userId: userId },
      { $pull: { products: { product: productId } } }
    );

    await productCollection.findByIdAndUpdate(productId,{$inc:{product_stock:quantity}})


    res.redirect("/cart");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error occured while removing cart");
  }
};

module.exports = {
  getCart,
  postCart,
  updateCart,
  removeCart,
};
