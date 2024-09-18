const request = require("supertest");
const express = require("express");
const cors = require("cors");
const neo4j = require("neo4j-driver");

jest.mock("neo4j-driver");

const app = express();

app.use(
  cors({
    origin: "*",
    credentials: true,
    optionSuccessStatus: true,
  })
);

app.get("/data", async (req, res) => {
  try {
    const driver = neo4j.driver.mockReturnValue({
      session: jest.fn(() => ({
        run: jest.fn().mockResolvedValue({
          records: [
            { get: (key) => (key === "name" ? "Entity1" : "ParentEntity") },
            { get: (key) => (key === "description" ? "Description1" : "") },
          ],
        }),
        close: jest.fn(),
      })),
      close: jest.fn(),
    });
    const session = driver.session();
    const query = `MATCH(n:Entity)
                     OPTIONAL MATCH (n)<-[:PARENT]-(p:Entity)
                     RETURN n.name AS name, n.description AS description, COALESCE(p.name, '') AS parent
                     ORDER BY n.name`;

    const result = await session.run(query);
    const data = result.records.map((record) => ({
      name: record.get("name"),
      description: record.get("description"),
      parent: record.get("parent"),
    }));

    res.json(data);
    await session.close();
    await driver.close();
  } catch (error) {
    res.status(500).json({ error: "Error while fetching data from neo4j" });
  }
});

describe("/data", () => {
  it("must return graph data from the neo4j database", async () => {
    const res = await request(app).get("/data");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([
      { name: "Entity1", description: "Description1", parent: "ParentEntity" },
    ]);
  });

  it("should handle errors while fetching data from neo4j", async () => {
    // Force an error in the Neo4j query
    neo4j.driver.mockReturnValueOnce({
      session: jest.fn(() => ({
        run: jest.fn().mockRejectedValue(new Error("Query error")),
        close: jest.fn(),
      })),
      close: jest.fn(),
    });

    const res = await request(app).get("/data");
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: "Error while fetching data from neo4j" });
  });
});
