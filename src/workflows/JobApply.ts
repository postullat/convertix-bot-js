import {Config} from "../types/dao-types";
import { graphqlClient } from "../graphql/graphqlClient";
import {GET_MARKETPLACE_JOB_POSTINGS } from "../graphql/queries";


export const jobApply = async (config: Config) => {

    if(!config?.activeJobStreams) {
        throw Error("No active job streams found");
    }

    for(let jobStream of config.activeJobStreams) {

        const filter = jobStream["search-params"]
            ? { ...removeEmptyFields(jobStream["search-params"]), publishedLastMinutes: 10 }
            : undefined;

        const variables = {
            ...(filter && { filter }),
            page: 1,
            limit: 20,
        };


        const response = await graphqlClient.request(GET_MARKETPLACE_JOB_POSTINGS, variables);

        console.log("Jobs from graphql:", response);
        console.log('🤷‍♂️');
    }

}

export const removeEmptyFields = <T extends object>(obj: T | null | undefined): Partial<T> => {
    if (!obj) return {}; // <-- handle null/undefined

    return Object.entries(obj).reduce((acc, [key, value]) => {
        if (
            value == null ||
            value === '' ||
            value === 0 ||
            (Array.isArray(value) && value.length === 0)
        ) {
            return acc;
        }

        if (typeof value === 'object' && !Array.isArray(value)) {
            const nested = removeEmptyFields(value);
            if (Object.keys(nested).length > 0) {
                acc[key as keyof T] = nested as T[keyof T];
            }
            return acc;
        }

        acc[key as keyof T] = value;
        return acc;
    }, {} as Partial<T>);
};

