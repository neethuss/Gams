const userCollection = require("../../models/userModel");
const addressCollection = require("../../models/addressModel");
const walletCollection = require("../../models/walletModel");
const cartCollection = require('../../models/cartModel')


//get method for rendering profile page 
const getProfile = async (req, res) => {
  try {
    if (req.session.user) {
      req.session.addressOrigin = "profile";
      const userDetails = req.session.user;
      const email = userDetails.email;
      let user = await userCollection.findOne({ email: email });

      const userId = user._id.toString();

      if (user.userAddress) {
        user = await userCollection
          .findOne({ _id: user._id })
          .populate("userAddress");
      }

      const cart = await cartCollection.findOne({userId:req.session.user._id})
      const cartQuantity = cart.products.length

      const addresses = await addressCollection.find({ userId: userId });
      res.render("userViews/profileViews/profile", { user, addresses,cartQuantity });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while rendering profile page");
  }
};


//get method for rendering edit profile page
const getEditProfile = async (req, res) => {
  try {
    if (req.session.user) {
      const userId = req.params.id;
      const user = await userCollection.findById(userId);
      res.render("userViews/profileViews/editProfile", { user });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while rendering edit profile page");
  }
};


//post method for edit profile
const postEditProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    await userCollection.findByIdAndUpdate(userId, {
      username: req.body.username,
      email: req.body.email,
      phone: req.body.phone,
    });
    res.redirect("/profile");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error");
  }
};


//get method for rendering add address page
const getAddAddress = async (req, res) => {
  try {
    if (req.session.user) {
      res.render("userViews/profileViews/addAddress");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while rendering add address page");
  }
};


//post method for add address
const postAddAddress = async (req, res) => {
  try {
    if (req.session.user) {
      const userDetails = req.session.user;
      const email = userDetails.email;
      const user = await userCollection.findOne({ email: email });
      const userId = user._id;

      const address = {
        userId: userId,
        name: req.body.name,
        address: req.body.address,
        pincode: req.body.pincode,
        district: req.body.district,
        state: req.body.state,
        country: req.body.country,
        phone: req.body.phone,
      };

      await addressCollection.insertMany(address);
      if (req.session.addressOrigin === "profile") {
        res.redirect("/profile");
      } else {
        res.redirect("/checkout");
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while post add address");
  }
};


//get method for rendering edit address page
const getEditAddress = async (req, res) => {
  try {
    const addressId = req.params.addressId;
    const address = await addressCollection.findById(addressId);
    res.render("userViews/profileViews/editAddress", { address });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error");
  }
};


//post method for edit address
const postEditAddress = async (req, res) => {
  try {
    const addressId = req.params.addressId;

    const { name, address, district, state, country, pincode, phone } =
      req.body;

    await addressCollection.findByIdAndUpdate(addressId, {
      name: name,
      address: address,
      district: district,
      state: state,
      country: country,
      pincode: pincode,
      phone: phone,
    });

    res.redirect("/profile");
  } catch (error) {
    console.log(error);
  }
};


//post method for setting default address
const postSetDefaultAddress = async (req, res) => {
  try {
    const userId = req.session.user._id;

    const defaultAddressId = req.body.defaultAddress;

    await userCollection.updateOne(
      { _id: userId },
      { $set: { userAddress: defaultAddressId } },
      { upsert: true }
    );

  
    const user = await userCollection.findById(userId).populate("userAddress");

    res.json({
      message: "Default address updated successfully",
      defaultAddress: user.userAddress,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error setting default address" });
  }
};


//get method for delete address
const getDeleteAddress = async (req, res) => {
  try {
    if (req.session.user) {
      const addressId = req.params.addressId;

      const user = await userCollection.findOne({ _id: req.session.user._id });

      if (user.userAddress && user.userAddress.toString() === addressId) {
        user.userAddress = null;
        await user.save();
      }

      await addressCollection.findByIdAndDelete(addressId);

      if (req.session.addressOrigin === "profile") {
        res.redirect("/profile");
      } else {
        res.redirect("/checkout");
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while deleting address");
  }
};


//get method for rendering wallet page
const getWallet = async (req, res) => {
  try {
    if (req.session.user) {
      const user = req.session.user;
      const userId = user._id;
      const wallet = await walletCollection.findOne({ userId: userId });

      const cart = await cartCollection.findOne({userId:req.session.user._id})
      const cartQuantity = cart.products.length

      res.render("userViews/profileViews/wallet", { wallet,cartQuantity });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while rendering wallet");
  }
};


//get method for rendering wallet history page
const getWalletHistory = async (req, res) => {
  try {
    if (req.session.user) {
      const user = req.session.user;
      const userId = user._id;
      const wallet = await walletCollection.findOne({ userId: userId });

      const cart = await cartCollection.findOne({userId:req.session.user._id})
      const cartQuantity = cart.products.length

      if (wallet) {
        wallet.walletHistory.sort((a, b) => b.date - a.date);

        res.render("userViews/profileViews/walletHistory", {
          wallet: wallet.walletHistory,
          cartQuantity
        });
      } else {
        res.render("userViews/profileViews/walletHistory", { wallet: null,cartQuantity });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while rendering wallet history page");
  }
};


module.exports = {
  getProfile,
  getEditProfile,
  postEditProfile,
  getAddAddress,
  postAddAddress,
  postSetDefaultAddress,
  getEditAddress,
  postEditAddress,
  getDeleteAddress,
  getWallet,
  getWalletHistory,
};
