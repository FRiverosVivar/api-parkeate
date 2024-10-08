import { parseLiteral } from "../../utils/utils";
import { GraphQLScalarType } from "graphql/type";
import { Kind } from "graphql";

export const GeometryGQL = new GraphQLScalarType({
  name: "Geometry",
  description: "Geometry scalar type",
  parseValue(value: any) {
    return value;
  },

  serialize(value: any) {
    return value;
  },

  parseLiteral(ast: {
    kind: any;
    fields: { name: { value: string | number }; value: any }[];
  }) {
    if (ast.kind === Kind.OBJECT) {
      const value = Object.create(null);
      ast.fields.forEach(
        (field: { name: { value: string | number }; value: any }) => {
          value[field.name.value] = parseLiteral(field.value);
        }
      );
      return value;
    }
    return null;
  },
});
