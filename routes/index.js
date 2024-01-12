var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "City Express Api" });
});


router.get("/api/city", function (req, res, next) {
  const validQueries = ["name", "countryCode", "district", "limit"];
  const allQueries = req.query;
  const invalidQueries = Object.keys(allQueries).filter(query => !validQueries.includes(query));
  console.log(allQueries);

  const { name, countryCode, district, limit } = allQueries;
  limit = limit || 20;

  try {
    if (invalidQueries.length > 0) {
      let error = new Error(`Invalid query parameters: ${invalidQueries.join(", ")}. Query parameters are not permitted.`);
      error.status = 400;
      throw error;
    }

    if (countryCode || name || district) {
      req.db
      .from('city')
      .select('*')
      .where((builder) => {
        if (countryCode) {
          builder.where('CountryCode', '=', countryCode);
        }

        if (name) {
          builder.where('Name', '=', name);
        }

        if (district) {
          builder.where("District", "=", district)
        }
      })
      .orderBy('Name')
      .offset(0)
      .limit(limit)
      .then((rows) => {
        res.json({ Error: false, Message: 'Success', City: rows });
      })
      .catch((err) => res.json({ Error: true, Message: 'Error in MySQL query' }));
    } else {
      req.db
      .from("city")
      .select("name", "district")
      .limit(limit)
      .then((rows) => {
        res.json({ Error: false, Message: "Success", City: rows });
      })
      .catch((err) => {
        console.log(err);
        res.json({ Error: true, Message: "Error in MySQL query" });
      });
    }
  } catch (e) {
    next(e);
  }
});


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

router.post('/api/update', (req, res) => {
  const city = req.body.City;
  const countryCode = req.body.CountryCode;
  const pop = req.body.Pop
  if (!city || !countryCode || !pop) {
      res.status(400).json({ message: `Error updating population` });
      console.log(`Error on request body:`, JSON.stringify(req.body));
  } else { 
    req.db('city').where({"Name": city, "CountryCode": countryCode}).update({
      "Population": pop
    })
      .then(_ => {
      res.status(201).json({ message: `Successful update ${city}`});
      console.log(`successful population update:`, JSON.stringify({"Population": pop}));
    }).catch(error => {
      console.log(error);
      res.status(500).json({ message: 'Database error - not updated' });
    })
  } 
});

module.exports = router;