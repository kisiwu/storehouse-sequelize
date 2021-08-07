import { DataTypes, Model, ModelAttributes, ModelOptions, Optional  } from 'sequelize';
import { ModelSettings } from '../../src';
/*import {
  ModelSettings
} from '../../src/index'
*/

export interface MovieAttributes {
  id: number;
  title: string;
  rate?: number | null;
}

export type MovieCreationAttributes = Optional<MovieAttributes, 'id'>;

export class Movie extends Model<MovieAttributes, MovieCreationAttributes> implements MovieAttributes {
  id!: number;
  title!: string;
  rate?: null | number;

  // timestamps!
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static createMovie(title: string, rate?: number): Promise<Movie> {
    return Movie.create({ title, rate });
  }

  get displayName(): string {
    return [this?.title, this?.rate].join(' ');
  }
}

export type MovieCtor = typeof Movie & { new(): Movie };

export const movieSchema: ModelAttributes<Movie, MovieAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  rate: {
    type: DataTypes.TINYINT,
    validate: {
      max: 5,
      min: 1,
      isInt: true
    },
    // allowNull: true, // allowNull defaults to true
  }
};

export const movieOptions: ModelOptions<Model<MovieAttributes, MovieCreationAttributes>> = {
  // If "modelName" is not explicitly defined, 
  // it will be the name of the class model ("Movie")
  modelName: 'movies', 
  tableName: 'movies'
};

export const movieSettings: ModelSettings<MovieAttributes, MovieCreationAttributes> = {
  model: Movie,
  attributes: movieSchema,
  options: movieOptions
};
