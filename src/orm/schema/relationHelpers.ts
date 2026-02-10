import { Relation } from "./Relation";

/**
 * Define a belongs-to relationship (many-to-one).
 * The foreign key is on this model pointing to the target.
 * @param target - Lazy reference to the target model class
 * @param foreignKey - The foreign key column on this model (defaults to targetName + "Id")
 * @example
 * class Post {
 *   userId = integer();
 *   author = belongsTo(() => User, "userId");
 * }
 */
export const belongsTo = (target: () => any, foreignKey?: string) =>
  new Relation("belongsTo", target, foreignKey);

/**
 * Define a has-many relationship (one-to-many).
 * The foreign key is on the target model pointing to this model.
 * @param target - Lazy reference to the target model class
 * @param foreignKey - The foreign key column on the target model (defaults to thisModelName + "Id")
 * @example
 * class User {
 *   posts = hasMany(() => Post);  // Post has userId column
 * }
 */
export const hasMany = (target: () => any, foreignKey?: string) =>
  new Relation("hasMany", target, foreignKey);

/**
 * Define a has-one relationship (one-to-one).
 * The foreign key is on the target model pointing to this model.
 * @param target - Lazy reference to the target model class
 * @param foreignKey - The foreign key column on the target model (defaults to thisModelName + "Id")
 * @example
 * class User {
 *   profile = hasOne(() => Profile);  // Profile has userId column
 * }
 */
export const hasOne = (target: () => any, foreignKey?: string) =>
  new Relation("hasOne", target, foreignKey);
