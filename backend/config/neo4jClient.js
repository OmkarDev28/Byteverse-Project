
import dotenv from "dotenv";
dotenv.config();

import neo4j from "neo4j-driver";

const URI = process.env.NEO4J_URI;
const USER = process.env.NEO4J_USERNAME;
const PASSWORD = process.env.NEO4J_PASSWORD;

if (!URI || !USER || !PASSWORD) {
  throw new Error('Missing Neo4j credentials. Check your .env file.');
}

const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));


driver.verifyConnectivity()
  .then(() => console.log('Successfully connected to Neo4j.'))
  .catch((error) => console.error('Neo4j connection error:', error));


export default driver;