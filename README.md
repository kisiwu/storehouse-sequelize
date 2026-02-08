# @storehouse/sequelize

Sequelize ORM manager adapter for [@storehouse/core](https://www.npmjs.com/package/@storehouse/core). Provides seamless integration with SQL databases using the [Sequelize](https://sequelize.org/) ORM.

## Features

- **Type-safe database operations** with full TypeScript support
- **Multi-database support** (PostgreSQL, MySQL, SQLite, MariaDB, SQL Server, etc.)
- **Model registration and management** with automatic initialization
- **Health check utilities** for monitoring connection status
- **Multi-manager support** via Storehouse registry
- **Full Sequelize API** compatibility

## Prerequisites

- **Database server** (PostgreSQL, MySQL, SQLite, MariaDB, or SQL Server)
- **Node.js** 18 or higher

## Installation

```bash
npm install @storehouse/core sequelize @storehouse/sequelize
```

You'll also need to install the driver for your database:

```bash
# PostgreSQL
npm install pg pg-hstore

# MySQL / MariaDB
npm install mysql2

# SQLite
npm install sqlite3

# SQL Server
npm install tedious
```

## Quick Start

### 1. Define Your Models

**models/movie.ts**
```ts
import { 
  DataTypes, 
  Model,
  ModelStatic,
  ModelAttributes, 
  ModelOptions, 
  Optional 
} from 'sequelize';
import { ModelSettings } from '@storehouse/sequelize';

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
  modelName: 'movies',
  tableName: 'movies'
};

export const movieSettings: ModelSettings<MovieAttributes, MovieCreationAttributes> = {
  attributes: movieSchema,
  options: movieOptions
};
```

### 2. Register the Manager

**index.ts**
```ts
import { Storehouse } from '@storehouse/core';
import { SequelizeManager } from '@storehouse/sequelize';
import { movieSettings } from './models/movie';

// Register the manager
Storehouse.add({
  local: {
    type: SequelizeManager, 
    config: {
      // Sequelize connection options
      options: {
        dialect: 'postgres',
        host: 'localhost',
        port: 5432,
        database: 'mydb',
        username: 'postgres',
        password: 'password',
        logging: false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      },
      // Model definitions
      models: [movieSettings]
    }
  }
});
```

### 3. Query the Database

```ts
import { Storehouse } from '@storehouse/core';
import { SequelizeManager } from '@storehouse/sequelize';
import { ModelStatic } from 'sequelize';
import { MovieInstance } from './models/movie';

// Get the manager
const manager = Storehouse.getManager<SequelizeManager>('local');

if (manager) {
  // Get the model
  const Movies = manager.getModel<ModelStatic<MovieInstance>>('movies');
  
  // Create a record
  const movie = await Movies.create({
    title: 'The Matrix',
    rate: 5
  });
  console.log('Created:', movie.toJSON());
  
  // Query records
  const allMovies = await Movies.findAll({
    where: { rate: 5 }
  });
  console.log('Found:', allMovies.length);
  
  // Use raw queries
  const [results] = await manager.query('SELECT * FROM movies WHERE rate > ?', {
    replacements: [3]
  });
  console.log('Results:', results);
}
```

## API Reference

### Configuration

The `config` object passed to the manager contains:

- **`options?`** - Sequelize connection [options](https://sequelize.org/docs/v6/other-topics/dialect-specific-things/):
  - `dialect`: Database type ('mysql', 'postgres', 'sqlite', 'mariadb', 'mssql')
  - `host`: Database host
  - `port`: Database port
  - `database`: Database name
  - `username`: Database user
  - `password`: Database password
  - `logging`: Logging function or false to disable
  - `pool`: Connection pool configuration
  
- **`models?`** - Array of `ModelSettings` objects containing:
  - `attributes`: Model attribute definitions
  - `options?`: Model options (modelName, tableName, timestamps, etc.)
  - `model?`: Optional pre-defined model class extending Model

### Helper Functions

The package provides helper functions that throw errors instead of returning undefined, making your code cleaner and safer.

#### `getManager()`

Retrieves a SequelizeManager instance from the registry.

```ts
import { Storehouse } from '@storehouse/core';
import { getManager } from '@storehouse/sequelize';

const manager = getManager(Storehouse, 'local');
await manager.sync();
```

**Throws:**
- `ManagerNotFoundError` - If the manager doesn't exist
- `InvalidManagerConfigError` - If the manager is not a SequelizeManager instance

#### `getConnection()`

Retrieves the Sequelize connection instance.

```ts
import { Storehouse } from '@storehouse/core';
import { getConnection } from '@storehouse/sequelize';
import { QueryTypes } from 'sequelize';

const sequelize = getConnection(Storehouse, 'local');
const users = await sequelize.query('SELECT * FROM users', {
  type: QueryTypes.SELECT
});
```

**Throws:**
- `ManagerNotFoundError` - If the manager doesn't exist
- `InvalidManagerConfigError` - If the connection is not a Sequelize instance

#### `getModel()`

Retrieves a model from the registry.

```ts
import { Storehouse } from '@storehouse/core';
import { getModel } from '@storehouse/sequelize';
import { ModelStatic } from 'sequelize';
import { MovieInstance } from './models/movie';

// Get model from default manager
const Movies = getModel<MovieInstance>(Storehouse, 'movies');
// or
// const Movies = getModel<ModelStatic<MovieInstance>>(Storehouse, 'movies');

// Get model from specific manager
const MoviesFromLocal = getModel<MovieInstance>(Storehouse, 'local', 'movies');
// or
// const MoviesFromLocal = getModel<ModelStatic<MovieInstance>>(Storehouse, 'local', 'movies');
```

**Throws:**
- `ModelNotFoundError` - If the model doesn't exist

### SequelizeManager Class

The SequelizeManager extends the Sequelize class with additional Storehouse integration features.

#### Methods

##### `getConnection(): Sequelize`

Returns the Sequelize instance (the manager itself).

```ts
const sequelize = manager.getConnection();
await sequelize.sync();
```

##### `closeConnection(): Promise<void>`

Closes the database connection and terminates all connections in the pool.

```ts
await manager.closeConnection();
```

##### `getModel<M>(name): ModelStatic<M>`

Retrieves a model that has been defined in this Sequelize instance.

```ts
const Movies = manager.getModel<MovieInstance>('movies');
const movie = await Movies.findByPk(1);
```

##### `isConnected(): Promise<boolean>`

Checks if the database connection is active by running an authentication test.

```ts
const connected = await manager.isConnected();
if (connected) {
  console.log('Database is connected');
}
```

##### `healthCheck(): Promise<SequelizeHealthCheckResult>`

Performs a comprehensive health check including connectivity test and metadata.

```ts
const health = await manager.healthCheck();

if (health.healthy) {
  console.log(`✓ Sequelize is healthy`);
  console.log(`  Database: ${health.details.dialect} v${health.details.databaseVersion}`);
  console.log(`  Latency: ${health.details.latency}`);
  console.log(`  Models: ${health.details.models?.join(', ')}`);
} else {
  console.error(`✗ Sequelize is unhealthy: ${health.message}`);
}
```

### Health Check Result

The health check returns a detailed result object:

- `healthy: boolean` - Overall health status
- `message: string` - Descriptive message about the health status
- `timestamp: number` - Timestamp when the health check was performed
- `latency: number` - Response time in milliseconds
- `details: object` - Detailed connection information
  - `name: string` - Manager name
  - `dialect: string` - Database dialect
  - `databaseVersion?: string` - Database version
  - `models?: string[]` - Array of registered model names
  - `modelCount?: number` - Total number of models
  - `latency?: string` - Response time in ms
  - `error?: string` - Error details (if unhealthy)

## Advanced Usage

### Extending Model Classes

For more advanced use cases, you can define model classes that extend Sequelize's Model:

```ts
import { 
  DataTypes, 
  Model, 
  ModelAttributes, 
  ModelOptions, 
  Optional  
} from 'sequelize';
import { ModelSettings } from '@storehouse/sequelize';

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

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Custom static method
  static createMovie(title: string, rate?: number): Promise<Movie> {
    return Movie.create({ title, rate });
  }

  // Custom instance getter
  get fullTitle(): string {
    return `${this.id}: ${this.title}`;
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
    }
  }
};

const movieOptions: ModelOptions<Model<MovieAttributes, MovieCreationAttributes>> = {
  modelName: 'movies',
  tableName: 'movies'
};

export const movieSettings: ModelSettings<MovieAttributes, MovieCreationAttributes> = {
  model: Movie,  // Provide the model class
  attributes: movieSchema,
  options: movieOptions
};
```

Usage:

```ts
import { getModel } from '@storehouse/sequelize';

const Movies = getModel<MovieCtor>(Storehouse, 'local', 'movies');
const movie = await Movies.createMovie('Blade', 5);
console.log(movie.fullTitle); // "1: Blade"
```

### Multiple Managers

You can register multiple database connections:

```ts
import { Storehouse } from '@storehouse/core';
import { SequelizeManager } from '@storehouse/sequelize';

Storehouse.add({
  primary: {
    type: SequelizeManager,
    config: {
      options: {
        dialect: 'postgres',
        host: 'localhost',
        database: 'maindb',
        username: 'postgres',
        password: 'password'
      },
      models: [/* ... */]
    }
  },
  analytics: {
    type: SequelizeManager,
    config: {
      options: {
        dialect: 'mysql',
        host: 'analytics.example.com',
        database: 'analyticsdb',
        username: 'readonly',
        password: 'password'
      },
      models: [/* ... */]
    }
  }
});

// Access specific managers
const primaryManager = getManager(Storehouse, 'primary');
const analyticsManager = getManager(Storehouse, 'analytics');
```

### Using the Manager Type

Set the manager type to simplify configuration and use string identifiers instead of class references:

```ts
import { Storehouse } from '@storehouse/core';
import { SequelizeManager } from '@storehouse/sequelize';

// Set default manager type
Storehouse.setManagerType(SequelizeManager);

// Now you can use type string instead of class
Storehouse.add({
  local: {
    type: '@storehouse/sequelize',
    config: {
      options: {
        dialect: 'mysql',
        host: 'localhost',
        database: 'mydb',
        username: 'root',
        password: 'password'
      },
      models: []
    }
  }
});
```

### Transaction Management

```ts
import { Storehouse } from '@storehouse/core';
import { getConnection } from '@storehouse/sequelize';

const sequelize = getConnection(Storehouse, 'local');

// Managed transaction
await sequelize.transaction(async (t) => {
  await Movies.create({
    title: 'New Movie',
    rate: 4
  }, { transaction: t });
  
  await Reviews.create({
    movieId: 1,
    text: 'Great!'
  }, { transaction: t });
  
  // Automatically commits or rolls back
});

// Unmanaged transaction
const t = await sequelize.transaction();
try {
  await Movies.create({ title: 'New Movie', rate: 4 }, { transaction: t });
  await Reviews.create({ movieId: 1, text: 'Great!' }, { transaction: t });
  await t.commit();
} catch (error) {
  await t.rollback();
  throw error;
}
```

### Logging

If you don't specify the `logging` option, you can enable the default logs using the [@novice1/logger](https://www.npmjs.com/package/@novice1/logger) package:

```ts
import { Debug } from '@novice1/logger';

Debug.enable('@storehouse/sequelize*');
```

Or disable logging entirely:

```ts
Storehouse.add({
  local: {
    type: SequelizeManager,
    config: {
      options: {
        // ...
        logging: false
      }
    }
  }
});
```

## TypeScript Support

The package is written in TypeScript and provides full type definitions for type-safe operations:

```ts
import { Storehouse } from '@storehouse/core';
import { ModelStatic } from 'sequelize';
import { SequelizeManager, getManager, getModel } from '@storehouse/sequelize';

// Typed manager
const manager = getManager<SequelizeManager>(Storehouse, 'local');

// Typed models
interface User {
  id: number;
  name: string;
  email: string;
}

const Users = getModel<User>(Storehouse, 'local', 'users');

// Type-safe query results
const users = await Users.findAll();
// users is typed as Model<User>[]

users.forEach(user => {
  console.log(user.name); // Fully typed
});

// Type-safe creation
const newUser = await Users.create({
  name: 'John Doe',
  email: 'john@example.com'
});
```

## Error Handling

All helper functions throw specific errors for better error handling:

```ts
import { Storehouse } from '@storehouse/core';
import { getManager, getModel } from '@storehouse/sequelize';
import {
  ManagerNotFoundError,
  InvalidManagerConfigError,
  ModelNotFoundError
} from '@storehouse/core';

try {
  const manager = getManager(Storehouse, 'nonexistent');
} catch (error) {
  if (error instanceof ManagerNotFoundError) {
    console.error('Manager not found:', error.message);
  } else if (error instanceof InvalidManagerConfigError) {
    console.error('Invalid manager type:', error.message);
  }
}

try {
  const Movies = getModel(Storehouse, 'nonexistent', 'movies');
} catch (error) {
  if (error instanceof ModelNotFoundError) {
    console.error('Model not found:', error.message);
  }
}
```

## Best Practices

1. **Define models in separate files** - Keep model definitions modular and reusable
2. **Use TypeScript interfaces** - Define proper types for your model attributes
3. **Enable connection pooling** - Configure appropriate pool sizes for production
4. **Use transactions** - Wrap related operations in transactions for data consistency
5. **Handle errors properly** - Implement reconnection logic for critical operations
6. **Use health checks** - Monitor database health in production environments
7. **Close connections on shutdown** - Call `closeConnection()` when shutting down
8. **Use parameterized queries** - Always use replacements to prevent SQL injection
9. **Disable logging in production** - Set `logging: false` or use conditional logging
10. **Leverage Sequelize features** - Use validations, hooks, and associations

## Resources

- [Documentation](https://kisiwu.github.io/storehouse/sequelize/latest/)
- [@storehouse/core](https://www.npmjs.com/package/@storehouse/core)
- [Sequelize](https://sequelize.org/)
- [Sequelize Documentation](https://sequelize.org/docs/v6/)

## License

MIT
