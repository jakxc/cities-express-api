var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "City Express Api" });
});


router.get("/api/city", async (req, res, next) => {
  const validQueries = ["name", "countryCode", "district", "page"];
  const allQueries = req.query;
  const invalidQueries = Object.keys(allQueries).filter(query => !validQueries.includes(query));
  const limit = 20;

  let { name, countryCode, district, page } = allQueries;
  page = page || 1;

  try {
    if (invalidQueries.length > 0) {
      let error = new Error(`Invalid query parameters: ${invalidQueries.join(", ")}.`);
      error.status = 400;
      throw error;
    }

    if (parseInt(page) < 0) {
      let error = new Error(`Invalid page number: ${page}.`);
      error.status = 400;
      throw error;
    }

    if (countryCode || name || district) {
      const results = [];

      const countObj = await req.db("city")
      .where((builder) => {
        if (countryCode) {
          builder.where('city.CountryCode', '=', countryCode);
        }

        if (name) {
          builder.where('city.Name', '=', name);
        }

        if (district) {
          builder.where("city.District", "=", district)
        }
      })
      .count("name as count");

      const totalCount = countObj.map(el => el["count"]).reduce((acc, curr) => acc + curr, 0);

      const joinedTable = await req.db("city")
      .join("country", "city.CountryCode", "=", "country.Code")
      .select("city.Name", "city.CountryCode", "city.District", "country.Name as Country", "country.Continent", "city.Population as CityPopulation")
      .where((builder) => {
        if (countryCode) {
          builder.where('city.CountryCode', '=', countryCode);
        }

        if (name) {
          builder.where('city.Name', '=', name);
        }

        if (district) {
          builder.where("city.District", "=", district)
        }
      })
      .offset((parseInt(page) - 1) * limit)
      .limit(limit)
      
      joinedTable.forEach(row => {
        const obj = { 
          Name: row.Name, 
          Country: row.Country, 
          District: row.District, 
          Continent: row.Continent, 
          Population: row.CityPopulation 
        }
        results.push(obj);
      })

      const pagination = {
        totalResults: totalCount,  
        perPage: limit > totalCount ? totalCount: limit, 
        currentPage: page || 1, 
        prev: parseInt(page) <= 1 ? null : page - 1,
        next: parseInt(page) >= Math.ceil(totalCount / limit) ? null : parseInt(page) + 1
      }

      res.json({ 
        Error: false, 
        Message: "Success", 
        results: results, 
        pagination: pagination
      });
    } else {
      req.db
      .from("city")
      .select("name", "district")
      .limit(limit)
      .then((rows) => {
        res.json({ Error: false, Message: "Success", results: rows});
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