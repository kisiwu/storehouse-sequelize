const Storehouse = require('@storehouse/core');
const { SequelizeManager } = require('../../lib/index');
const { movieSettings } = require('./movieClass');

const { Debug } = require('@novice1/logger');
Debug.enable('@storehouse/sequelize*');

describe('connect class', function () {
  const { logger, params } = this.ctx.kaukau;

  it('should init and connect with model classes', async () => {
    // Storehouse.setManagerType(SequelizeManager);

    try {
      Storehouse.add({
        mysql: {
          type: SequelizeManager,
          config: {
            options: {
              dialect: params('db.dialect'),
              host: params('db.host'),
              port: params('db.port') == 0 ? undefined : params('db.port'),
              database: params('db.database'),
              username: params('db.username'),
              password: params('db.password'),
              logging: false
            },
            models: [
              movieSettings
            ]
          }
        }
      });

      /**
       * @type {import('sequelize').Sequelize}
       */
      const conn = await Storehouse.getConnection();
      if (conn) {
        // await conn.sync({force: true});
        logger.info('connected to database', conn.config.database);
      }

      /**
       * @type {import('../../lib/index').SequelizeManager}
       */
      const mysql = Storehouse.getManager('mysql');
      if(mysql) {
        /**
         * @type {typeof import('./movieClass').Movie}
         */
        const MoviesModel = mysql.getModel('movies');
        if (MoviesModel) {
          const movies = await MoviesModel.findAll({ limit: 5 });
          logger.info('nb movies:', `${movies.length}`);
        }
      }

      /**
       * @type {typeof import('./movieClass').Movie}
       */
      const Movies = Storehouse.getModel('movies');
      if (Movies) {
        const r = await Movies.createMovie(`Last Knight ${Math.ceil(Math.random() * 1000) + 1}`, 3);
        logger.info('added new movie', r.displayName);
        await r.destroy();
        logger.info('deleted movie');
  
        logger.log('nb current database movies', await Movies.count());
      }

      await Storehouse.destroy();
      logger.info('closed connections');

      logger.info('Done');
    } catch(e) {
      await Storehouse.destroy();
      logger.info('closed connections');
      throw e;
    }
  });
});
