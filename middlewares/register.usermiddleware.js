export const verifyUser = (req, res, next) => {
    const { firstName, lastName, emailAddress, userName, password } = req.body;
  
    if (!firstName || !lastName || !emailAddress || !userName || !password) {
      return res.status(400).json({
        message: "All fields are required",
        status: "fail",
      });
    }
  
    next();
  }