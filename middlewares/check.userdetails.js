import {PrismaClient} from  '@prisma/client'

const client = new PrismaClient();

export const  verifyUserDetails = async (req, res, next) => {
    const {userName, emailAddress}= req.body

    try{
        const existingEmail = await client.user.findFirst({
            where: {
                emailAddress
            }
        })
        if(existingEmail){
            return res.status(400).json({
                message: "Email already exists",
                status: "fail",
            });
        }
        const existingUsername = await client.user.findFirst({
            where: {
                userName
            }
        })
        if(existingUsername){
            return res.status(400).json({
                message: "Username already exists",
                status: "fail",
            });
        }
        next();
    }catch(error){
        res.status(500).json({
            message: "Something went wrong",
            status: "fail",
        }
    
        )
    }
}