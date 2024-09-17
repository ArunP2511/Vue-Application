// import expressjs
const express = require("express");
const myApp = express();
// import cors drivers for cross origin
const cors = require("cors");
const corsValue = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: true,
};
myApp.use(cors(corsValue));
//import the neo4j driver
const myneo4j = require("neo4j-driver");

myApp.get("/data", async (req, res) => {
  try {
    // neo4j Aura database connection details
    NEO4J_URI = "neo4j+s://9ed55a1a.databases.neo4j.io";
    NEO4J_USERNAME = "neo4j";
    NEO4J_PASSWORD = "Cq-8P2z7oImWyUbVMJIS8_-q23OAGnFeLZeB1JpiIO4";
    // Create a driver instance, for the specified Neo4j instance
    const myDriver = myneo4j.driver(
      NEO4J_URI,
      myneo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD)
    );
    //create a session
    const mySession = myDriver.session();
    //give a cypher query to get the data from neo4j
    const myQuery = `MATCH(n:Entity)
                       OPTIONAL MATCH (n)<-[:PARENT]-(p:Entity)
                       RETURN n.name AS name, n.description AS description, COALESCE(p.name, '') AS parent
                       ORDER BY n.name`;
    //run the query through the session 
    const myResult = await mySession.run(myQuery);
    const myData = myResult.records.map((record) => ({
      name: record.get("name"),
      description: record.get("description"),
      parent: record.get("parent"),
    }));
    // return the result
    res.json(myData);
    //close the session
    await mySession.close();
    //close the driver
    await myDriver.close();
  } catch (error) {
    res.status(500).json({ error: "Error while fetching data from neo4j" });
  }
});

myApp.listen(3100, () => {
  console.log("server started and listening to port 3100");
});
