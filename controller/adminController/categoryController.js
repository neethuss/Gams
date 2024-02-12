const categoryCollection = require("../../models/categoryModel");
const uuid = require("uuid");


//get method for rendrering category management page
const getCategoryManagement = async (req, res) => {
  try {
    const successMsg = req.flash("success");
    if (req.session.admin) {
      const perPage = 5; 
      const page = parseInt(req.query.page) || 1; 

      const totalCategories = await categoryCollection.countDocuments();
      const totalPages = Math.ceil(totalCategories / perPage);

      const skip = (page - 1) * perPage;

      const categories = await categoryCollection.find().skip(skip).limit(perPage);

      res.render("adminViews/categoryManagement", { categories, page, totalPages, successMsg });
    } else {
      res.render("adminViews/login");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while rendering category management page");
  }
};


//get method for rendering add category page
const getAddCategory = async (req, res) => {
  try {
    if (req.session.admin) {
      res.render("adminViews/addCategory");
    } else {
      res.render("adminViews/login");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while rendering add category page");
  }
};


//post method for add category
const postAddCategory = async (req, res) => {
  try {
    const categoryName = req.body.categoryName.toLowerCase();
    const check = await categoryCollection.findOne({
      category_name: { $regex: new RegExp("^" + categoryName + "$", "i") },
    });

    if (check) {
      return res.render("adminViews/addCategory", {
        msg: "Category already exists",
      });
    } else if (!req.body.categoryName || !req.body.categoryDescription) {
      res.render("adminViews/addCategory", { msg: "All fields are required" });
    } else {
      const categoryData = {
        category_id: uuid.v4(),
        category_name: req.body.categoryName,
        category_description: req.body.categoryDescription,
      };
      await categoryCollection.insertMany([categoryData]);
      req.flash("success","Category added")
      res.redirect("/admin/categoryManagement");
    }
  } catch (error) {
    console.log(error);
    return res.render("adminViews/addCategory", {
      error: "Internal Server Error",
    });
  }
};


//get method for edit category
const getEditCategory = async (req, res) => {
  try {
    if (req.session.admin) {
      const catId = req.params.catId;
      const category = await categoryCollection.findById(catId);
      res.render("adminViews/editCategory", { category });
    } else {
      res.render("adminViews/adminCategory");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while rendering edit category page");
  }
};


//post method for edit category
const postEditCategory = async (req, res) => {
  try {
    const catId = req.params.catId;


    const categoryName = req.body.categoryName.toLowerCase();

    const check = await categoryCollection.findOne({_id: { $ne: catId },
      category_name: { $regex: new RegExp("^" + categoryName + "$", "i") },
    });

    
    if (check) { 
      return res.redirect(`/admin/editCategory/${catId}`);
      
    } 
      await categoryCollection.findByIdAndUpdate(catId,  
        {
          category_name: req.body.categoryName,
          category_description: req.body.categoryDescription,
        },{new:true}
      ); 
      req.flash("success","Category edited")
      res.redirect("/admin/categoryManagement");
     
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while post edit category");
  }
};


//get method for unlist a category
const getBlockCategory = async (req, res) => {
  try {
    const category = await categoryCollection.findOne({
      category_name: req.query.category_name,
    });
    if (category) {
      const block = category.isBlocked;

      if (block) {
        await categoryCollection.updateOne(
          { category_name: req.query.category_name },
          { $set: { isBlocked: false } }
        );
      } else {
        await categoryCollection.updateOne(
          { category_name: req.query.category_name },
          { $set: { isBlocked: true } }
        );
      }
    }

    res.redirect("/admin/categoryManagement");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error occured");
  }
};


module.exports = {
  getCategoryManagement,
  getAddCategory,
  postAddCategory,
  getEditCategory,
  postEditCategory,
  getBlockCategory
};
