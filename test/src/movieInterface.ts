import { DataTypes, Model, ModelAttributes, ModelOptions, Optional } from 'sequelize';
import { ModelSettings } from '../../src';

export interface MovieAttributes {
  id: number;
  title: string;
  rate?: number | null;
}

export type MovieCreationAttributes = Optional<MovieAttributes, 'id'>;

export interface MovieInstance
  extends Model<MovieAttributes, MovieCreationAttributes>, MovieAttributes { }

export const movieSchema: ModelAttributes<MovieInstance, MovieAttributes> = {
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
  modelName: 'movies', // We need to choose the model name
};

export const movieSettings: ModelSettings<MovieAttributes, MovieCreationAttributes> = {
  attributes: movieSchema,
  options: movieOptions
};
