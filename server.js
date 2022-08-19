const express = require("express");
// const fs = require("fs");
const path = require("path");
// const pg = require("pg");
const { Client } = require("pg");

const server = express();
server.use(express.static('public'))

const client = new Client({
  database: "user_data",
  user: "abhishek",
  password: "abhishek",
  host: "localhost",
  port: 5432,
});

async function createTable() {
  await client.connect();
  await client.query(`
      CREATE TABLE IF NOT EXISTS userdata(
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        username TEXT NOT NULL,
        age INT CHECK(age>0)
      );
    `);
}

createTable();

server.use(express.urlencoded({ extended: true }));

server.get("/", (request, response) => {
  response.sendFile(path.resolve("index.html"));
});

server.get("/about", (request, response) => {
  response.sendFile(path.resolve("about.html"));
});

server.get("/contact", (request, response) => {
  response.sendFile(path.resolve("contact.html"));
});

server.get("/signup", (request, response) => {
  response.sendFile(path.resolve("signup.html"));
});

server.post("/submit", (request, response) => {
  const data = request.body;
  const psqlQuery = "INSERT INTO userdata VALUES(DEFAULT, $1, $2, $3) RETURNING *";
  client.query(psqlQuery, [data.name, data.username, data.age]).then(() => {
      response.status(201);
  });
  client.query(`SELECT LASTVAL()`).then((result)=>{
    const id = (result.rows[0].lastval);
    response.redirect(`/all-users?id=${id}`);
  });
});

server.get("/all-users", (request, response) => {
  if(request.url.includes("page=")){
    let pageNo = request.query.page;
    if(pageNo<1){
      pageNo = 1;
    }
    const queryParam = (Number(pageNo)*5-5);
    const query = `SELECT * FROM userdata OFFSET ${queryParam} LIMIT 5`
    client.query(query).then((result) => {
      response.json(result.rows);
    });
  }
  else if(request.url.includes("id=")){
    const id = request.query.id;
    const query = `SELECT * FROM userdata WHERE id=${id}`
    client.query(query).then((result) => {
      response.json(result.rows);
    });
  }
  else{
    client.query("SELECT * FROM userdata").then((result) => {
      response.json(result.rows);
    });
  }
});

server.get("/all-users/:username", (request, response) => {
  const usernameParam = request.params.username;
  const psqlQuery = "SELECT * FROM userdata WHERE username= $1"
  client.query(psqlQuery, [usernameParam]).then((result) => {
    response.json(result.rows);
  });
});

server.listen(8000);