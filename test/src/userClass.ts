import { DataTypes, Model, ModelAttributes, ModelOptions, Optional  } from 'sequelize';
import { ModelSettings } from '../../src';

export interface UserAttributes {
  id: number;
  name: string;
  preferredName: string | null;
}

export type UserCreationAttributes = Optional<UserAttributes, 'id'>;

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number; // Note that the `null assertion` `!` is required in strict mode.
  public name!: string;
  public preferredName!: string | null; // for nullable fields

  // timestamps!
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export type UserCtor = typeof User & { new(): User };

export const userSchema: ModelAttributes<User, UserAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: new DataTypes.STRING(128),
    allowNull: false,
  },
  preferredName: {
    type: new DataTypes.STRING(128),
    allowNull: true,
  },
};

export const userOptions: ModelOptions<Model<UserAttributes, UserCreationAttributes>> = {
  // If "modelName" is not explicitly defined, 
  // it will be the name of the class model ("User")
  modelName: 'users', 
  tableName: 'users'
};

export const userSettings: ModelSettings<UserAttributes, UserCreationAttributes> = {
  model: User,
  attributes: userSchema,
  options: userOptions
};
