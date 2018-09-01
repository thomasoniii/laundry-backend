const fs         = require('fs');
var path         = require('path');
const express    = require('express');
const bodyParser = require('body-parser');
const cors       = require('cors');

const app = express();

app.use(bodyParser.json());
app.use(cors());

const CONFIG_FILE = './config.json';

app.use(express.static('public'));

app.get('/configimage', async (req, res) => {
        res.contentType('image/jpeg');

        const stillCamera = new StillCamera( { rotation : Rotation.Rotate270, width : 959, height : 720 } );

        const image = await stillCamera.takeImage();

        res.send(image);
});


app.get('/config', async(req, res) => {
  fs.readFile(
    CONFIG_FILE,
    (err, data) => {
      if (err) {
        res.status(500);
        res.send(`Config save failure: ${err.message}`);
      }
      else {
        res.send(JSON.parse(data));
      }
    }
  );
});

app.post('/config', (req, res) => {
  fs.writeFile(
    CONFIG_FILE,
    JSON.stringify(req.body),
    (err) => {
      if (err) {
        res.status(500);
        res.send(`Config save failure: ${err.message}`);
      }
      else {
        res.send(true);
      }
    }
  );

});

app.listen(3001, () => console.log('Listening on 3001!'));
