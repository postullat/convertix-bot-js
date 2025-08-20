import {fetchConfig} from "./src/workflows/FetchConfig";
import {jobApply} from "./src/workflows/JobApply";

const main = async () => {
    const config = await fetchConfig();
    await jobApply(config);
}

main();


