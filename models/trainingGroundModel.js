const mongoose = require("mongoose");

const trainingGroundSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Veuillez indiquer le propriétaire de ce lieu"],
    },
    city: {
      type: String,
      required: [true, "Veuillez sélectionner le gouvernorat"],
    },
    address: {
      type: String,
      required: [true, "Veuillez entrer l'emplacement d'entrainement "],
    },
    coordinates: {
      type: [Number],
      index: "2dsphere",
      required:false
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("TrainingGround", trainingGroundSchema);
