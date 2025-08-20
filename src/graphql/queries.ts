import { gql } from "graphql-request";

export const GET_MARKETPLACE_JOB_POSTINGS = gql`
  query GetJobs($filter: JobFilterInput, $page: Int, $limit: Int) {
    jobs(filter: $filter, page: $page, limit: $limit) {
      data {
        id
        connectPrice
        contractorTier
        createdAt
        createdDateTime
        description
        enterpriseJob
        fixedPriceAmount
        fixedPriceEngagementDuration
        hourlyBudgetMax
        hourlyBudgetMin
        hourlyEngagementDuration
        hourlyEngagementType
        jobType
        personsToHire
        premium
        publishedDateTime
        skills
        status
        title
        totalApplicants
        updatedAt
        client {
          location {
            city
            country
            countryTimezone
          }
          stats {
            avgHireRate
            avgHourlyJobsRate
            companySize
            hoursCount
            industry
            totalFeedback
            totalHiredJobs
            totalPostedJobs
            totalReviews
            totalSpent
            verificationStatus
          }
        }
        questions
        category
        subcategory
      }
      total
      page
      limit
    }
  }
`;