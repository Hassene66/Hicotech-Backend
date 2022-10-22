require("express-async-errors");
require("dotenv").config();

const YAML = require("yamljs");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = YAML.load("swagger.yaml");

// process.on("uncaughtException", (err) => {
//   console.log(err.name, err.message);
//   process.exit(1);
// });
const ConnectDB = require("./config/db");
const { createServer } = require("./utils/serverUtils");
ConnectDB();

const app = createServer();
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () =>
  console.log(`server listening at port ${PORT} `)
);
// process.on("unhandledRejection", (err) => {
//   console.log(err.name, err.message);
//   server.close(() => {
//     process.exit(1);
//   });
// });
