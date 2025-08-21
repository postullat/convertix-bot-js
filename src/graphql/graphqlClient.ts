import { GraphQLClient } from "graphql-request";

export const graphqlClient = new GraphQLClient("https://api.convertix.io/graphql", {
    headers: {
        // If API requires auth token, put here:
        // Authorization: `Bearer ${process.env.CONVERTIX_API_TOKEN}`,
    },
});
