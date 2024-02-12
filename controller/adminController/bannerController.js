const bannerCollection = require("../../models/bannerModel");


//get methtod for rendering order management page
const getBannerManagement = async (req, res) => {
  try {
    if (req.session.admin) {
      const perPage = 5;
      const page = parseInt(req.query.page) || 1;

      const skip = (page - 1) * perPage;

      const totalBanners = await bannerCollection.countDocuments();
      const totalPages = Math.ceil(totalBanners / perPage);

      const banners = await bannerCollection.find().skip(skip).limit(perPage);

      res.render("adminViews/bannerManagement", { banners, page, totalPages });
    } else {
      res.render("adminViews/login");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while rendering banner management");
  }
};


//get method for rendering add banner page
const getAddBanner = async (req, res) => {
  try {
    res.render("adminViews/addBanner");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while rendering add banner");
  }
};


//post method for post add banner
const postAddBanner = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).send("No files were uploaded.");
    }

    let img = req.files.map((val) => {
      return val.filename;
    });

    const banner = new bannerCollection({
      bannerImage: img,
      bannerTitle: req.body.bannerTitle,
      bannerSubTitle: req.body.bannerSubTitle,
      bannerUrl: req.body.bannerUrl,
    });

    await banner.save();
    res.redirect("/admin/bannerManagement");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error while adding a new banner");
  }
};


//et method for deleting a banner
const getDeleteBanner = async (req, res) => {
  try {
    if (req.session.admin) {
      const bannerId = req.params.bannerId;
      await bannerCollection.findByIdAndDelete(bannerId);
      res.redirect("/admin/bannerManagement");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while deleting ");
  }
};


module.exports = {
  getBannerManagement,
  getAddBanner,
  postAddBanner,
  getDeleteBanner,
};
