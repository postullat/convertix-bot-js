import {Config} from "../types/dao-types";
import {fetchRecentJobsStats, getActiveJobStream} from "../dao/tenantDao";

const tenantId: string = "company1";
let activeJobStreams;
let recentJobsStats;

//todo: last time job stream updated (to not fetch its config again and again)

export const fetchConfig = async (): Promise<Config> => {
    activeJobStreams = await getActiveJobStream(tenantId);
    recentJobsStats = await fetchRecentJobsStats(tenantId);

    //todo: enrich job streams with portfolio and questions
    const config = {
        activeJobStreams,
        recentJobsStats
    }
    return config;
}