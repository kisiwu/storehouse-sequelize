import Storehouse from '@storehouse/core';
import { Sequelize } from 'sequelize';
import { SequelizeManager } from '../../src/index';
import { MovieCtor, movieSettings } from './movieClass';

import { Debug } from '@novice1/logger';
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

      const conn = await Storehouse.getConnection<Sequelize>();
      if (conn) {
        await conn.sync({force: true});
        logger.info('connected to database', conn.config.database);
      }

      const mysql = Storehouse.getManager<SequelizeManager>('mysql');
      if(mysql) {
        const MoviesModel = mysql.getModel<MovieCtor>('movies');
        if (MoviesModel) {
          // await MoviesModel.sync({ alter: true });
          const movies = await MoviesModel.findAll({ limit: 5 });
          logger.info('nb movies:', `${movies.length}`);
        }
      }

      const Movies = Storehouse.getModel<MovieCtor>('movies');
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
