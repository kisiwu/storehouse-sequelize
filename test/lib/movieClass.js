const { DataTypes, Model } = require('sequelize');

class Movie extends Model {
  static createMovie(title, rate = null) {
    return Movie.create({ title, rate });
  }

  get displayName() {
    return [this.title, this.rate].join(' ');
  }
}

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
    }
  }
};

const movieOptions = {
  modelName: 'movies', 
  tableName: 'movies'
};

const movieSettings = {
  model: Movie,
  attributes: movieSchema,
  options: movieOptions
};

module.exports = {
  Movie,
  movieSchema,
  movieOptions,
  movieSettings
};


