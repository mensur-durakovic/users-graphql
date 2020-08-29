const resolvers = require("../src/resolvers");
const { models } = require("../src/db");

describe("resolvers", () => {
  test("feed", () => {
    const result = resolvers.Query.feed(null, null, {
      models: {
        Post: {
          findMany() {
            return ["hello"];
          },
        },
      },
    });

    expect(result).toEqual(["hello"]);
  });
});
