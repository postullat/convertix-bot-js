import {Config, JobStream, UpworkApiResponse, UpworkJob} from "../types/dao-types";
import { graphqlClient } from "../graphql/graphqlClient";
import {GET_MARKETPLACE_JOB_POSTINGS } from "../graphql/queries";
import {getAiCoverLetter} from "../openAi/openAiClient";


export const jobApply = async (config: Config) => {

    if(!config?.activeJobStreams) {
        throw Error("No active job streams found");
    }

    for(let jobStream of config.activeJobStreams) {

        const upworkJobs: UpworkJob[] = await getMarketPlacedJobs(jobStream);

        if(isNullOrEmptyArray(upworkJobs)) {
            console.log(`Upwork job list for "${jobStream.title}" are empty at this time`);
            continue;
        }

        console.log(`Upwork job list for "${jobStream.title}" length ${upworkJobs.length}`);

        for(let jobPost of upworkJobs) {
            if(jobPost?.questions?.length > 0) {
                console.log(`Upwork job title "${jobPost.title}" has custom questions. 
                 \n We do not support custom questions now`);
                //todo: get question ids
                //todo: get username and id
                continue;
            }

            //generate cover letter :)
            const coverLetter: string = await getAiCoverLetter(jobPost, jobStream);
            console.log(`Cover letter: ${coverLetter}`);

            //send

            //save to firebase job-stats
        }

        console.log('🤷‍♂️');
    }

}

const getMarketPlacedJobs = async (jobStream: JobStream): Promise<UpworkJob[]> => {
    const filter = jobStream["search-params"]
        ? { ...removeEmptyFields(jobStream["search-params"]), publishedLastMinutes: 10 }
        : undefined;

    const variables = {
        ...(filter && { filter }),
        page: 1,
        limit: 20,
    };

    const response: UpworkApiResponse = await graphqlClient.request(GET_MARKETPLACE_JOB_POSTINGS, variables);
    return response?.jobs?.data;
}

function isNullOrEmptyArray(val: any) {
    return val === null || val === undefined || (Array.isArray(val) && val.length === 0);
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

