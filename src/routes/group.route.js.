import express from "express";
//import { protectRoute } from "../middleware/auth.middleware.js";
import { getGlobalMessages, sendGlobalMessage } from "../controllers/group.controller.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/get", protectRoute, getGlobalMessages);
router.post("/send", protectRoute, sendGlobalMessage);

export default router;
