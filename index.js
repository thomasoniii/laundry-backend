const { StreamCamera, Codec, StillCamera, Rotation } = require('pi-camera-connect');
const fs         = require('fs');
var path         = require('path');
const express    = require('express');
const bodyParser = require('body-parser');
const cors       = require('cors');
const Jimp       = require('jimp');

const app = express();

app.use(bodyParser.json());
app.use(cors());

const CONFIG_FILE = './config.json';
const MACHINES    = ['washer', 'dryer'];
const PORT = 3000;

app.use(express.static('public'));

app.get('/image', async (req, res) => {
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

app.get('/status', (req, res) => {
  fs.readFile(
    CONFIG_FILE,
    (err, data) => {
      if (err) {
        res.status(500);
        res.send(`Config save failure: ${err.message}`);
      }
      else {
        const config = JSON.parse(data);
        Jimp.read(`http://localhost:${PORT}/image`)
          .then( async laundry => {

            let status = { default : { washer : config.washer.colors, dryer : config.dryer.colors }, current : {} };

            MACHINES.forEach(machine => {
              const machineState = config[machine];
              let colors = {r : 0, g : 0, b : 0};
              let pixels = 0;
              for (let x = machineState.x; x <= machineState.x + machineState.width; x++) {
                for (let y = machineState.y; y <= machineState.y + machineState.height; y++) {
                  const pixel = Jimp.intToRGBA(laundry.getPixelColor(x, y));
                  colors.r += pixel.r;
                  colors.g += pixel.g;
                  colors.b += pixel.b;
                  pixels++;
                }
              }

              colors.r = Math.round(colors.r / pixels);
              colors.g = Math.round(colors.g / pixels);
              colors.b = Math.round(colors.b / pixels);

              status.current[machine] = colors;

              if (
                   colors.r > machineState.colors.r + 20
                || colors.g > machineState.colors.g + 20
                || colors.b > machineState.colors.b + 20) {
                  status[machine] = 'running';
              }
              else {
                status[machine] = 'stopped';
              }

          });

          res.send(status);
        })
        .catch(err => {
          res.status(500);
          res.send(`Could not load image: ${err.message}`);
        });
      }
    }
  );
});

app.listen(PORT, () => console.log(`Listening on ${PORT}!`));
