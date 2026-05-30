const express = require("express");
const router = express.Router();
const { login, signup, me } = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth");

router.post("/login", login);
router.post("/signup", signup);
router.get("/me", authenticate, me);

module.exports = router;
