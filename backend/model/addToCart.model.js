import { connection, DataTypes } from "../config/db.js";
import { User } from "./user.model.js";
import { Products } from "./product.model.js";

export const AddToCart = connection.define("AddToCart", {
  cart_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  }
});

//  Associations
User.hasMany(AddToCart, {
  foreignKey: "user_id",
  onDelete: "CASCADE",
});

AddToCart.belongsTo(User, {
  foreignKey: "user_id",
});

Products.hasMany(AddToCart, {
  foreignKey: "product_id",
  onDelete: "CASCADE",
});

AddToCart.belongsTo(Products, {
  foreignKey: "product_id",
});

export default AddToCart;
