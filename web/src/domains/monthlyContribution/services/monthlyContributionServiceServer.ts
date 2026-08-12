// src/domains/monthlyContribution/services/monthlyContributionServiceServer.ts
import "server-only";
import { BaseRepository } from "@/lib/baseRepository";
import { serverAdapter } from "@/lib/http/serverAdapter";
import type { MonthlyContribution } from "../types";

class MonthlyContributionServiceServer extends BaseRepository<MonthlyContribution> {
    protected resource = "monthly-contributions";
    protected adapter = serverAdapter;

}
export const monthlyContributionServiceServer = new MonthlyContributionServiceServer();
