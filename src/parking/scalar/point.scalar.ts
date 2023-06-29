import { GraphQLScalarType, Kind } from 'graphql';
import { parseLiteral } from "../../utils/utils";

export const GeometryGQL = new GraphQLScalarType({
  name: 'Geometry',
  description: 'Geometry scalar type',
  parseValue(value) {
    return value;
  },

  serialize(value) {
    return value;
  },

  parseLiteral(ast) {
    if (ast.kind === Kind.OBJECT) {
      const value = Object.create(null);
      ast.fields.forEach((field) => {
        value[field.name.value] = parseLiteral(field.value);
      });
      return value;
    }
    return null;
  }
});
