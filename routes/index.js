var express = require("express");
var router = express.Router();
const { getCitiesFromDB, updateCityPopulation } = require("../middleware/city.js")

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "City Express Api" });
});


router.get("/api/city", getCitiesFromDB);


// router.get("/api/city/:CountryCode", function (req, res, next) {
//   req.db
//     .from("city")
//     .select("*")
//     .where("CountryCode", "=", req.params.CountryCode)
//     .then((rows) => {
//       res.json({ Error: false, Message: "Success", City: rows });
//     })
//     .catch((err) => {
//       console.log(err);
//       res.json({ Error: true, Message: "Error in MySQL query" });
//     });
// });

router.post('/api/update', updateCityPopulation);

module.exports = router;