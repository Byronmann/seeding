const { MongoClient } = require("mongodb");
const { queries } = require("./database/queries");

async function run() {
  const client = new MongoClient("mongodb://127.0.0.1:27017");

  await client.connect();
  const db = client.db("apple_music_db");

  const result = await db
    .collection("streams")
    .aggregate(queries.heavyUsersBadBunny)
    .toArray();

  console.log(result);
  client.close();
}

run();
