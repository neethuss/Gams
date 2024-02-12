const productCollection = require('../../models/productModel')
const categoryCollection = require('../../models/categoryModel')
const uuid = require("uuid");

//get method for product management
const getProductManagement = async (req, res) => {
  try {
    const successMsg = req.flash("success")
    if (req.session.admin) {
      const products = await productCollection.find();
      const category = await categoryCollection.find();

      res.render("adminViews/productManagement", { products, category ,successMsg});
    } else {
      res.render("adminViews/login");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while rendering admin product management page");
  }
};


//get method for add product
const getAddProduct = async (req, res) => {
  try {
    if (req.session.admin) {
      const categories = await categoryCollection.find();

      res.render("adminViews/addProduct", { categories });
    } else {
      res.render("/adminViews/login");
    }
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
      res.redirect("/admin/addProduct", { msg: "Product already exists" });
    } else {
      productData = {
        product_id: uuid.v4(),
        product_name: req.body.productName,
        product_category: category._id,
        product_price: req.body.productPrice,
        product_stock: req.body.productStock,
        product_image: img,
      };
      await productCollection.insertMany([productData]);
      req.flash("success","Product added")
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
    let img;
    const category = await categoryCollection.findOne({
      category_name: req.body.productCategory,
    });

    if (req.files && req.files.length > 0) {
    
      img = req.files.map((val) => {
        return val.filename;
      });

      
      const existingProduct = await productCollection.findById(req.params.proId);
      
      
      img = existingProduct.product_image.concat(img);
    } else {
      
      const existingProduct = await productCollection.findById(req.params.proId);
      img = existingProduct.product_image;
    }

    const proId = req.params.proId;

    const productName = req.body.productName.toLowerCase();

    const check = await productCollection.findOne({
      product_name: { $regex: new RegExp("^" + productName + "$", "i") },
      _id: { $ne: proId },
    });
    if (check) {
      return res.redirect("/admin/editProduct", { msg: "Product already exists" });
    }

    await productCollection.findByIdAndUpdate(proId,
      {
        product_name: req.body.productName,
        product_category: category._id,
        product_price: req.body.productPrice,
        product_stock: req.body.productStock,
        product_image: img,
      },
      { new: true }
    );
    req.flash("success","Product details edited")
    res.redirect('/admin/productManagement');
  } catch (error) {
    console.log(error);
    res.status(500).send("Error occurred");
  }
};


//get method for unlist a product
const getBlockProduct = async (req, res) => {
  try {
    const proId = req.query.id
    console.log(proId);
    const product = await productCollection.findOne({_id:proId})

    if (product) {

      const block = product.unlist;
      if (block) {
        await productCollection.findByIdAndUpdate(proId,
          { $set: { unlist: false } }
        );
      } else {
        await productCollection.findByIdAndUpdate(proId,
          { $set: { unlist: true } }
        );
      }
      res.redirect("/admin/productManagement");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error occured");
  }
};


//get method for deleting an image in edit product
const getDeleteImage = async (req, res) => {
  try {
      const { index, id } = req.params;
      const product = await productCollection.findById(id);

      const deletedImage = product.product_image.splice(index, 1);
      
    
      await product.save();

      res.redirect(`/admin/editProduct/${id}`);
  } catch (error) {
      console.log(error);
      res.status(500).send('Error occurred while deleting image');
  }
};



module.exports = {
  getProductManagement,
  getAddProduct,
  postAddProduct,
  getEditProduct,
  postEditProduct,
  getBlockProduct,
  getDeleteImage
}
