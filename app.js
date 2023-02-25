const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjToResponseObj = (dbObj) => {
  return {
    stateId: dbObj.state_id,
    stateName: dbObj.state_name,
    population: dbObj.population,
  };
};

const convertDbObjToResponseObj2 = (dbObj) => {
  return {
    districtId: dbObj.district_id,
    districtName: dbObj.district_name,
    stateId: dbObj.state_id,
    cases: dbObj.cases,
    cured: dbObj.cured,
    active: dbObj.active,
    deaths: dbObj.deaths,
  };
};

//API 1
app.get("/states/", async (request, response) => {
  const dbQuery = `
    SELECT 
        *
    FROM 
        state;`;
  const dbResponse = await db.all(dbQuery);
  response.send(dbResponse.map((dbo) => convertDbObjToResponseObj(dbo)));
});

//API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const dbQuery = `
    SELECT 
        *
    FROM 
        state
    WHERE 
        state_id = ${stateId};`;
  const dbResponse = await db.get(dbQuery);
  response.send(convertDbObjToResponseObj(dbResponse));
});

//API 3
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const dbQuery = `
    INSERT INTO 
        district (district_name, state_id, cases, cured, active, deaths)
    VALUES
        (
            '${districtName}', 
            ${stateId},
            ${cases},
            ${cured},
            ${active},
            ${deaths}
        );`;
  const dbResponse = await db.run(dbQuery);
  response.send("District Successfully Added");
});

//API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const dbQuery = `
    SELECT 
        *
    FROM
        district
    WHERE 
        district_id = ${districtId};`;
  const dbResponse = await db.get(dbQuery);
  response.send(convertDbObjToResponseObj2(dbResponse));
});

//API 5
app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const dbQuery = `
    DELETE FROM
        district 
    WHERE 
        district_id = ${districtId};`;
  await db.run(dbQuery);
  response.send("District Removed");
});

//API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const dbQuery = `
  UPDATE 
    district
    SET
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
    WHERE 
        district_id = ${districtId};`;
  await db.run(dbQuery);
  response.send("District Details Updated");
});

//API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const dbQuery = `
    SELECT 
        SUM(cases),
        SUM(cured),
        SUM(active),
        SUM(deaths)
    FROM 
        district
    WHERE 
        state_id = ${stateId};`;
  const dbResponse = await db.get(dbQuery);
  response.send({
    totalCases: dbResponse["SUM(cases)"],
    totalCured: dbResponse["SUM(cured)"],
    totalActive: dbResponse["SUM(active)"],
    totalDeaths: dbResponse["SUM(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const dbQuery = `
    SELECT 
        state_name
    FROM 
        district NATURAL JOIN state
    WHERE 
        district_id = ${districtId};`;
  const dbResponse = await db.get(dbQuery);
  response.send(convertDbObjToResponseObj(dbResponse));
});

module.exports = app;
