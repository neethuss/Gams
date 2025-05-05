const adminCollection = require("../../models/adminModel");

//geat method for rendering admin login page
const getLogin = (req, res) => {
  try {
    if (req.session.admin) {
      return res.redirect("/admin/dashboard");
    }
    const successMsg = req.flash("success");
    const errorMsg = req.flash("error");

    if (req.session.admin) {
      res.render("adminViews/dashboard", { errorMsg, successMsg });
    } else {
      res.render("adminViews/login", { errorMsg, successMsg });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error occurred");
  }
};

//post method for post login
const postLogin = async (req, res) => {
  try {
    const check = await adminCollection.findOne({ email: req.body.email });

    if (check) {
      if (check.password === req.body.password) {
        req.session.admin = check.email;
        req.flash("success", "Admin login successfully completed");
        return res.redirect("/admin/dashboard");
      } else {
        req.flash("error", "Invalid admin credentials");
        res.redirect("/admin");
      }
    } else {
      req.flash("error", "Invalid admin credentials");
      return res.redirect("/admin");
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Error while checking admin credentials");
  }
};

//get method for session destroy and logout
const getLogout = (req, res) => {
  req.session.admin = null;
  res.redirect("/admin");
};

module.exports = {
  getLogin,
  postLogin,
  getLogout,
};
