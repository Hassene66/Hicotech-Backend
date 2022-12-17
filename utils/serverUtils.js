const auth = require("../routes/api/authRoutes");
const errorHandler = require("../middleware/errorMiddleware");
const users = require("../routes/api/usersRoutes");
const discipline = require("../routes/api/disciplinesRoutes");
const invitations = require("../routes/api/InvitationsRoutes");
const statistique = require("../routes/api/statisticRoutes");
const defis = require("../routes/api/defiRoutes");
const events = require("../routes/api/eventRoutes");
const competence = require("../routes/api/skillRoutes");
const trainingGround = require("../routes/api/trainingGroundRoutes");
const programme = require("../routes/api/programmeRoutes");
const seance = require("../routes/api/seanceRoutes");
const assignChallenge = require("../routes/api/assignChallengeRoutes");
const abonnement = require("../routes/api/subscriptionRoutes");
const statisticObjective = require("../routes/api/statisticobjectiveRoutes");
const skillObjective = require("../routes/api/skillObjectiveRoutes");
const alert = require("../routes/api/alertRoutes");
const notification = require("../routes/api/notificationRoutes");


const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const createServer = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(cors());

  app.use(
    "/api",
    auth,
    users,
    discipline,
    invitations,
    statistique,
    trainingGround,
    programme,
    competence,
    defis,
    seance,
    events,
    abonnement,
    assignChallenge,
    alert,
    statisticObjective,
    skillObjective,
    notification
  );

  app.use(errorHandler);

  app.all("/api/*", (req, res) => {
    res.status(404).json({
      message: `Impossible de trouver le route ${req.originalUrl} `,
    });
  });
  return app;
};
module.exports = { createServer };
