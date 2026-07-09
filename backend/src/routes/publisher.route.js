const express = require("express");

const router = express.Router();

const PublisherController = require("../controllers/PublisherController");

const verifyToken = require("../middleware/auth.middleware");

const { isAdmin } = require("../middleware/role.middleware");

router.get("/", PublisherController.getAllPublishers);

router.get("/:id", PublisherController.getPublisherById);

router.post("/", verifyToken, isAdmin, PublisherController.createPublisher);

router.put("/:id", verifyToken, isAdmin, PublisherController.updatePublisher);

router.delete(
  "/:id",
  verifyToken,
  isAdmin,
  PublisherController.deletePublisher,
);

module.exports = router;
