/**
 *Retrieves data for cities that matches name, country code or district parameters from request url
 *
 * @param {obj} req The request object
 * @param {obj} res The response object
 * @param {obj} next Method to move to next middleware
 */
const getCitiesFromDB = async (req, res, next) => {
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
            CountryCode: row.CountryCode,
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
    } catch (e) {
      next(e);
    }
}

/**
 *Updates population for cities that matches name and country code from request url
 *
 * @param {obj} req The request object
 * @param {obj} res The response object
 * @param {obj} next Method to move to next middleware
 */
const updateCityPopulation = (req, res, next) => {
    const city = req.body.City;
    const countryCode = req.body.CountryCode;
    const pop = req.body.Pop
    if (!city || !countryCode || !pop) {
        let error = new Error("Error updating population");
        error.status = 400;
        throw error;
    } else { 
      req.db('city').where({"Name": city, "CountryCode": countryCode}).update({
        "Population": pop
      })
        .then(_ => {
        res.status(201).json({ message: `Successfully updated ${city} population to ${pop}`});
      }).catch(e => {
        next(e);
      })
    } 
}


module.exports = {
    getCitiesFromDB: getCitiesFromDB,
    updateCityPopulation: updateCityPopulation
}
