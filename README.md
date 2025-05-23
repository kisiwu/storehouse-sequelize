# storehouse-sequelize
Sequelize (ORM) manager for @storehouse/core.

#### Note

If you are already familiar with [sequelize](https://sequelize.org/), code in typescript and define your models by extending the class [Model](https://sequelize.org/master/class/lib/model.js~Model.html), we suggest you don't use this package as you will still need to import your models everytime. However we will still cover that case [here](#extending-model). 


## Add a manager

```ts
import Storehouse from '@storehouse/core';
import { SequelizeManager } from '@storehouse/sequelize';

// register
Storehouse.add({
  local: {
    // type: '@storehouse/sequelize' if you called Storehouse.setManagerType(SequelizeManager)
    type: SequelizeManager, 
    config: {
      // Options
      options: {
        dialect: 'mysql',
        host: 'localhost',
        database: 'database',
        username: 'root',
        password: '',
        logging: false
      },

      // ModelSettings[]
      models: []
    }
  }
});
```

About **`config`**:

- **`options?`** contains Sequelize's connection [options](https://sequelize.org/master/class/lib/sequelize.js~Sequelize.html#instance-constructor-constructor).
- **`models?`** is an object that will help define the models to sequelize. Each object may contain:
    - **`attributes`**: Model attributes.
    - **`options?`**: Model options. No need for a connection instance (`sequelize`) here.
    - **`model?`**: The model class extending [Model](https://sequelize.org/master/class/lib/model.js~Model.html).


### Logging

If you don't apply `logging` option, you can enable the default logs with the package [debug](https://www.npmjs.com/package/debug).
```ts
import debug from 'debug';
debug.enable('@storehouse/sequelize*');
```

## Model definition

As for sequelize, there are 2 ways of defining models. We will give examples in typescript but the same could be done in javascript.

### Simple usage

```ts
import { 
  DataTypes, 
  Model,
  ModelStatic, 
  ModelAttributes, 
  ModelOptions, 
  Optional 
} from 'sequelize';
import Storehouse from '@storehouse/core';
import { ModelSettings, SequelizeManager } from '@storehouse/sequelize';

interface MovieAttributes {
  id: number;
  title: string;
  rate?: number | null;
}

type MovieCreationAttributes = Optional<MovieAttributes, 'id'>;

interface MovieInstance
  extends Model<MovieAttributes, MovieCreationAttributes>, MovieAttributes { }

const movieSchema: ModelAttributes<MovieInstance, MovieAttributes> = {
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

const movieOptions: ModelOptions<Model<MovieAttributes, MovieCreationAttributes>> = {
  modelName: 'movies', // We need to choose the model name
};

const movieSettings: ModelSettings<MovieAttributes, MovieCreationAttributes> = {
  attributes: movieSchema,
  options: movieOptions
};

Storehouse.add({
  local: {
    type: SequelizeManager, 
    config: {
      models: [
        // ModelSettings
        movieSettings
      ],
      options: {
        // ...
      }
    }
  }
});

// retrieve a model
const Movies = Storehouse.getModel<ModelStatic<MovieInstance>>('local', 'movies');
if (Movies) {
  const newMovie: MovieCreationAttributes = {
    title: `Last Knight ${Math.ceil(Math.random() * 1000) + 1}`,
    rate: 3
  };
  const r = await Movies.create(newMovie);
  console.log('added new movie', r.id, r.title);
}

// or retrieve the manager
const manager = Storehouse.getManager<SequelizeManager>('local');
if(manager) {
  // then retrieve the model as
  manager.getModel<ModelStatic<MovieInstance>>('movies');
  // or
  manager.getModel<MovieInstance>('movies');
}
```

### Extending Model

```ts
import { 
  DataTypes, 
  Model, 
  ModelAttributes, 
  ModelOptions, 
  Optional  
} from 'sequelize';
import Storehouse from '@storehouse/core';
import { ModelSettings, SequelizeManager } from '@storehouse/sequelize';

interface MovieAttributes {
  id: number;
  title: string;
  rate?: number | null;
}

type MovieCreationAttributes = Optional<MovieAttributes, 'id'>;

class Movie extends Model<MovieAttributes, MovieCreationAttributes> implements MovieAttributes {
  id!: number;
  title!: string;
  rate?: null | number;

  // timestamps!
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static createMovie(title: string, rate?: number): Promise<Movie> {
    return Movie.create({ title, rate });
  }

  get fullTitle(): string {
    return [this?.id, this?.title].join(' ');
  }
}

type MovieCtor = typeof Movie & { new(): Movie };

const movieSchema: ModelAttributes<Movie, MovieAttributes> = {
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

const movieOptions: ModelOptions<Model<MovieAttributes, MovieCreationAttributes>> = {
  // If "modelName" is not specified, 
  // it will be the name of the class extending Model ("Movie")
  modelName: 'movies', 
  tableName: 'movies'
};

const movieSettings: ModelSettings<MovieAttributes, MovieCreationAttributes> = {
  model: Movie,
  attributes: movieSchema,
  options: movieOptions
};

Storehouse.add({
  local: {
    type: SequelizeManager, 
    config: {
      models: [
        // ModelSettings
        movieSettings
      ],
      options: {
        // ...
      }
    }
  }
});


// retrieve a model
const Movies = Storehouse.getModel<MovieCtor>('local', 'movies');
if (Movies) {
  const r = await Movies.createMovie('Movie title', 3);
  console.log('added new movie', r.fullTitle);
}

// or retrieve the manager
const manager = Storehouse.getManager<SequelizeManager>('local');
if(manager) {
  // then retrieve the model as
  manager.getModel<MovieCtor>('movies');
}
```

### SequelizeManager

`SequelizeManager` extends the class [Sequelize](https://sequelize.org/master/class/lib/sequelize.js~Sequelize.html), so you have access to its properties and methods.

Example:
```ts
await Storehouse.getManager<SequelizeManager>('local')?.sync();
// or
await Storehouse.getConnection<Sequelize>('local')?.sync();
// or
await Storehouse.getManager<SequelizeManager>('local')?.getConnection().sync();
```

## References

- [Sequelize](http://sequelize.org/)
- [@storehouse/core](https://www.npmjs.com/package/@storehouse/core)