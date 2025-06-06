import { Router } from 'express';
import { registerUser, userLogin, userLogout, refreshAccessToken } from '../Controllers/user.js';
import { upload } from '../Middlewares/multer.js';
import { verifyJWT } from '../Middlewares/auth.js';


const router = Router()

router.route("/register").post(
    upload.fields([
        {name: 'avatar', maxCount:1 },
        {name: 'coverImage', maxCount: 1}
    
    ]), registerUser)

router.route("/login").post(userLogin)

router.route("/logout").post(verifyJWT, userLogout) 
router.route("/refresh-token").post(refreshAccessToken)


export default router;