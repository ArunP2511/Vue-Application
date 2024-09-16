const express = require("express");
const myApp = express();

const cors = require("cors");
const corsValue = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: true,
};
myApp.use(cors(corsValue));

const myneo4j = require("neo4j-driver");

myApp.get("/data", async (req, res) => {
  try {
    NEO4J_URI = "neo4j+s://9ed55a1a.databases.neo4j.io";
    NEO4J_USERNAME = "neo4j";
    NEO4J_PASSWORD = "Cq-8P2z7oImWyUbVMJIS8_-q23OAGnFeLZeB1JpiIO4";
    const myDriver = myneo4j.driver(
      NEO4J_URI,
      myneo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD)
    );
    const mySession = myDriver.session();
    const myQuery = `MATCH(n:Entity)
                       OPTIONAL MATCH (n)<-[:PARENT]-(p:Entity)
                       RETURN n.name AS name, n.description AS description, COALESCE(p.name, '') AS parent
                       ORDER BY n.name`;
    const myResult = await mySession.run(myQuery);
    const myData = myResult.records.map((record) => ({
      name: record.get("name"),
      description: record.get("description"),
      parent: record.get("parent"),
    }));
    res.json(myData);
    await mySession.close();
    await myDriver.close();
  } catch (error) {
    res.status(500).json({ error: "Error while fetching data from neo4j" });
  }
});

myApp.listen(3100, () => {
  console.log("server started and listening to port 3100");
});
