const userCollection = require("../../models/userModel");

//get method for rendering user management page
const getUserManagement = async (req, res) => {
  try {
    const perPage = 5;
    const page = parseInt(req.query.page) || 1;

    const totalUsers = await userCollection.countDocuments();
    const totalPages = Math.ceil(totalUsers / perPage);

    const skip = (page - 1) * perPage;

    const users = await userCollection.find().skip(skip).limit(perPage);

    res.render("adminViews/userManagement", { users, page, totalPages });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while rendering user management");
  }
};

//post method for blocking an user
const postBlockUser = async (req, res) => {
  try {
    
    const email = req.body.email;
    const user = await userCollection.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await userCollection.updateOne(
      { email },
      { $set: { isBlocked: !user.isBlocked } }
    );

    res.status(200).json({ message: 'User updated' });
    
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error occurred' });
  }
  
};


module.exports = {
  getUserManagement,
  postBlockUser,
};
