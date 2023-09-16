// const helper = require('./../helper');

module.exports = (Device, helpers) => {
  /**
  *
  * @param {Object} req
  * @param {Object} res
  */
  function get(req, res) {
    console.log('get request query', req.query);

   Device.find(req.query.token ? {"token": req.query.token} : null, ['_id', 'key', 'token']).exec()
        .then((list) => {
          console.log('devices list:', list);
          res.status(200).json(list);
        })
        .catch((err) => {
          console.log('error', err);
          res.status(404).send();
        });
  }

  get.apiDoc = {
    description: 'get all devices or by token',
    operationId: 'get config',
    tags: ['config'],
    produces: [
      'application/json',
    ],
    responses: {
      200: {
        description: 'requested devices',
      },

      default: {
        description: 'Unexpected error',
        schema: {
          $ref: '#/definitions/Error',
        },
      },
    },
  };


  /**
  *
  * @param {Object} req
  * @param {Object} res
  */
  function post(req, res) {
    console.log('request params', req.params);
    console.log('request body:', JSON.stringify(req.body));

    const key = req.body.key;
    console.log('key:', key);
    console.log('token:', req.body.token || '');
    console.log('mac:', req.body.mac);

    const device = req.body;
    device.mac = helpers.mac.prepareMAC(device.mac);
    console.log('device prepared for db:', device);

    Device.findOneAndUpdate({key}, device, {
      upsert: true,
      returnNewDocument: true,
    })
        .then(() => {
          return Device.findOne({key});
        })
        .then((device) => {
          console.log('db return:', JSON.stringify(device));
          if (!device) {
            return Promise.reject(new Error('no device'));
          }
          res.status(200).json(device);
        })
        .catch((err) => {
          console.log('error', err);
          res.status(404).send();
        });
  }


  post.apiDoc = {
    description: 'create device config ',
    tags: ['config'],
    parameters: [
      {
        in: 'body',
        name: 'device',
        description: 'The device to create.',
        schema: {
          type: 'object',
        },
      },
    ],
    produces: [
      'application/json',
    ],
    responses: {
      200: {
        description: 'requested device',
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
    get: get,
    post: post,
  };
};

