const Statistic = require("../models/statisticModel");
const ErrorResponse = require("../utils/errorResponse");

exports.CreateStatistic = async (req, res, next) => {
  const statisticData = req.body;
  const { statisticName } = req.body;
  if (Object.keys(statisticData).length === 0) {
    return res.status(400).send({
      message: "Les champs de contenu des statistiques ne peut pas être vide",
    });
  }
  const existingStatistic = await Statistic.findOne({ statisticName });
  if (existingStatistic) {
    return next(new ErrorResponse("Statistique existe déjà.", 401));
  }
  const statistic = new Statistic(statisticData);
  statistic
    .save()
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message ||
          "Un problème est survenu lors de la création de l'invitation.",
      });
    });
};

// Retrieve all invitations from the database.
exports.findAllStatistic = async (req, res) => {
  try {
    const PAGE_SIZE = 3;
    const page = parseInt(req.query.page) || "0";
    const total = await Statistic.countDocuments({});
    const statistic = await Statistic.find({})
      .limit(PAGE_SIZE)
      .skip(PAGE_SIZE * page);
    res.json({
      totalpages: Math.ceil(total / PAGE_SIZE),
      statistic,
    });
    // const limit = req.query.limit * 1 || 100;
  } catch (err) {
    res.status(500).send({
      message:
        err.message ||
        "Un problème est survenu lors de la récupération des statistiques.",
    });
  }
};

// Find a single invitation with a invitationId
exports.findSingleStatistic = (req, res) => {
  Statistic.findById(req.params.statisticId)
    .then((stat) => {
      if (!stat) {
        return res.status(404).send({
          message:
            "statistique non trouvée avec l'id " + req.params.statisticId,
        });
      }
      res.send(stat);
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message:
            "statistique non trouvée avec l'id  " + req.params.statisticId,
        });
      }
      return res.status(500).send({
        message:
          "Un problème est survenu lors de la récupération de la statistique avec l'id " +
          req.params.statisticId,
      });
    });
};

// Update a invitation
exports.updateStatistic = (req, res) => {
  // Validate Request
  if (Object.keys(req.body).length === 0) {
    return res.status(400).send({
      message: "Les champs de contenu des statistiques ne peut pas être vide",
    });
  }

  // Find and update invitation with the request body
  Statistic.findByIdAndUpdate(req.params.statisticId, req.body, { new: true })
    .then((stat) => {
      if (!stat) {
        return res.status(404).send({
          message: "Statistique non trouvée avec id " + req.params.statisticId,
        });
      }
      res.send(stat);
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message: "Statistique non trouvée avec id  " + req.params.statisticId,
        });
      }
      return res.status(500).send({
        message:
          "Un problème est survenu lors de la mise à jour de la statistique avec l'id" +
          req.params.statisticId,
      });
    });
};

// Delete a note with the specified Id in the request
exports.deleteStatistic = (req, res) => {
  Statistic.findByIdAndRemove(req.params.statisticId)
    .then((stat) => {
      if (!stat) {
        return res.status(404).send({
          message: "Statistique non trouvée avec id " + req.params.statisticId,
        });
      }
      res.send({ message: "Statistique supprimé avec succès !" });
    })
    .catch((err) => {
      if (err.kind === "ObjectId" || err.name === "NotFound") {
        return res.status(404).send({
          message: "statistique non trouvée avec id" + req.params.statisticId,
        });
      }
      return res.status(500).send({
        message: "statistique non trouvée avec id " + req.params.statisticId,
      });
    });
};
