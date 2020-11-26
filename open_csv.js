const parse = require('csv-parser');
const fs = require('fs');





module.exports = {
    getKeywords: function getKeywords(fileName){
        let data = fs.readFileSync(fileName)
            .toString() // convert Buffer to string
            .split('\n') // split string to lines
            .map(e => e.trim()) // remove white spaces for each line
            .map(e => e.split(',').map(e => e.trim()));
        return data
    }
  };