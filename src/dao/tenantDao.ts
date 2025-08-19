import {dbAdmin} from "../config/firebase";
import {JobStream, JobStreamWithDocId} from "../types/dao-types";

export const getActiveJobStream = async (tenantId: string): Promise<JobStream[] | null> => {
    try {
        console.log("Job streams fetch started");
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

        console.log(`Found ${jobStreams.length} job streams:`);
        return jobStreams;
    } catch (error) {
        console.error("Error fetching job streams:", error);
        return null;
    }
}

getActiveJobStream("company1");