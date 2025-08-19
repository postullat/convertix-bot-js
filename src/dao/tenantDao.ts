import {dbAdmin} from "../config/firebase";
import {JobStream, JobStreamWithDocId, Portfolio, PortfolioWithDocId} from "../types/dao-types";

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

//getActiveJobStream("company1");
fetchPortfolioByIds("company1", ["FX4o4MFEduAAuSKjiZ8C", "HxvZpikUa2ravFMVKth8"]);