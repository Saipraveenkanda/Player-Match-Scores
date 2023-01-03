const express = require("express");
const { open } = require("sqlite");
const app = express();
app.use(express.json());
const path = require("path");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`Db Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertDbObjToRespObj = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

// GET ALL PLAYERS API 1
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT *
    FROM player_details;`;
  const playersList = await db.all(getPlayersQuery);
  let playersArray = [];
  for (let eachPlayer of playersList) {
    const converted = convertDbObjToRespObj(eachPlayer);
    playersArray.push(converted);
  }
  response.send(playersArray);
});

//GET PLAYER BASED ON PLAYER ID API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
  SELECT *
  FROM player_details
  WHERE player_id = ${playerId};`;

  const dbResponse = await db.get(getPlayerQuery);
  const converted = convertDbObjToRespObj(dbResponse);
  response.send(converted);
});

//UPDATE PLAYER BASED ON PLAYER ID API 3
app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
  UPDATE
  player_details
  SET
    player_name = '${playerName}'
  WHERE player_id = ${playerId};`;

  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

const convertDbObjToRespObjMatch = (matchDetail) => {
  return {
    matchId: matchDetail.match_id,
    match: matchDetail.match,
    year: matchDetail.year,
  };
};

//MATCH DETAILS OF SPECIFIC MATCH API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
  SELECT *
  FROM 
    match_details
  WHERE match_id = ${matchId};`;

  const matchDetail = await db.get(getMatchDetailsQuery);
  console.log(matchDetail);
  const converted = convertDbObjToRespObjMatch(matchDetail);
  response.send(converted);
});

const convertDbTORespTemp = (dbObj) => {
  return {
    matchId: dbObj.match_id,
    match: dbObj.match,
    year: dbObj.year,
  };
};

//ALL MATCHES OF A PLAYER API 5
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchDetailsQuery = `
  SELECT 
    *
  FROM
  player_match_score
    NATURAL JOIN match_details
  WHERE 
    player_id = ${playerId};`;

  const matchesList = await db.all(getMatchDetailsQuery);
  response.send(matchesList.map((eachMatch) => convertDbTORespTemp(eachMatch)));
});

const convertDbTORespApi6 = (eachPlayer) => {
  return {
    playerId: eachPlayer.player_id,
    playerName: eachPlayer.player_name,
  };
};

//List of players of specific match API 6
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const listOfPlayersQuery = `
  SELECT 
    *
  FROM
    player_match_score
  NATURAL JOIN player_details
  WHERE 
    match_id = ${matchId}`;

  const playersList = await db.all(listOfPlayersQuery);
  response.send(
    playersList.map((eachObject) => convertDbTORespApi6(eachObject))
  );
});

//STATISTICS OF SPECIFIC PLAYER API 7
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getStatisticsQuery = `
    SELECT 
        player_id AS playerId,
        player_name AS playerName,
        SUM(score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes
    FROM player_match_score
    NATURAL JOIN player_details
    WHERE 
    player_id = ${playerId}
    `;
  const respObject = await db.get(getStatisticsQuery);
  response.send(respObject);
});

module.exports = app;
