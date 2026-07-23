const express = require("express");

const router = express.Router();

const PublisherController = require("../controllers/PublisherController");

const verifyToken = require("../middleware/auth.middleware");

const { isAdmin, isStaffOrAdmin } = require("../middleware/role.middleware");

router.use(verifyToken);

router.get("/", isStaffOrAdmin, PublisherController.getAllPublishers);

router.get("/:id", isStaffOrAdmin, PublisherController.getPublisherById);

router.post("/", isAdmin, PublisherController.createPublisher);

router.put("/:id", isAdmin, PublisherController.updatePublisher);

router.delete("/:id", isAdmin, PublisherController.deletePublisher);

module.exports = router;
