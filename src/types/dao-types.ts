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
    QuestionWithDocId
};