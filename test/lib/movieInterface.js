const { DataTypes } = require('sequelize');


const movieSchema = {
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
  }
};

const movieOptions = {
  modelName: 'movies', // We need to choose the model name
};

const movieSettings = {
  attributes: movieSchema,
  options: movieOptions
};

module.exports = {
  movieSchema,
  movieOptions,
  movieSettings
};
