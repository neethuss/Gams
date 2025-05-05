const categoryCollection = require("../../models/categoryModel");
const productCollection = require("../../models/productModel");
const cartCollection = require("../../models/cartModel");

const isVisibleProduct = (product) =>
  product.unlist === true && product.product_category?.isBlocked === true;


//get method for rendering shop page
const getShop = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = 6;

    const allProducts = await productCollection
      .find()
      .populate("product_category");

    const products = allProducts.filter(isVisibleProduct);

    const allCategories = await categoryCollection.find();
    const categories = allCategories.filter((category) => category.isBlocked);

    const totalPages = Math.ceil(products.length / perPage);
    const startIndex = (page - 1) * perPage;
    const endIndex = Math.min(startIndex + perPage, products.length);
    const currentProducts = products.slice(startIndex, endIndex);

    const { sortOption = null, category = null, search = null } = req.query;

    const cart = await cartCollection.findOne({ userId: req.session.user._id });
    const cartQuantity = cart ? cart.products.length : 0;

    res.render("userViews/shop", {
      products: currentProducts,
      page,
      totalPages,
      categories,
      sortOption,
      category,
      search,
      cartQuantity,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while rendering shop page");
  }
};


//get method for searching a product
const getSearchProduct = async (req, res) => {
  try {
    const { search = "", sortOption = null, category = null } = req.query;
    const page = parseInt(req.query.page) || 1;
    const perPage = 6;

    const allCategories = await categoryCollection.find();
    const categories = allCategories.filter((category) => category.isBlocked);

    const allProducts = await productCollection
      .find()
      .populate("product_category");

    const searchedProducts = allProducts.filter((product) => {
      return (
        isVisibleProduct(product) &&
        product.product_name.toLowerCase().includes(search.toLowerCase()) &&
        (!category ||
          product.product_category?.category_name === category)
      );
    });

    const totalPages = Math.ceil(searchedProducts.length / perPage);
    const startIndex = (page - 1) * perPage;
    const endIndex = Math.min(startIndex + perPage, searchedProducts.length);
    const currentProducts = searchedProducts.slice(startIndex, endIndex);

    const cart = await cartCollection.findOne({ userId: req.session.user._id });
    const cartQuantity = cart ? cart.products.length : 0;

    res.render("userViews/shop", {
      products: currentProducts,
      page,
      totalPages,
      categories,
      sortOption,
      category,
      search,
      cartQuantity,
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

    const allCategories = await categoryCollection.find();
    const categories = allCategories.filter((category) => category.isBlocked);

    let products = [];

    if (category) {
      const selectedCategory = await categoryCollection.findOne({ category_name: category });
      if (selectedCategory && selectedCategory.isBlocked) {
        const fetchedProducts = await productCollection
          .find({ product_category: selectedCategory._id })
          .populate("product_category");
        products = fetchedProducts.filter(isVisibleProduct);
      }
    } else {
      const allProducts = await productCollection.find().populate("product_category");
      products = allProducts.filter(isVisibleProduct);
    }

    const totalPages = Math.ceil(products.length / perPage);
    const startIndex = (page - 1) * perPage;
    const endIndex = Math.min(startIndex + perPage, products.length);
    const currentProducts = products.slice(startIndex, endIndex);

    const { sortOption = null, search = null } = req.query;

    const cart = await cartCollection.findOne({ userId: req.session.user._id });
    const cartQuantity = cart ? cart.products.length : 0;

    res.render("userViews/shop", {
      products: currentProducts,
      page,
      totalPages,
      categories,
      category,
      sortOption,
      search,
      cartQuantity,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while filtering by category");
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

    let sortQuery = {};
    if (sortOption === "LowToHigh") {
      sortQuery = { product_price: 1 };
    } else if (sortOption === "HighToLow") {
      sortQuery = { product_price: -1 };
    }

    const allProducts = await productCollection
      .find()
      .sort(sortQuery)
      .populate("product_category");

    const filteredProducts = allProducts.filter(isVisibleProduct);

    const totalPages = Math.ceil(filteredProducts.length / perPage);
    const startIndex = (page - 1) * perPage;
    const endIndex = Math.min(startIndex + perPage, filteredProducts.length);
    const currentProducts = filteredProducts.slice(startIndex, endIndex);

    const { category = null, search = null } = req.query;

    const cart = await cartCollection.findOne({ userId: req.session.user._id });
    const cartQuantity = cart ? cart.products.length : 0;

    res.render("userViews/shop", {
      products: currentProducts,
      page,
      totalPages,
      categories,
      sortOption,
      category,
      search,
      cartQuantity,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while sorting by price");
  }
};


// get method for single product
const getProduct = async (req, res) => {
  try {
    const proId = req.params.proId;

    const productData = await productCollection.findById(proId);
    const user = req.session.user;
    const userId = user._id;

    if (!productData) {
      return res.status(404).send("Product not found");
    }

    // Fetch the cart for the logged-in user
    const cart = await cartCollection.findOne({
      userId: req.session.user._id,
    });

    // Check if cart exists, and get the cart quantity safely
    const cartQuantity = cart ? cart.products.length : 0; // Handle null case

    // Render the product page with product data
    res.render("userViews/product", {
      product: productData,
      userId: userId,
      productId: proId,
      cartQuantity,
    });
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
