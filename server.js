const gql = require("graphql-tag");
const { defaultFieldResolver, GraphQLString } = require("graphql");
const {
  ApolloServer,
  PubSub,
  AuthenticationError,
  SchemaDirectiveVisitor,
} = require("apollo-server");

const pubSub = new PubSub();
const NEW_ITEM = "NEW_ITEM";

class LogDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const resolver = field.resolve || defaultFieldResolver;

    field.args.push({
      type: GraphQLString,
      name: "message", //this is custom directive argument available for client to pass in
    });

    field.resolve = (root, { message, ...rest }, ctx, info) => {
      const { message: schemaMessage } = this.args;
      //we log either client provided message or default one from schema
      console.log(
        "🌞 hello, this is log from directive! ",
        message || schemaMessage
      );
      return resolver.call(this, root, rest, ctx, info);
    };
  }

  /*if we want visited type directive
   visitedType(){

  } */
}

const typeDefs = gql`
  directive @log(message: String = "defaultValue") on FIELD_DEFINITION

  type User {
    id: ID! @log(message: "id here")
    error: String! @deprecated(reason: "because I said so!")
    username: String!
    createdAt: Int!
  }

  type Settings {
    user: User!
    theme: String!
  }

  type Item {
    task: String!
  }

  input NewSettingsInput {
    user: ID!
    theme: String!
  }

  type Query {
    me: User!
    settings(user: ID!): Settings!
  }

  type Mutation {
    settings(input: NewSettingsInput!): Settings!
    createItem(task: String!): Item!
  }

  type Subscription {
    newItem: Item
  }
`;

const resolvers = {
  Query: {
    me() {
      return {
        id: 1,
        username: "coder",
        createdAt: 123545,
      };
    },
    settings(_, { user }) {
      return {
        user,
        theme: "Light",
      };
    },
  },

  Mutation: {
    settings(_, { input }) {
      return input;
    },
    createItem(_, { task }) {
      const item = { task };
      //has to match Subscription type
      pubSub.publish(NEW_ITEM, { newItem: item });
      return item;
    },
  },

  Subscription: {
    newItem: {
      subscribe: () => pubSub.asyncIterator(NEW_ITEM),
    },
  },

  Settings: {
    user() {
      return {
        id: 1,
        username: "coder",
        createdAt: 123545,
      };
    },
  },
  User: {
    error() {
      throw new AuthenticationError("not auth error example!");
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  schemaDirectives: {
    log: LogDirective,
  },
  formatError(err) {
    //here we can format, remove, push, pop error fields
    console.log(err);
    return err;
  },
  context({ connection, req }) {
    if (connection) {
      return { ...connection.context };
    }
  },
  subscriptions: {
    //params - same as req.headers
    onConnect(params) {},
  },
});

server.listen().then(({ url }) => console.log(`server at ${url}`));

/**
 * new subscription
 * 
 * //new subscription
 * subscription {
    newItem {task}
    }

    //new item (you have to execute 
    this in new tab because conn is already taken in single tab)
    mutation {
        createItem(task: "this is my task2!") {
            task
        }
    }

    mutation Signup($auth: SignupInput!) {
        signup(input: $auth) {
            token
        }
    }

    {
        "auth": {
            "email": "mensurdurakovic@gmail.com", 
            "password": "password", 
            "role": "ADMIN"
        }
    }



 * 
 */
