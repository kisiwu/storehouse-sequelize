import Storehouse from '@storehouse/core';
import { ModelStatic, Sequelize } from 'sequelize';
import { SequelizeManager } from '../../src/index';
import { MovieCreationAttributes, MovieInstance, movieSettings } from './movieInterface';

import { Debug } from '@novice1/logger';
Debug.enable('@storehouse/sequelize*');

describe('connect interface', function () {
  const { logger, params } = this.ctx.kaukau;

  it('should init and connect with interfaces', async () => {
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
        //await conn.sync({force: true});
        logger.info('connected to database', conn.config.database);
      }

      const mysql = Storehouse.getManager<SequelizeManager>('mysql');
      if(mysql) {
        const MoviesModel = mysql.getModel<MovieInstance>('movies');
        if (MoviesModel) {
          // await MoviesModel.sync({ alter: true });
          const movies = await MoviesModel.findAll({ limit: 5 });
          logger.info('nb movies:', `${movies.length}`);
        }
      }

      const Movies = Storehouse.getModel<ModelStatic<MovieInstance>>('movies');
      if (Movies) {
        const newMovie: MovieCreationAttributes = {
          title: `Last Knight ${Math.ceil(Math.random() * 1000) + 1}`
        };
        newMovie.rate = 3;
        const r = await Movies.create(newMovie);
        logger.info('added new movie', r.id, r.title);
        logger.log('nb current database movies', await Movies.count());
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
