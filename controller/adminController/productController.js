const productCollection = require("../../models/productModel");
const categoryCollection = require("../../models/categoryModel");
const uuid = require("uuid");

//get method for product management
const getProductManagement = async (req, res) => {
  try {
    const successMsg = req.flash("success");

    const products = await productCollection.find();
    const category = await categoryCollection.find();

    res.render("adminViews/productManagement", {
      products,
      category,
      successMsg,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while rendering admin product management page");
  }
};

//get method for add product
const getAddProduct = async (req, res) => {
  try {
    const errorMsg = req.flash("error");
    const categories = await categoryCollection.find();

    res.render("adminViews/addProduct", { categories, errorMsg });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while rendering add product page");
  }
};

//post method for add product
const postAddProduct = async (req, res) => {
  try {
    let img;
    img = req.files.map((val) => {
      return val.filename;
    });
    const productName = req.body.productName.toLowerCase();

    const category = await categoryCollection.findOne({
      category_name: req.body.productCategory,
    });

    const check = await productCollection.findOne({
      product_name: { $regex: new RegExp("^" + productName + "$", "i") },
    });
    if (check) {
      req.flash("error", "Product already exists");
      res.redirect("/admin/addProduct");
    } else {
      productData = {
        product_id: uuid.v4(),
        product_name: req.body.productName,
        product_category: category._id,
        product_price: req.body.productPrice,
        product_stock: req.body.productStock,
        product_image: img,
        product_description:req.body.productDescription
      };
      await productCollection.insertMany([productData]);
      req.flash("success", "Product added");
      res.redirect("/admin/productManagement");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while post add product");
  }
};

//get method for edit product
const getEditProduct = async (req, res) => {
  try {
    const proId = req.params.proId;
    const categories = await categoryCollection.find();

    const product = await productCollection.findById(proId);
    res.render("adminViews/editProduct", { product, categories });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error occured");
  }
};

//post method fot edit product
const postEditProduct = async (req, res) => {
  try {
    const proId = req.params.proId;
    const productName = req.body.productName.trim().toLowerCase();

    const check = await productCollection.findOne({
      product_name: { $regex: new RegExp("^" + productName + "$", "i") },
      _id: { $ne: proId },
    });

    if (check) {
      req.flash("error", "Product name already exists");
      return res.redirect(`/admin/editProduct/${proId}`);
    }

    const existingProduct = await productCollection.findById(proId);
    if (!existingProduct) {
      req.flash("error", "Product not found");
      return res.redirect("/admin/productManagement");
    }

    let productImages = existingProduct.product_image;
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => file.filename);
      productImages = productImages.concat(newImages);
    }

    if (productImages.length === 0) {
      req.flash("error", "At least one product image is required");
      return res.redirect(`/admin/editProduct/${proId}`);
    }

    await productCollection.findByIdAndUpdate(
      proId,
      {
        product_name: req.body.productName,
        product_category: req.body.productCategory,
        product_price: req.body.productPrice,
        product_stock: req.body.productStock,
        product_image: productImages,
        product_description:req.body.productDescription
      },
      { new: true }
    );

    req.flash("success", "Product details updated successfully");
    res.redirect("/admin/productManagement");
  } catch (error) {
    console.log(error);
    req.flash("error", "An error occurred while updating the product");
    res.redirect(`/admin/editProduct/${req.params.proId}`);
  }
};

//get method for unlist a product
const postBlockProduct = async (req, res) => {
  try {
    const product = await productCollection.findOne({
      product_name: req.body.product_name,
    });

    if (product) {
      const block = product.unlist;
      if (block) {
        await productCollection.updateOne(
          { product_name: req.body.product_name },
          {
            $set: { unlist: false },
          }
        );
      } else {
        await productCollection.updateOne(
          { product_name: req.body.product_name },
          {
            $set: { unlist: true },
          }
        );
      }
      res.status(200).json({ message: "product updated" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error occured");
  }
};

// method for deleting an image in edit product
const deleteProductImage = async (req, res) => {
  try {
    console.log('deletig product', req.params)
    const { index, id } = req.params;
    const product = await productCollection.findById(id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const deletedImage = product.product_image.splice(index, 1)[0];
    console.log(deletedImage)
    await product.save();

    res.json({
      success: true,
      message: "Image deleted successfully",
      remainingImages: product.product_image.length,
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Error occurred while deleting image" });
  }
};
module.exports = {
  getProductManagement,
  getAddProduct,
  postAddProduct,
  getEditProduct,
  postEditProduct,
  postBlockProduct,
  deleteProductImage,
};
