import { Router } from 'express';
import { registerUser, userLogin, userLogout, refreshAccessToken, changeUserPassword, getCurrentUser, changeAccountDetails, userAvatarUpdate, userCoverImageUpdate, getWatchHistory, getChannelProfile } from '../Controllers/user.js';
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
router.route("/change-password").post(verifyJWT, changeUserPassword)
router.route("/profile").get(verifyJWT, getCurrentUser)
router.route("./upadte-profile").patch(verifyJWT, changeAccountDetails)
router.route("/update-avatar").patch(verifyJWT, upload.single('avatar'), userAvatarUpdate)
router.route("/update-coverimage").patch(verifyJWT, upload.single('coverImage'), userCoverImageUpdate)
router.route("/channel/:username").get(verifyJWT, getChannelProfile)
router.route("/watch-history").get(verifyJWT, getWatchHistory)



export default router;