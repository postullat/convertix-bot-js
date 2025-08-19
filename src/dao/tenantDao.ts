import {dbAdmin} from "../config/firebase";
import {
    JobStats, JobStatsWithDocId,
    JobStream,
    JobStreamWithDocId,
    Portfolio,
    PortfolioWithDocId,
    Question,
    QuestionWithDocId
} from "../types/dao-types";

export const getActiveJobStream = async (tenantId: string): Promise<JobStream[] | null> => {
    try {
        console.log("Active job streams fetch started");
        const collectionRef = dbAdmin.collection("tenants")
            .doc("company1")
            .collection("job-streams")
            .where("isActive", "==", true)
            .orderBy("order", "asc");

        const querySnapshot = await collectionRef.get();

        if (querySnapshot.empty) {
            console.log("No job stream documents found!");
            return [];
        }

        const jobStreams: JobStreamWithDocId[] = querySnapshot.docs.map(doc => ({
            docId: doc.id,
            ...doc.data() as JobStream
        }));

        console.log(`Job streams: ${JSON.stringify(jobStreams)}`);
        console.log(`Found ${jobStreams.length} active job streams:`);
        return jobStreams;
    } catch (error) {
        console.error("Error fetching active job streams:", error);
        return null;
    }
}

export const fetchPortfolioByIds = async (
    tenantId: string,
    portfolioIds: string[]
): Promise<PortfolioWithDocId[] | null> => {
    try {
        if (!portfolioIds || portfolioIds.length === 0) {
            console.log("No portfolio IDs provided");
            return [];
        }

        console.log(`Fetching ${portfolioIds.length} portfolio items for tenant: ${tenantId}`);

        // Firestore has a limit of 10 items per 'in' query
        // So we need to batch the requests if we have more than 10 IDs
        const batchSize = 10;
        const portfolioItems: PortfolioWithDocId[] = [];

        for (let i = 0; i < portfolioIds.length; i += batchSize) {
            const batch = portfolioIds.slice(i, i + batchSize);

            const collectionRef = dbAdmin
                .collection("tenants")
                .doc(tenantId)
                .collection("portfolio")
                .where("__name__", "in", batch); // __name__ refers to document ID

            const querySnapshot = await collectionRef.get();

            querySnapshot.docs.forEach(doc => {
                portfolioItems.push({
                    docId: doc.id,
                    ...doc.data() as Portfolio
                });
            });
        }

        console.log(`Portfolio: ${JSON.stringify(portfolioItems)}`);
        console.log(`Found ${portfolioItems.length} portfolio items out of ${portfolioIds.length} requested`);
        return portfolioItems;

    } catch (error) {
        console.error("Error fetching portfolio items:", error);
        return null;
    }
};

export const fetchQuestionsByIds = async (
    tenantId: string,
    questionIds: string[]
): Promise<QuestionWithDocId[] | null> => {
    try {
        if (!questionIds || questionIds.length === 0) {
            console.log("No question IDs provided");
            return [];
        }

        console.log(`Fetching ${questionIds.length} questions for tenant: ${tenantId}`);

        const batchSize = 10;
        const questions: QuestionWithDocId[] = [];

        for (let i = 0; i < questionIds.length; i += batchSize) {
            const batch = questionIds.slice(i, i + batchSize);

            const collectionRef = dbAdmin
                .collection("tenants")
                .doc(tenantId)
                .collection("questions")
                .where("__name__", "in", batch); // __name__ refers to document ID

            const querySnapshot = await collectionRef.get();

            querySnapshot.docs.forEach(doc => {
                questions.push({
                    docId: doc.id,
                    ...doc.data() as Question
                });
            });
        }

        console.log(`Questions: ${JSON.stringify(questions)}`);
        console.log(`Found ${questions.length} questions out of ${questionIds.length} requested`);
        return questions;

    } catch (error) {
        console.error("Error fetching questions:", error);
        return null;
    }
};


export const fetchRecentJobsStats = async (
    tenantId: string,
    limitCount: number = 30
): Promise<JobStatsWithDocId[] | null> => {
    try {
        console.log(`Fetching jobs from last 15 minutes for tenant: ${tenantId}`);

        // Calculate the timestamp for 15 minutes ago
        const fifteenMinutesAgo = new Date();
        fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

        const collectionRef = dbAdmin
            .collection("tenants")
            .doc(tenantId)
            .collection("job-stats")
            .where("jobPostedDate", ">=", fifteenMinutesAgo)
            .orderBy("jobPostedDate", "desc") // Order by most recent first
            .limit(limitCount); // Configurable limit to prevent excessive data reads

        const querySnapshot = await collectionRef.get();

        const jobs: JobStatsWithDocId[] = [];
        querySnapshot.docs.forEach(doc => {
            jobs.push({
                docId: doc.id,
                ...doc.data() as JobStats
            });
        });

        console.log(`Jobs: ${JSON.stringify(jobs)}`);
        console.log(`Found ${jobs.length} jobs posted in the last 15 minutes`);
        return jobs;

    } catch (error) {
        console.error("Error fetching recent jobs:", error);
        return null;
    }
};


fetchRecentJobsStats("company1")
//getActiveJobStream("company1");
//fetchPortfolioByIds("company1", ["FX4o4MFEduAAuSKjiZ8C", "HxvZpikUa2ravFMVKth8"]);
//fetchQuestionsByIds("company1", ["v73iWD0UZTx53PDl29tB", "nfow2zpxcELsotP0Vgy2", "4c570aed-770d-49b1-adb9-edde7810876f"]);