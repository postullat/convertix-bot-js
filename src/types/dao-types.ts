import {firestore} from "firebase-admin";
import Timestamp = firestore.Timestamp;

interface FirebaseTimestamp {
    _seconds: number;
    _nanoseconds: number;
}

interface ProposalPrompt {
    job: string;
    prompt: string;
}

interface FreelancerProfile {
    "employee-id": string;
    "sub-profile": string;
    "bid-rate": string;
}

interface CustomQuestion {
    question: string;
    answer: string;
    id: string;
}

interface SearchParams {
    duration: string[];
    avgHourlyJobsRate: number;
    subcategories: string[];
    includeClientWithNoFeedback: boolean;
    fixedPriceAmount: number;
    totalReviews: number;
    hireRate: number;
    totalSpent: number;
    hourlyEngagementType: string[];
    countriesInclude: string[];
    skills: string;
    title: string;
    hourlyBudgetMin: number;
    countriesExclude: string[];
    description: string;
    paymentVerified: boolean;
    categories: string[];
}

interface JobStream {
    id: number;
    createdAt: FirebaseTimestamp;
    updatedAt: FirebaseTimestamp;
    title: string;
    "proposal-prompts": ProposalPrompt[];
    "freelancer-profile": FreelancerProfile;
    selectedQuestions: string[];
    customQuestions: CustomQuestion[];
    assignedProjects: string[];
    "search-params": SearchParams;
    isActive: boolean;
    order: number;
}

interface JobStreamWithDocId extends JobStream {
    docId: string; // Firestore document ID
}

interface Portfolio {
    id: number;
    technologies: string[];
    metaTitle: string;
    firebaseId: string;
    title: string;
    url: string;
    description: string;
    assignedJobStreams: string[];
}

// Portfolio with document ID
interface PortfolioWithDocId extends Portfolio {
    docId: string;
}

interface Question {
    question: string;
    answer: string;
    id: string;
    predefined: boolean;
}

interface QuestionWithDocId extends Question {
    docId: string;
}

interface JobStats {
    businessManager: string;
    closedDate: FirebaseTimestamp;
    connectsSpent: number;
    createdAt: FirebaseTimestamp;
    declinedDate: string;
    freelancer: string;
    hiredDate: FirebaseTimestamp;
    id: number;
    jobStreamId: number;
    promptId: number;
    jobId: string;
    proposalId: string;
    proposalSentDate: FirebaseTimestamp;
    proposalUrl: string;
    proposalViewedDate: FirebaseTimestamp;
    repliedDate: FirebaseTimestamp;
    title: string;
    updatedAt: FirebaseTimestamp;
    jobPostedDate: FirebaseTimestamp;
}

interface JobStatsWithDocId extends JobStats {
    docId: string;
}

type MinimalJobStats = Pick<JobStats, "id" | "jobStreamId" | "jobId" | "proposalId">;
type MinimalJobStatsWithDocId = MinimalJobStats & { docId: string };

interface Config {
    activeJobStreams: JobStream[] | null;
    recentJobsStats: Record<number, MinimalJobStatsWithDocId[]> | null;
}

interface Location {
    city: string;
    country: string;
    countryTimezone: string;
}

// Client stats interface
interface ClientStats {
    avgHireRate: number | null;
    avgHourlyJobsRate: number | null;
    companySize: number;
    hoursCount: number | null;
    industry: string;
    totalFeedback: number;
    totalHiredJobs: number | null;
    totalPostedJobs: number | null;
    totalReviews: number;
    totalSpent: number;
    verificationStatus: boolean;
}

// Client interface
interface Client {
    location: Location;
    stats: ClientStats;
}

// Main job interface
interface UpworkJob {
    id: string;
    connectPrice: number;
    contractorTier: "EntryLevel" | "Intermediate" | "Expert";
    createdAt: string;
    createdDateTime: string;
    description: string;
    enterpriseJob: boolean;
    fixedPriceAmount: number | null;
    fixedPriceEngagementDuration: string | null;
    hourlyBudgetMax: number | null;
    hourlyBudgetMin: number | null;
    hourlyEngagementDuration: string | null;
    hourlyEngagementType: string | null;
    jobType: "FIXED" | "HOURLY";
    personsToHire: number;
    premium: boolean;
    publishedDateTime: string;
    skills: string[];
    status: "COMPLETED" | "ACTIVE" | "CLOSED";
    title: string;
    totalApplicants: number | null;
    updatedAt: string;
    client: Client;
    questions: string[];
    category: string;
    subcategory: string;
}

// Response wrapper interface
interface JobsResponse {
    data: UpworkJob[];
    total: number;
    page: number;
    limit: number;
}

// Root interface
interface UpworkApiResponse {
    jobs: JobsResponse;
}

export type {
    FirebaseTimestamp,
    ProposalPrompt,
    FreelancerProfile,
    CustomQuestion,
    SearchParams,
    JobStream,
    JobStreamWithDocId,
    Portfolio,
    PortfolioWithDocId,
    Question,
    QuestionWithDocId,
    JobStats,
    JobStatsWithDocId,
    MinimalJobStats,
    MinimalJobStatsWithDocId,
    Config,
    Location,
    ClientStats,
    Client,
    UpworkJob,
    JobsResponse,
    UpworkApiResponse

};