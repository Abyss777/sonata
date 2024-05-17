
const strip = require('strip-passwords');
// const helper = require('./../../../../../api/manage/helper');
const config = require('config');
const path = require('path');
const fs = require('fs');

module.exports = (Device, RequestLog, template, helpers) => {
  /**
  *
  * @param {Object} req
  * @param {Object} res
  */
  function get(req, res) {
    console.log('request token + mac');
    console.log('request params:', req.params);
    console.log('request user-agent:', req.headers['user-agent']);
    console.log('remote ip:', req.remote_ip);
    console.log('remote ip info:', req.ipInfo);

    const log = new RequestLog({
      ip: req.remote_ip,
      request: 'token+mac',
      userAgent: req.headers['user-agent'],
      token: req.params.token,
    });

    const token = req.params.token;
    console.log('token:', token);

    const file = req.params.file;
    console.log('file:', file);

    const mac = helpers.mac.getMacFromFile(file);
    console.log('mac:', mac);

    const requestInfo = {
      remote_ip: req.remote_ip,
      mac,
    };

    let filePath = path.resolve(config.templates.path, token, file);
    if (!fs.existsSync(filePath)) {
      console.log('raw file:', filePath, ' not found, looking for device');
    } else {
      console.log('raw file:', filePath, ' found, return it');
      const rawFile = fs.readFileSync(filePath);
      log.status = 'OK';
      res.status(200).type('text/plain').send(rawFile.toString('utf8'));
      return;
    }

    (() => {
      return new Promise((resolve, reject) => {
        if (mac) {
          resolve(mac);
        } else {
          reject(new Error('no mac'));
        }
      });
    })()
        .then((mac) => {
          return Device.findOne({token, mac});
        })
        .then((device) => {
          console.log('db find:', strip(device));
          if (!device) return Promise.reject(new Error('no device'));

          return helpers.rules.ruleVerification(device, requestInfo);
        })
        .then((device) => {
          const t = template.template(device);
          console.log('vendor', device.vendor);
          // console.log('config template', t);
          log.status = 'OK';
          res.status(200).type('application/xml').send(t);
        })
        .catch((err) => {
          log.status = 'FAIL';
          console.log('error', err);
          res.status(404).send();
        })
        .then(() => {
          log.save();
        })
        .catch((err) => {
          console.log('error', err);
        });
  }

  get.apiDoc = {
    description: 'get by token and mac',
    operationId: 'get device config',
    tags: ['config'],
    produces: [
      'application/xml',
    ],
    responses: {
      200: {
        description: 'Requested config',
      },

      default: {
        description: 'Unexpected error',
        schema: {
          $ref: '#/definitions/Error',
        },
      },
    },
  };

  return {
    parameters: [
      {
        name: 'token',
        in: 'path',
        type: 'string',
        required: true,
        description: 'device config token',
      },
      {
        name: 'file',
        in: 'path',
        type: 'string',
        required: true,
        description: 'filename like cfg{mac}.xml',
      },
    ],
    get: get,
  };
};
