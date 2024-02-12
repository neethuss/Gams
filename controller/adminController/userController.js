const userCollection = require('../../models/userModel')


//get method for rendering user management page
const getUserManagement = async (req, res) => {
  try {
    if (req.session.admin) {
      const perPage = 5; 
      const page = parseInt(req.query.page) || 1;

      const totalUsers = await userCollection.countDocuments();
      const totalPages = Math.ceil(totalUsers / perPage);

      const skip = (page - 1) * perPage;

      const users = await userCollection.find().skip(skip).limit(perPage);

      res.render('adminViews/userManagement', { users, page, totalPages });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send('Error while rendering user management');
  }
};


//get method for blocking an user
const getBlockUser = async (req, res) => {
  try {
    const users = await userCollection.findOne({ email: req.query.email });
    const block = users.isBlocked;
    if (block) {
      await userCollection.updateOne(
        { email: req.query.email },
        { $set: { isBlocked: false } }
      );
    } else {
      await userCollection.updateOne(
        { email: req.query.email },
        { $set: { isBlocked: true } }
      );
    }
    res.redirect("/admin/userManagement");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error occured");
  }
};




module.exports = {
  getUserManagement,
  getBlockUser
}