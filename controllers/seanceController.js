const Schedular = require("node-schedule");
const admin = require("firebase-admin");
const Seance = require("../models/seanceModel");
const Notification = require("../models/notificationModel");
const sendEmail = require("../utils/sendEmail");
var jsrender = require("jsrender");
const dateToCron = (date) => {
  const minutes = date.getMinutes();
  const hours = date.getHours() - 1;
  const days = date.getDate() - 1;
  const months = date.getMonth() + 1;

  return `${minutes} ${hours} ${days} ${months} ${"*"}`;
};
//Create new Seance
exports.createSeance = (req, res) => {
  // Request validation
  var seanceData = req.body;
  if (Object.keys(req.body).length === 0) {
    return res.status(400).send({
      message: "Seance content can not be empty",
    });
  }

  // Create a Seance
  const seance = new Seance(seanceData);
  // Save Seance in the database
  seance.save().then((data) => {
    const template = jsrender.templates("./templates/programmerSeance.html");
    console.log(seance?.dateSeance);
    const date = new Date(seance?.dateSeance);
    const cron = dateToCron(date);
    Seance.findById(seance?._id)
      .populate("statistics.statistic")
      .populate("skills.skill")
      .populate("creactedBy")
      .populate("programme")
      .populate("player")
      .populate("trainingGround")
      .sort("dateSeance")
      .then((data) => {
        var porgrammedDate = date?.toISOString().slice(0, 10);
        const message = template.render({
          P_firstname: data?.player?.firstName,
          P_lastname: data?.player?.lastName,
          C_firstname: data?.creactedBy?.firstName,
          C_lastname: data?.creactedBy?.lastName,
          date: porgrammedDate,
          programme: data?.programme?.title,
          description: data?.programme?.description,
          lieu: data?.trainingGround?.city,
          adresse: data?.trainingGround?.address,
        });
        res.send(data);
        Schedular.scheduleJob(cron, async function () {
          try {
            sendEmail({
              email: data.player.email,
              subject: "Séance programmée ",
              message,
            });
            console.log("email sent");
          } catch (err) {
            return next(new ErrorResponse("Email n'a pas pu être envoyé", 500));
          }
        });
      })
      .catch((err) => {
        res.status(500).send({
          message: err.message || "Something wrong while creating the seance.",
        });
      });
  });
};
exports.cancelSession = (req, res) => {
  if (Object.keys(req.body).length === 0) {
    return res.status(400).send({
      message: "Seance content can not be empty",
    });
  }

  Seance.findByIdAndUpdate(req.params.seanceId, req.body, { new: true })
    .populate("creactedBy")
    .populate({
      path: 'player',
      select: 'fcm_key'
    })
    .exec()
    .then(async (seance) => {
      if (!seance) {
        return res.status(404).send({
          message: "Seance not found with id " + req.params.seanceId,
        });
      }
      const template = jsrender.templates("./templates/annulerSeance.html");

      const message = template.render({
        P_firstname: seance?.player?.firstName,
        P_lastname: seance?.player?.lastName,
        C_firstname: seanceData?.creactedBy?.firstName,
        C_lastname: seanceData?.creactedBy?.lastName,
        date: seance?.dateSeance.toISOString().slice(0, 10),
        raison: seance?.sessionCancelled?.reason,
      });
      const notificationData = {
        title: "Session cancelled!",
        description: `${seanceData?.creactedBy?.firstName} ${seanceData?.creactedBy?.lastName} has canceled the session scheduled for ${seance?.dateSeance.toISOString().slice(0, 10)} for the following reason : ${seance?.sessionCancelled?.reason} `,
        createdBy: seanceData?.creactedBy?._id,
        assignedTo: seance?.player?._id,
        targetScreen: "CLAIM_DETAIL",
        data: seance,
      };

      await Notification.create(notificationData);
      await admin.messaging().sendMulticast({
        tokens: seance?.player?.fcm_key,
        notification: {
          title: "Session cancelled!",
          body: `${seanceData?.creactedBy?.firstName} ${seanceData?.creactedBy?.lastName} has canceled the session scheduled for ${seance?.dateSeance.toISOString().slice(0, 10)} for the following reason : ${seance?.sessionCancelled?.reason} `,
        },
        android: {
          priority: "high",
        },
      });
      
      try {
        sendEmail({
          email: seance.player.email,
          subject: "Annulation Séance ",
          message,
        });
      } catch (err) {
        return next(new ErrorResponse("Email n'a pas pu être envoyé", 500));
      }
      return res.send(seance);
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message: "Seance not found with id " + req.params.seanceId,
        });
      }
      return res.status(500).send({
        message: "Something wrong updating note with id " + req.params.seanceId,
      });
    });
};

// Retrieve all seances from the database.
exports.findAllSeance = (req, res) => {
  const data = req.query;
  Seance.find(data)
    .populate("statistics.statistic")
    .populate("skills.skill")
    .populate("creactedBy")
    .populate("programme")
    .populate("player")
    .populate("trainingGround")
    .sort("dateSeance")
    .then((seances) => {
      res.send(seances);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Something wrong while retrieving seances.",
      });
    });
};

// Find a single seance with a seanceId
exports.findSeance = (req, res) => {
  Seance.findById(req.params.seanceId)
    .populate("statistics.statistic")
    .populate("skills.skill")
    .populate("player")
    .populate("creactedBy")
    .populate("trainingGround")
    .populate("programme")
    .then((seance) => {
      if (!seance) {
        return res.status(404).send({
          message: "Seance not found with id " + req.params.seanceId,
        });
      }
      res.send(seance);
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message: "Seance not found with id " + req.params.seanceId,
        });
      }
      return res.status(500).send({
        message:
          "Something wrong retrieving seance with id " + req.params.seanceId,
      });
    });
};

// Update a seance
exports.updateSeance = (req, res) => {
  // Validate Request
  if (Object.keys(req.body).length === 0) {
    return res.status(400).send({
      message: "Seance content can not be empty",
    });
  }

  // Find and update seance with the request body
  Seance.findByIdAndUpdate(req.params.seanceId, req.body, { new: true })
    .then((seance) => {
      if (!seance) {
        return res.status(404).send({
          message: "Seance not found with id " + req.params.seanceId,
        });
      }
      res.send(seance);
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message: "Seance not found with id " + req.params.seanceId,
        });
      }
      return res.status(500).send({
        message: "Something wrong updating note with id " + req.params.seanceId,
      });
    });
};

// Delete a note with the specified Id in the request
exports.deleteSeance = (req, res) => {
  Seance.findByIdAndRemove(req.params.seanceId)
    .then((seance) => {
      if (!seance) {
        return res.status(404).send({
          message: "Seance not found with id " + req.params.seanceId,
        });
      }
      res.send({ message: "Seance deleted successfully!" });
    })
    .catch((err) => {
      if (err.kind === "ObjectId" || err.name === "NotFound") {
        return res.status(404).send({
          message: "Seance not found with id " + req.params.seanceId,
        });
      }
      return res.status(500).send({
        message: "Could not delete seance with id " + req.params.seanceId,
      });
    });
};

// get all seance by date , player
exports.findMySeance = (req, res) => {
  const data = req.query;
  Seance.find({
    player: req.params.playerId,
    dateSeance: {
      $gte: new Date(data.from).toISOString(),
      $lt: new Date(data.to).toISOString(),
    },
  })
    .populate("statistics.statistic")
    .populate("skills.skill")
    .populate("creactedBy")
    .populate("programme")
    .populate("trainingGround")
    .sort("dateSeance")
    .then((seances) => {
      res.send(seances);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Something wrong while retrieving seances.",
      });
    });
};
