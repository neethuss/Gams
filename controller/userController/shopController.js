const categoryCollection = require("../../models/categoryModel");
const productCollection = require("../../models/productModel");
const cartCollection = require('../../models/cartModel')


//get method for rendering shop page
const getShop = async (req, res) => {
  try {
    if (req.session.user) {
      const page = parseInt(req.query.page) || 1; 
      const perPage = 6;
      const allProducts = await productCollection
        .find()
        .populate("product_category");
      const products = allProducts.filter((product) => product.unlist);
      const allCategories = await categoryCollection.find();
      const categories = allCategories.filter((category) => category.isBlocked);

      const totalPages = Math.ceil(products.length / perPage);

      const startIndex = (page - 1) * perPage;
      const endIndex = Math.min(startIndex + perPage, products.length);
      const currentProducts = products.slice(startIndex, endIndex);

      const sortOption = req.query.sortOption || null;
      const category = req.query.category || null;
      const search = req.query.search || null;

      const cart = await cartCollection.findOne({userId:req.session.user._id})
  
      const cartQuantity = cart.products.length
      
      

      res.render("userViews/shop", {
        products: currentProducts,
        page,
        totalPages,
        categories,
        sortOption,
        category,
        search,
        cartQuantity
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while rendering shop page");
  }
};


//get method for searching a product
const getSearchProduct = async (req, res) => {
  try {
    const search = req.query.search;
    const sortOption = req.query.sortOption || null;
    const category = req.query.category || null;

    const page = parseInt(req.query.page) || 1;
    const perPage = 6;

    const allCategories = await categoryCollection.find();
    const categories = allCategories.filter((category) => category.isBlocked);
    const allProducts = await productCollection
      .find()
      .populate("product_category");

      const searchedProducts = allProducts.filter(
        (product) =>
            product.unlist &&
            product.product_name.toLowerCase().includes(search.toLowerCase()) &&
            (!category || (category && product.product_category.category_name === category)) 
    );

    const totalPages = Math.ceil(searchedProducts.length / perPage);

    const startIndex = (page - 1) * perPage;
    const endIndex = Math.min(startIndex + perPage, searchedProducts.length);
    const currentProducts = searchedProducts.slice(startIndex, endIndex);

    

    const cart = await cartCollection.findOne({userId:req.session.user._id})
    const cartQuantity = cart.products.length

    res.render("userViews/shop", {
      products: currentProducts,
      page,
      totalPages,
      categories,
      sortOption,
      category,
      search,
      cartQuantity
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while searching for products");
  }
};


//get method for filtering by category
const getFilterByCategory = async (req, res) => {
  try {
    const category = req.query.category;

    const page = parseInt(req.query.page) || 1;
    const perPage = 6; 

    const cart = await cartCollection.findOne({userId:req.session.user._id})
    const cartQuantity = cart.products.length

    let products;

    const allCategories = await categoryCollection.find();
    const categories = allCategories.filter((category) => category.isBlocked);

    if (category) {
      const selectedCategory = await categoryCollection.findOne({
        category_name: category,
      });
      if (selectedCategory) {
        products = await productCollection
          .find({ product_category: selectedCategory._id })
          .populate("product_category");
      }
    } else {
      products = await productCollection.find().populate("product_category");
    }

    const totalPages = Math.ceil(products.length / perPage);

    const startIndex = (page - 1) * perPage;
    const endIndex = Math.min(startIndex + perPage, products.length);
    const currentProducts = products.slice(startIndex, endIndex);

    const sortOption = req.query.sortOption || null;
    const search = req.query.search || null;

    

    res.render("userViews/shop", {
      products: currentProducts,
      page,
      totalPages,
      categories,
      category,
      sortOption,
      search,
      cartQuantity
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while post filter by category");
  }
};


//get method for getting products sort by price
const getSortByPrice = async (req, res) => {
  try {
    const sortOption = req.query.sortOption;
    const page = parseInt(req.query.page) || 1;
    const perPage = 6; 

    const allCategories = await categoryCollection.find();
    const categories = allCategories.filter((category) => category.isBlocked);
    let products;

    let sortQuery = {};

    if (sortOption === "LowToHigh") {
      sortQuery = { product_price: 1 };
    } else if (sortOption === "HighToLow") {
      sortQuery = { product_price: -1 };
    }

    const count = await productCollection.countDocuments();
    const totalPages = Math.ceil(count / perPage);

    products = await productCollection
      .find()
      .sort(sortQuery)
      .skip((page - 1) * perPage)
      .limit(perPage);

    const category = req.query.category || null;
    const search = req.query.search || null;

    const cart = await cartCollection.findOne({userId:req.session.user._id})
    const cartQuantity = cart.products.length

    res.render("userViews/shop", {
      products,
      page,
      totalPages,
      categories,
      sortOption,
      category,
      search,
      cartQuantity
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while sorting by price");
  }
};


//get method for single product
const getProduct = async (req, res) => {
  try {
    if (req.session.user) {
      const proId = req.params.proId;

      const productData = await productCollection.findById(proId);

      const user = req.session.user;

      const userId = user._id;

      
      if (!productData) {
        return res.status(404).send("Product not found");
      }

      const cart = await cartCollection.findOne({userId:req.session.user._id})
      const cartQuantity = cart.products.length
      res.render("userViews/product", {
        product: productData,
        userId: userId,
        productId: proId,
        cartQuantity
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error while rendering product page");
  }
};


module.exports = {
  getShop,
  getSearchProduct,
  getFilterByCategory,
  getSortByPrice,
  getProduct,
};
