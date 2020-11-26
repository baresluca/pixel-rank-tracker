const {Pool} = require('pg');
// const client = new Client({
//   user: "postgres",
//   password: "root",
//   host: "localhost",
//   port: "5432",
//   database: "postgres"
// });

const pool = new Pool({
  'user': "postgres",
  'password': "root",
  'host': "localhost",
  'port': "5432",
  'database': "postgres",
  'max' : 20,
  'connectionTimeoutMillis': 0,
  'idleTimeoutMillis' : 0
});

async function addToDB(serpObject){

  googleRank = 1;
  for (const serp of serpObject){
    date = serp['date'];
    time = serp['time'];
    keyword = serp['keyword'];
    device = serp['device'];
    type = serp['element type'];
    organicType = serp['organic type']
    googleRank = googleRank;
    baseRank = serp['organic rank'];
    height = serp['height'];
    width = serp['width'];
    xPosition = serp['vertical position'];
    yPosition = serp['horizontal position'];
    url = serp['url'];
    const client = await pool.connect()
    await client.query("INSERT INTO pixel_rankings(ranking_date, time, keyword, device, type, organic_type, google_rank, base_rank, height, width, x_position, y_position, url)VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)", [date, time, keyword, device, type, organicType, googleRank, baseRank, height, width, xPosition, yPosition, url])
    .catch(e => console.log('insert error', e));
    client.release()
    googleRank++;
  }
  

}


module.exports = {
    addToDatabase: async function addToDatabase(serpObject){
      await addToDB(serpObject);
    },
    endPool: async function endPool(){
      pool.end()
    }
    
  };