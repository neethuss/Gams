const productCollection = require("../../models/productModel");
const wishlistCollection = require("../../models/wishlistModel");
const cartCollection = require("../../models/cartModel");

//get method to rendering wishlist page
const getWishlist = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const wishlist = await wishlistCollection
      .findOne({ userId: userId })
      .populate("products.product");

    if (wishlist) {
      wishlist.products = wishlist.products.filter(
        (item) => item.product && item.product.unlist === true
      );
    }

    const cart = await cartCollection.findOne({ userId: req.session.user._id });

    if (cart) {
      cart.products = cart.products.filter(
        (item) => item.product && item.product.unlist === true
      );
    }
    const cartQuantity = cart.products.length;

    res.render("userViews/wishlist", { wishlist, userId, cartQuantity });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while rendering wishlist");
  }
};

//post method for wishlist
const postWishlist = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const productId = req.body.productId;

    const wishlist = await wishlistCollection.findOne({ userId: userId });

    if (!wishlist) {
      const wishlist = {
        userId: userId,
        products: [{ product: productId }],
      };
      await wishlistCollection.insertMany(wishlist);
      await productCollection.findByIdAndUpdate(productId, {
        inWishlist: true,
      });
      return res.json({ added: true });
    } else {
      const existingProductIndex = wishlist.products.findIndex((item) =>
        item.product.equals(productId)
      );

      if (existingProductIndex === -1) {
        wishlist.products.push({ product: productId });

        await wishlist.save();
        await productCollection.findByIdAndUpdate(productId, {
          inWishlist: true,
        });
        return res.json({ added: true });
      } else {
        wishlist.products.pull({ product: productId });
        await wishlist.save();
        await productCollection.findByIdAndUpdate(productId, {
          inWishlist: false,
        });
        return res.json({ added: false });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while post wishlist");
  }
};

//get method for remove a product from wishlist
const getRemoveWishlist = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.session.user._id;
    await wishlistCollection.findOneAndUpdate(
      { userId: userId },
      { $pull: { products: { product: productId } } }
    );
    res.redirect("/wishlist");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while removing product from wishlist");
  }
};

module.exports = {
  getWishlist,
  postWishlist,
  getRemoveWishlist,
};
